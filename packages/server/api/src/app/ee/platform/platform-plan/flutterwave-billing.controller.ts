import { apDayjs } from '@activepieces/server-utils'
import { ApSubscriptionStatus, isNil, PlatformPlanWithOnlyLimits, PrincipalType } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { distributedStore } from '../../../database/redis-connections'
import { exceptionHandler } from '../../../helper/exception-handler'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { userService } from '../../../user/user-service'
import { FlutterwaveCharge, flutterwaveHelper } from './flutterwave-helper'
import { platformPlanService } from './platform-plan.service'

const PROCESSED_EVENT_TTL_SECONDS = 30 * 24 * 60 * 60
const PROCESSED_EVENT_PREFIX = 'flutterwave-billing-event:'
const DEFAULT_FLUTTERWAVE_CURRENCY = 'USD'

const PlugrPlanNameSchema = z.enum(['starter', 'builder', 'pro'])
type PlugrPlanName = z.infer<typeof PlugrPlanNameSchema>

const CreateFlutterwaveCheckoutSessionParamsSchema = z.object({
    plan: PlugrPlanNameSchema,
})

const FlutterwaveCheckoutSessionResponse = z.object({
    checkoutUrl: z.string(),
})

type FlutterwaveWebhookPayload = {
    event?: string
    id?: string
    type?: string
    data?: {
        id?: string | number
        status?: string
    }
}

const PLUGR_PLAN_PRICES: Record<PlugrPlanName, number> = {
    starter: 7,
    builder: 12,
    pro: 29,
}

const PLUGR_PLAN_LIMITS: Record<PlugrPlanName, Partial<PlatformPlanWithOnlyLimits>> = {
    starter: {
        activeFlowsLimit: 10,
        includedAiCredits: 0,
        agentsEnabled: false,
        aiProvidersEnabled: false,
        chatEnabled: false,
    },
    builder: {
        activeFlowsLimit: null,
        includedAiCredits: 0,
        agentsEnabled: true,
        aiProvidersEnabled: false,
        chatEnabled: false,
    },
    pro: {
        activeFlowsLimit: null,
        includedAiCredits: 200,
        agentsEnabled: true,
        aiProvidersEnabled: true,
        chatEnabled: false,
    },
}

export const flutterwaveBillingController: FastifyPluginAsyncZod = async (fastify) => {
    fastify.post('/create-checkout', CreateCheckoutRequest, async (request) => {
        const helper = flutterwaveHelper(request.log)
        if (!helper.isHostedCheckoutConfigured()) {
            throw new Error('Flutterwave hosted checkout is not configured')
        }

        const { plan } = request.body as z.infer<typeof CreateFlutterwaveCheckoutSessionParamsSchema>
        const platformId = request.principal.platform.id
        const user = await userService(request.log).getMetaInformation({ id: request.principal.id })
        const currency = system.get(AppSystemProp.FLUTTERWAVE_CURRENCY) ?? DEFAULT_FLUTTERWAVE_CURRENCY
        const frontendUrl = system.getOrThrow(AppSystemProp.FRONTEND_URL).replace(/\/$/, '')

        const checkoutUrl = await helper.createHostedCheckout({
            amount: PLUGR_PLAN_PRICES[plan],
            currency,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`.trim(),
            plan,
            platformId,
            redirectUrl: `${frontendUrl}/platform/setup/billing/success?action=create&provider=flutterwave`,
        })

        return { checkoutUrl }
    })

    fastify.post(
        '/webhook',
        WebhookRequest,
        async (request: FastifyRequest, reply) => {
            const helper = flutterwaveHelper(request.log)

            const signature = getHeaderValue(request.headers['flutterwave-signature']) ?? getHeaderValue(request.headers['verif-hash'])
            if (!helper.isValidWebhookSignature(signature)) {
                return reply.status(StatusCodes.UNAUTHORIZED).send({ received: false })
            }

            if (!helper.isConfigured()) {
                request.log.warn('Flutterwave webhook received while Flutterwave is not configured')
                return reply.status(StatusCodes.OK).send({ received: true, ignored: true })
            }

            const payload = request.body as FlutterwaveWebhookPayload
            const eventType = payload.type ?? payload.event
            const eventId = payload.id ?? `${eventType ?? 'unknown'}:${payload.data?.id ?? 'missing-charge'}`
            const eventKey = `${PROCESSED_EVENT_PREFIX}${eventId}`
            const eventClaimed = await distributedStore.putIfAbsent(eventKey, { status: 'processing' }, PROCESSED_EVENT_TTL_SECONDS)

            if (!eventClaimed) {
                return reply.status(StatusCodes.OK).send({ received: true, duplicate: true })
            }

            try {
                if (!isSuccessfulChargeEvent(eventType)) {
                    await markProcessed(eventKey)
                    return reply.status(StatusCodes.OK).send({ received: true, ignored: true })
                }

                const chargeId = payload.data?.id
                if (isNil(chargeId)) {
                    await markProcessed(eventKey)
                    return reply.status(StatusCodes.OK).send({ received: true, ignored: true })
                }

                const chargeIdStr = String(chargeId)
                if (!/^\d{1,20}$/.test(chargeIdStr)) {
                    await markProcessed(eventKey)
                    return reply.status(StatusCodes.OK).send({ received: true, ignored: true })
                }

                const charge = helper.isHostedCheckoutConfigured()
                    ? await helper.verifyHostedPayment(chargeIdStr)
                    : await helper.retrieveCharge(chargeIdStr)
                await applyVerifiedCharge({ charge, log: request.log })
                await markProcessed(eventKey)
                return reply.status(StatusCodes.OK).send({ received: true })
            }
            catch (err) {
                await distributedStore.delete(eventKey)
                request.log.error({ err }, 'Flutterwave webhook processing failed')
                exceptionHandler.handle(err, request.log)
                return reply.status(StatusCodes.BAD_REQUEST).send('Flutterwave webhook processing failed')
            }
        },
    )
}

async function markProcessed(eventKey: string): Promise<void> {
    await distributedStore.put(eventKey, { status: 'processed' }, PROCESSED_EVENT_TTL_SECONDS)
}

async function applyVerifiedCharge(params: { charge: FlutterwaveCharge, log: FastifyRequest['log'] }): Promise<void> {
    const { charge, log } = params
    if (!isSuccessfulChargeStatus(charge.status)) {
        log.info({ chargeId: charge.id, status: charge.status }, 'Ignoring non-successful Flutterwave charge')
        return
    }

    const meta = charge.meta ?? {}
    const platformId = getStringMeta(meta, 'platformId') ?? getStringMeta(meta, 'platform_id')
    const plan = (getStringMeta(meta, 'plan') ?? getStringMeta(meta, 'planName') ?? '').toLowerCase()

    if (isNil(platformId) || !isKnownPlugrPlan(plan)) {
        throw new Error('Verified Flutterwave charge is missing required Plugr billing metadata')
    }

    assertChargeMatchesPlan({ charge, plan })

    await platformPlanService(log).getOrCreateForPlatform(platformId)
    await platformPlanService(log).update({
        ...PLUGR_PLAN_LIMITS[plan],
        platformId,
        plan,
        stripeSubscriptionId: `flutterwave:${charge.id}`,
        stripeSubscriptionStatus: ApSubscriptionStatus.ACTIVE,
        stripeSubscriptionStartDate: apDayjs().unix(),
        stripeSubscriptionEndDate: apDayjs().add(1, 'month').unix(),
        stripeSubscriptionCancelDate: undefined,
    })
}

function assertChargeMatchesPlan(params: { charge: FlutterwaveCharge, plan: keyof typeof PLUGR_PLAN_LIMITS }): void {
    const { charge, plan } = params
    const expectedAmount = PLUGR_PLAN_PRICES[plan]
    const expectedCurrency = system.get(AppSystemProp.FLUTTERWAVE_CURRENCY) ?? DEFAULT_FLUTTERWAVE_CURRENCY

    if (Number(charge.amount) !== expectedAmount || charge.currency?.toUpperCase() !== expectedCurrency.toUpperCase()) {
        throw new Error('Verified Flutterwave charge amount or currency does not match the selected Plugr plan')
    }
}

function isKnownPlugrPlan(plan: string): plan is PlugrPlanName {
    return Object.hasOwn(PLUGR_PLAN_LIMITS, plan)
}

function isSuccessfulChargeEvent(type: string | undefined): boolean {
    return ['charge.completed', 'charge.succeeded', 'payment.completed'].includes(type ?? '')
}

function isSuccessfulChargeStatus(status: string | undefined): boolean {
    return ['succeeded', 'successful', 'success'].includes(status ?? '')
}

function getStringMeta(meta: Record<string, unknown>, key: string): string | undefined {
    const value = meta[key]
    return typeof value === 'string' && value.length > 0 ? value : undefined
}

function getHeaderValue(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value
}

const WebhookRequest = {
    config: {
        security: securityAccess.public(),
        rateLimit: {
            max: 100,
            timeWindow: '1 minute',
        },
    },
}

const CreateCheckoutRequest = {
    schema: {
        body: CreateFlutterwaveCheckoutSessionParamsSchema,
        response: {
            [StatusCodes.OK]: FlutterwaveCheckoutSessionResponse,
        },
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}
