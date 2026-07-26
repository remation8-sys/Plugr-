import { createHash } from 'node:crypto'
import { safeHttp } from '@activepieces/server-utils'
import { ActivepiecesError, apId, ErrorCode, FailedStep, isNil, tryCatch, WebPushConfig, WebPushSubscriptionRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Brackets } from 'typeorm'
import * as webPush from 'web-push'
import { repoFactory } from '../core/db/repo-factory'
import { redisConnections } from '../database/redis-connections'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { projectService } from '../project/project-service'
import { WebPushSubscriptionEntity, WebPushSubscriptionSchema } from './web-push.entity'
import { getWebPushErrorStatusCode, isAllowedWebPushEndpoint } from './web-push.utils'

const DAY_IN_SECONDS = 24 * 60 * 60
const FLOW_FAILURE_TTL_SECONDS = 60 * 60
const SEND_TIMEOUT_MILLISECONDS = 10_000
const subscriptionRepo = repoFactory(WebPushSubscriptionEntity)
const { httpsAgent } = safeHttp.buildAgents({ allowList: [] })

const webPushService = (log: FastifyBaseLogger): WebPushService => ({
    getConfig(): WebPushConfig {
        const vapidDetails = getVapidDetails()
        return {
            enabled: !isNil(vapidDetails),
            publicKey: vapidDetails?.publicKey ?? null,
        }
    },

    async upsert(params: UpsertParams): Promise<void> {
        if (isNil(getVapidDetails())) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Browser notifications are not configured',
                },
            })
        }
        assertAllowedSubscription(params.subscription)
        await subscriptionRepo().upsert({
            id: apId(),
            platformId: params.platformId,
            userId: params.userId,
            endpoint: params.subscription.endpoint,
            endpointHash: getEndpointHash(params.subscription.endpoint),
            auth: params.subscription.keys.auth,
            p256dh: params.subscription.keys.p256dh,
            expirationTime: isNil(params.subscription.expirationTime)
                ? null
                : new Date(params.subscription.expirationTime),
        }, {
            conflictPaths: ['platformId', 'endpointHash'],
            skipUpdateIfNoValuesChanged: true,
        })
    },

    async delete(params: DeleteParams): Promise<void> {
        await subscriptionRepo().delete({
            platformId: params.platformId,
            userId: params.userId,
            endpoint: params.endpoint,
            endpointHash: getEndpointHash(params.endpoint),
        })
    },

    async sendFlowFailure(params: SendFlowFailureParams): Promise<void> {
        const vapidDetails = getVapidDetails()
        if (isNil(vapidDetails)) {
            return
        }

        const project = await projectService(log).getOneOrThrow(params.projectId)
        const subscriptions = await getProjectSubscriptions({
            ownerId: project.ownerId,
            platformId: project.platformId,
            projectId: project.id,
        })
        if (subscriptions.length === 0) {
            return
        }

        const redisConnection = await redisConnections.useExisting()
        const failureKey = 'web_push_flow_fail_count:' + project.platformId + ':' + params.flowVersionId
        const numberOfFailures = await redisConnection.incrby(failureKey, 1)
        await redisConnection.expire(failureKey, DAY_IN_SECONDS)
        if (numberOfFailures > 1) {
            return
        }

        const flowVersion = await flowVersionService(log).getFlowVersionOrThrow({
            flowId: params.flowId,
            projectId: params.projectId,
            versionId: params.flowVersionId,
        })
        const payload = JSON.stringify({
            title: 'Flow needs attention',
            body: flowVersion.displayName + ' failed at ' + params.failedStep.displayName + '.',
            url: '/projects/' + project.id + '/runs/' + params.flowRunId,
            tag: 'flow-failure-' + params.flowId,
        } satisfies WebPushPayload)

        await Promise.all(subscriptions.map(async (subscription) => {
            const { error } = await tryCatch(() => webPush.sendNotification({
                endpoint: subscription.endpoint,
                expirationTime: subscription.expirationTime?.getTime() ?? null,
                keys: {
                    auth: subscription.auth,
                    p256dh: subscription.p256dh,
                },
            }, payload, {
                agent: httpsAgent,
                timeout: SEND_TIMEOUT_MILLISECONDS,
                TTL: FLOW_FAILURE_TTL_SECONDS,
                topic: params.flowId,
                urgency: 'high',
                vapidDetails,
            }))

            if (isNil(error)) {
                return
            }
            const statusCode = getWebPushErrorStatusCode(error)
            if (statusCode === 404 || statusCode === 410) {
                await subscriptionRepo().delete({
                    id: subscription.id,
                    platformId: subscription.platformId,
                })
                return
            }
            log.warn({
                err: error,
                platformId: subscription.platformId,
                subscriptionId: subscription.id,
            }, 'Failed to send browser push notification')
        }))
    },
})

async function getProjectSubscriptions(params: GetProjectSubscriptionsParams): Promise<WebPushSubscriptionSchema[]> {
    return subscriptionRepo()
        .createQueryBuilder('subscription')
        .where('subscription."platformId" = :platformId', { platformId: params.platformId })
        .andWhere(new Brackets((query) => {
            query
                .where('subscription."userId" = :ownerId', { ownerId: params.ownerId })
                .orWhere(
                    'subscription."userId" IN (SELECT "userId" FROM "project_member" WHERE "projectId" = :projectId AND "platformId" = :platformId)',
                    {
                        platformId: params.platformId,
                        projectId: params.projectId,
                    },
                )
        }))
        .getMany()
}

function assertAllowedSubscription(subscription: WebPushSubscriptionRequest): void {
    if (!isAllowedWebPushEndpoint(subscription.endpoint)) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'Unsupported browser push endpoint',
            },
        })
    }
}

function getEndpointHash(endpoint: string): string {
    return createHash('sha256').update(endpoint).digest('hex')
}

function getVapidDetails(): VapidDetails | null {
    const publicKey = system.get(AppSystemProp.WEB_PUSH_PUBLIC_KEY)
    const privateKey = system.get(AppSystemProp.WEB_PUSH_PRIVATE_KEY)
    const subject = system.get(AppSystemProp.WEB_PUSH_SUBJECT) ?? system.get(AppSystemProp.FRONTEND_URL)
    if (isNil(publicKey) || isNil(privateKey) || isNil(subject)) {
        return null
    }
    const validation = tryGetVapidHeaders({
        privateKey,
        publicKey,
        subject,
    })
    if (!validation) {
        return null
    }
    return {
        publicKey,
        privateKey,
        subject,
    }
}

function tryGetVapidHeaders(vapidDetails: VapidDetails): boolean {
    try {
        webPush.getVapidHeaders(
            'https://push.example.com',
            vapidDetails.subject,
            vapidDetails.publicKey,
            vapidDetails.privateKey,
            'aes128gcm',
        )
        return true
    }
    catch {
        return false
    }
}

export { webPushService }

type DeleteParams = {
    endpoint: string
    platformId: string
    userId: string
}

type GetProjectSubscriptionsParams = {
    ownerId: string
    platformId: string
    projectId: string
}

type SendFlowFailureParams = {
    failedStep: FailedStep
    flowId: string
    flowRunId: string
    flowVersionId: string
    projectId: string
}

type UpsertParams = {
    platformId: string
    subscription: WebPushSubscriptionRequest
    userId: string
}

type VapidDetails = {
    privateKey: string
    publicKey: string
    subject: string
}

type WebPushPayload = {
    body: string
    tag: string
    title: string
    url: string
}

type WebPushService = {
    delete(params: DeleteParams): Promise<void>
    getConfig(): WebPushConfig
    sendFlowFailure(params: SendFlowFailureParams): Promise<void>
    upsert(params: UpsertParams): Promise<void>
}
