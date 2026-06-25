import crypto from 'node:crypto'
import { safeHttp } from '@activepieces/server-utils'
import { assertNotNullOrUndefined, isNil, PlugrBillingCurrency, sanitizeObjectForPostgresql } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { billingEnv } from './billing-env'

const DEFAULT_FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3'
const FLUTTERWAVE_TOKEN_URL = 'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token'
const REQUEST_TIMEOUT_MS = 15000
const TOKEN_REFRESH_BUFFER_MS = 60 * 1000

let cachedToken: { accessToken: string, expiresAt: number } | undefined

type FlutterwaveTokenResponse = {
    access_token?: string
    expires_in?: number
}

type FlutterwaveStandardPaymentResponse = {
    status?: string
    message?: string
    data?: {
        link?: string
    }
}

type FlutterwaveVerifyResponse = {
    status?: string
    message?: string
    data?: {
        id?: number | string
        tx_ref?: string
        reference?: string
        flw_ref?: string
        status?: string
        amount?: number | string
        currency?: string
        payment_plan?: string | number
        customer?: {
            id?: string | number
            email?: string
        }
        meta?: Record<string, unknown>
        processor_response?: string | Record<string, unknown>
    }
}

type CreateCheckoutParams = {
    amount: number
    currency: PlugrBillingCurrency
    customerEmail: string
    customerName: string
    reference: string
    redirectUrl: string
    title: string
    description: string
    metadata: Record<string, string | number | boolean | null>
    paymentPlanId?: string
}

type VerifiedTransaction = {
    id: string
    reference: string
    status: string | undefined
    amount: number
    currency: PlugrBillingCurrency
    flutterwaveReference: string | null
    customerId: string | null
    customerEmail: string | null
    paymentPlanId: string | null
    meta: Record<string, unknown>
    processorResponse: string | null
}

export const flutterwaveBillingService = (log: FastifyBaseLogger) => ({
    isConfigured(): boolean {
        return hasSecretKey() || hasOAuthCredentials()
    },

    verifyWebhookSignature({ body, rawBody, signature }: VerifyWebhookSignatureParams): boolean {
        const secret = billingEnv.get('FLUTTERWAVE_WEBHOOK_SECRET')
        if (isNil(secret) || isNil(signature)) {
            return false
        }

        if (safeCompare(signature, secret)) {
            return true
        }

        const payload = typeof rawBody === 'string' && rawBody.length > 0 ? rawBody : JSON.stringify(body)
        const base64Hash = crypto.createHmac('sha256', secret).update(payload).digest('base64')
        const hexHash = crypto.createHmac('sha256', secret).update(payload).digest('hex')
        return safeCompare(signature, base64Hash) || safeCompare(signature, hexHash)
    },

    async createCheckout(params: CreateCheckoutParams): Promise<string> {
        const response = await client().post<FlutterwaveStandardPaymentResponse>('/payments', {
            tx_ref: params.reference,
            amount: params.amount,
            currency: params.currency,
            redirect_url: params.redirectUrl,
            customer: {
                email: params.customerEmail,
                name: params.customerName,
            },
            customizations: {
                title: params.title,
                description: params.description,
            },
            meta: sanitizeObjectForPostgresql(params.metadata),
            payment_options: 'card,banktransfer,ussd',
            ...spreadPaymentPlan(params.paymentPlanId),
        }, await authHeaders(log))
        const checkoutUrl = response.data.data?.link
        assertNotNullOrUndefined(checkoutUrl, response.data.message ?? 'Flutterwave did not return a checkout link')
        return checkoutUrl
    },

    async verifyTransaction(transactionId: string): Promise<VerifiedTransaction> {
        const path = hasSecretKey() ? `/transactions/${transactionId}/verify` : `/charges/${transactionId}`
        const response = await client().get<FlutterwaveVerifyResponse>(path, await authHeaders(log))
        const data = response.data.data
        assertNotNullOrUndefined(data, response.data.message ?? 'Flutterwave transaction was not found')
        const currency = parseCurrency(data.currency)
        return {
            id: String(data.id),
            reference: data.tx_ref ?? data.reference ?? '',
            status: data.status,
            amount: Number(data.amount),
            currency,
            flutterwaveReference: stringifyNullable(data.flw_ref),
            customerId: stringifyNullable(data.customer?.id),
            customerEmail: data.customer?.email ?? null,
            paymentPlanId: stringifyNullable(data.payment_plan),
            meta: data.meta ?? {},
            processorResponse: stringifyProcessorResponse(data.processor_response),
        }
    },

    async cancelSubscription(subscriptionId: string): Promise<void> {
        await client().put(`/subscriptions/${subscriptionId}/cancel`, {}, await authHeaders(log))
        log.info({ subscriptionId }, 'Flutterwave subscription cancelled')
    },
})

async function authHeaders(log: FastifyBaseLogger): Promise<{ headers: Record<string, string> }> {
    const secretKey = billingEnv.get('FLUTTERWAVE_SECRET_KEY')
    if (!isNil(secretKey)) {
        return {
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
            },
        }
    }

    const accessToken = await getAccessToken(log)
    return {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Trace-Id': crypto.randomUUID(),
        },
    }
}

async function getAccessToken(log: FastifyBaseLogger): Promise<string> {
    if (cachedToken && cachedToken.expiresAt > Date.now() + TOKEN_REFRESH_BUFFER_MS) {
        return cachedToken.accessToken
    }

    const clientId = billingEnv.getOrThrow('FLUTTERWAVE_CLIENT_ID')
    const clientSecret = billingEnv.getOrThrow('FLUTTERWAVE_CLIENT_SECRET')
    const response = await fetch(FLUTTERWAVE_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
        }),
    })

    if (!response.ok) {
        log.warn({ status: response.status }, 'Flutterwave token request failed')
        throw new Error(`Flutterwave token request failed with status ${response.status}`)
    }

    const body = await response.json() as FlutterwaveTokenResponse
    assertNotNullOrUndefined(body.access_token, 'Flutterwave token response is missing access_token')
    cachedToken = {
        accessToken: body.access_token,
        expiresAt: Date.now() + ((body.expires_in ?? 600) * 1000),
    }
    return cachedToken.accessToken
}

function client() {
    const baseURL = (billingEnv.get('FLUTTERWAVE_API_BASE_URL') ?? DEFAULT_FLUTTERWAVE_BASE_URL).replace(/\/$/, '')
    return safeHttp.createAxios({ baseURL, timeout: REQUEST_TIMEOUT_MS })
}

function parseCurrency(currency: string | undefined): PlugrBillingCurrency {
    return currency?.toUpperCase() === 'NGN' ? 'NGN' : 'USD'
}

function spreadPaymentPlan(paymentPlanId: string | undefined): { payment_plan?: string } {
    return isNil(paymentPlanId) || paymentPlanId.length === 0 ? {} : { payment_plan: paymentPlanId }
}

function stringifyNullable(value: string | number | undefined): string | null {
    return isNil(value) ? null : String(value)
}

function stringifyProcessorResponse(value: string | Record<string, unknown> | undefined): string | null {
    if (isNil(value)) {
        return null
    }
    return typeof value === 'string' ? value : JSON.stringify(value)
}

function hasSecretKey(): boolean {
    return !isNil(billingEnv.get('FLUTTERWAVE_SECRET_KEY'))
}

function hasOAuthCredentials(): boolean {
    return !isNil(billingEnv.get('FLUTTERWAVE_CLIENT_ID'))
        && !isNil(billingEnv.get('FLUTTERWAVE_CLIENT_SECRET'))
}

function safeCompare(a: string, b: string): boolean {
    const aBuffer = Buffer.from(a)
    const bBuffer = Buffer.from(b)
    return aBuffer.length === bBuffer.length && crypto.timingSafeEqual(aBuffer, bBuffer)
}

export type FlutterwaveVerifiedTransaction = VerifiedTransaction

type VerifyWebhookSignatureParams = {
    body: unknown
    rawBody: string | undefined
    signature: string | undefined
}