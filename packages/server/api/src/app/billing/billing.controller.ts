import {
    PlugrBillingInfo,
    PlugrCancelSubscriptionRequest,
    PlugrCheckoutResponse,
    PlugrCreateCheckoutRequest,
    PlugrCreateCreditCheckoutRequest,
    PlugrPricingInfo,
    PlugrVerifyTransactionRequest,
    PlugrVerifyTransactionResponse,
    PrincipalType,
    SERVICE_KEY_SECURITY_OPENAPI,
} from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { distributedStore } from '../database/redis-connections'
import { plugrBillingService } from './billing.service'
import { flutterwaveBillingService } from './flutterwave-billing.service'

const BILLING_PRINCIPALS = [PrincipalType.USER] as const
const PROCESSED_EVENT_TTL_SECONDS = 30 * 24 * 60 * 60
const PROCESSED_EVENT_PREFIX = 'plugr:flutterwave:event:'

export const plugrBillingController: FastifyPluginAsyncZod = async (app) => {
    app.get('/pricing', PricingRoute, async (request) => {
        return plugrBillingService(request.log).getPricing({ request })
    })

    app.get('/me', BillingInfoRoute, async (request) => {
        return plugrBillingService(request.log).getInfo({ userId: request.principal.id })
    })

    app.post('/checkout', CheckoutRoute, async (request) => {
        return plugrBillingService(request.log).createSubscriptionCheckout({
            request,
            userId: request.principal.id,
            tier: request.body.tier,
            period: request.body.period,
        })
    })

    app.post('/credits/checkout', CreditCheckoutRoute, async (request) => {
        return plugrBillingService(request.log).createCreditCheckout({
            request,
            userId: request.principal.id,
            pack: request.body.pack,
        })
    })

    app.post('/verify', VerifyRoute, async (request) => {
        return plugrBillingService(request.log).verifyAndApplyTransaction({
            userId: request.principal.id,
            transactionId: request.body.transactionId,
            reference: request.body.reference,
        })
    })

    app.post('/cancel', CancelRoute, async (request) => {
        return plugrBillingService(request.log).cancelSubscription({ userId: request.principal.id })
    })

    app.post('/webhook', WebhookRoute, async (request: FastifyRequest, reply) => {
        const helper = flutterwaveBillingService(request.log)
        if (!helper.verifyWebhookSignature({
            body: request.body,
            rawBody: request.rawBody as string | undefined,
            signature: getHeaderValue(request.headers['flutterwave-signature']) ?? getHeaderValue(request.headers['verif-hash']),
        })) {
            return reply.status(StatusCodes.UNAUTHORIZED).send({ received: false })
        }

        const payload = request.body as FlutterwaveWebhookPayload
        const eventType = payload.event ?? payload.type
        const eventId = payload.id ?? `${eventType ?? 'unknown'}:${payload.data?.id ?? payload.data?.tx_ref ?? 'missing'}`
        const eventKey = `${PROCESSED_EVENT_PREFIX}${eventId}`
        const eventClaimed = await distributedStore.putIfAbsent(eventKey, { status: 'processing' }, PROCESSED_EVENT_TTL_SECONDS)
        if (!eventClaimed) {
            return reply.status(StatusCodes.OK).send({ received: true, duplicate: true })
        }

        try {
            if (isChargeCompleted(eventType)) {
                const transactionId = payload.data?.id
                if (transactionId) {
                    const transaction = await helper.verifyTransaction(String(transactionId))
                    await plugrBillingService(request.log).applyVerifiedTransaction(transaction)
                }
            }
            if (isSubscriptionEnded(eventType)) {
                await plugrBillingService(request.log).markSubscriptionEnded({
                    userId: getStringMeta(payload.data?.meta, 'userId'),
                    subscriptionId: getStringValue(payload.data?.subscription_id),
                })
            }
            await distributedStore.put(eventKey, { status: 'processed' }, PROCESSED_EVENT_TTL_SECONDS)
            return await reply.status(StatusCodes.OK).send({ received: true })
        }
        catch (error) {
            await distributedStore.delete(eventKey)
            request.log.error({ err: error }, 'Flutterwave webhook processing failed')
            return reply.status(StatusCodes.BAD_REQUEST).send({ received: false })
        }
    })
}

function isChargeCompleted(eventType: string | undefined): boolean {
    return ['charge.completed', 'charge.succeeded', 'payment.completed'].includes(eventType ?? '')
}

function isSubscriptionEnded(eventType: string | undefined): boolean {
    return ['subscription.cancelled', 'subscription.canceled', 'subscription.expired'].includes(eventType ?? '')
}

function getHeaderValue(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value
}

function getStringMeta(meta: Record<string, unknown> | undefined, key: string): string | undefined {
    if (!meta) {
        return undefined
    }
    return getStringValue(meta[key])
}

function getStringValue(value: unknown): string | undefined {
    if (typeof value === 'string' && value.length > 0) {
        return value
    }
    if (typeof value === 'number') {
        return String(value)
    }
    return undefined
}

const BillingRateLimit = {
    max: 10,
    timeWindow: '1 minute',
}

const PricingRoute = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        tags: ['plugr-billing'],
        response: {
            [StatusCodes.OK]: PlugrPricingInfo,
        },
    },
}

const BillingInfoRoute = {
    config: {
        security: securityAccess.publicPlatform(BILLING_PRINCIPALS),
        rateLimit: BillingRateLimit,
    },
    schema: {
        tags: ['plugr-billing'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.OK]: PlugrBillingInfo,
        },
    },
}

const CheckoutRoute = {
    config: {
        security: securityAccess.publicPlatform(BILLING_PRINCIPALS),
        rateLimit: BillingRateLimit,
    },
    schema: {
        tags: ['plugr-billing'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: PlugrCreateCheckoutRequest,
        response: {
            [StatusCodes.OK]: PlugrCheckoutResponse,
        },
    },
}

const CreditCheckoutRoute = {
    config: {
        security: securityAccess.publicPlatform(BILLING_PRINCIPALS),
        rateLimit: BillingRateLimit,
    },
    schema: {
        tags: ['plugr-billing'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: PlugrCreateCreditCheckoutRequest,
        response: {
            [StatusCodes.OK]: PlugrCheckoutResponse,
        },
    },
}

const VerifyRoute = {
    config: {
        security: securityAccess.publicPlatform(BILLING_PRINCIPALS),
        rateLimit: BillingRateLimit,
    },
    schema: {
        tags: ['plugr-billing'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: PlugrVerifyTransactionRequest,
        response: {
            [StatusCodes.OK]: PlugrVerifyTransactionResponse,
        },
    },
}

const CancelRoute = {
    config: {
        security: securityAccess.publicPlatform(BILLING_PRINCIPALS),
        rateLimit: BillingRateLimit,
    },
    schema: {
        tags: ['plugr-billing'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: PlugrCancelSubscriptionRequest,
        response: {
            [StatusCodes.OK]: PlugrBillingInfo,
        },
    },
}

const WebhookRoute = {
    config: {
        security: securityAccess.public(),
        rawBody: true,
    },
    schema: {
        tags: ['plugr-billing'],
        body: z.unknown(),
    },
}

type FlutterwaveWebhookPayload = {
    id?: string
    event?: string
    type?: string
    data?: {
        id?: string | number
        tx_ref?: string
        subscription_id?: string | number
        meta?: Record<string, unknown>
    }
}