import { PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, WebPushConfig, WebPushSubscriptionDeleteRequest, WebPushSubscriptionRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { webPushService } from './web-push.service'

const WEB_PUSH_PRINCIPALS = [PrincipalType.USER] as const
const WebPushRateLimit = {
    max: 20,
    timeWindow: '1 minute',
}

const webPushController: FastifyPluginAsyncZod = async (app) => {
    app.get('/config', ConfigRoute, async (request) => {
        return webPushService(request.log).getConfig()
    })

    app.post('/subscriptions', UpsertSubscriptionRoute, async (request, reply) => {
        await webPushService(request.log).upsert({
            platformId: request.principal.platform.id,
            subscription: request.body,
            userId: request.principal.id,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })

    app.delete('/subscriptions', DeleteSubscriptionRoute, async (request, reply) => {
        await webPushService(request.log).delete({
            endpoint: request.query.endpoint,
            platformId: request.principal.platform.id,
            userId: request.principal.id,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

const ConfigRoute = {
    config: {
        security: securityAccess.nonEmbedUsersOnly(WEB_PUSH_PRINCIPALS),
        rateLimit: WebPushRateLimit,
    },
    schema: {
        tags: ['web-push'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.OK]: WebPushConfig,
        },
    },
}

const UpsertSubscriptionRoute = {
    config: {
        security: securityAccess.nonEmbedUsersOnly(WEB_PUSH_PRINCIPALS),
        rateLimit: WebPushRateLimit,
    },
    schema: {
        tags: ['web-push'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: WebPushSubscriptionRequest,
    },
}

const DeleteSubscriptionRoute = {
    config: {
        security: securityAccess.nonEmbedUsersOnly(WEB_PUSH_PRINCIPALS),
        rateLimit: WebPushRateLimit,
    },
    schema: {
        tags: ['web-push'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: WebPushSubscriptionDeleteRequest,
    },
}

export { webPushController }
