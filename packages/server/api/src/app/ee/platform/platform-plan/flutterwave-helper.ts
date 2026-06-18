import { assertNotNullOrUndefined } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { randomUUID } from 'node:crypto'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'

const FLUTTERWAVE_TOKEN_URL = 'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token'
const DEFAULT_FLUTTERWAVE_API_BASE_URL = 'https://developersandbox-api.flutterwave.com'
const DEFAULT_FLUTTERWAVE_CHECKOUT_BASE_URL = 'https://api.flutterwave.com/v3'
const TOKEN_REFRESH_BUFFER_MS = 60 * 1000

let cachedToken: { accessToken: string, expiresAt: number } | undefined

type PlugrPlanName = 'starter' | 'builder' | 'pro'

type FlutterwaveTokenResponse = {
    access_token?: string
    expires_in?: number
}

export type FlutterwaveCharge = {
    id: string
    status?: string
    amount?: number
    currency?: string
    reference?: string
    tx_ref?: string
    meta?: Record<string, unknown>
}

type FlutterwaveApiResponse<T> = {
    status?: string
    message?: string
    data?: T
}

type CreateHostedCheckoutParams = {
    amount: number
    currency: string
    email: string
    name: string
    plan: PlugrPlanName
    platformId: string
    redirectUrl: string
}

type FlutterwaveHostedCheckoutResponse = {
    status?: string
    message?: string
    data?: {
        link?: string
    }
}

type FlutterwaveTransactionVerificationResponse = {
    status?: string
    message?: string
    data?: {
        id: string | number
        status?: string
        amount?: number | string
        currency?: string
        tx_ref?: string
        flw_ref?: string
        meta?: Record<string, unknown>
    }
}

export const flutterwaveHelper = (log: FastifyBaseLogger) => ({
    isConfigured(): boolean {
        return Boolean(
            system.get(AppSystemProp.FLUTTERWAVE_CLIENT_ID)
            && system.get(AppSystemProp.FLUTTERWAVE_CLIENT_SECRET),
        )
    },

    isHostedCheckoutConfigured(): boolean {
        return Boolean(system.get(AppSystemProp.FLUTTERWAVE_SECRET_KEY))
    },

    isValidWebhookSignature(signature: string | undefined): boolean {
        const secretHash = system.get(AppSystemProp.FLUTTERWAVE_SECRET_HASH)
        return Boolean(secretHash && signature && signature === secretHash)
    },

    async createHostedCheckout(params: CreateHostedCheckoutParams): Promise<string> {
        const reference = createPaymentReference(params.plan)
        const response = await this.hostedCheckoutRequest<FlutterwaveHostedCheckoutResponse>('/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tx_ref: reference,
                amount: params.amount,
                currency: params.currency,
                redirect_url: params.redirectUrl,
                customer: {
                    email: params.email,
                    name: params.name,
                },
                customizations: {
                    title: `Plugr ${params.plan} plan`,
                    description: `Monthly subscription for Plugr ${params.plan}`,
                },
                meta: {
                    platformId: params.platformId,
                    plan: params.plan,
                    provider: 'flutterwave',
                    billingCycle: 'monthly',
                },
            }),
        })

        const checkoutUrl = response.data?.link
        assertNotNullOrUndefined(checkoutUrl, response.message ?? 'Flutterwave checkout response is missing a payment link')
        return checkoutUrl
    },

    async retrieveCharge(chargeId: string): Promise<FlutterwaveCharge> {
        const response = await this.request<FlutterwaveApiResponse<FlutterwaveCharge>>(`/charges/${chargeId}`)
        assertNotNullOrUndefined(response.data, `Flutterwave charge ${chargeId} was not found`)
        return response.data
    },

    async verifyHostedPayment(transactionId: string): Promise<FlutterwaveCharge> {
        const response = await this.hostedCheckoutRequest<FlutterwaveTransactionVerificationResponse>(`/transactions/${transactionId}/verify`)
        const data = response.data
        assertNotNullOrUndefined(data, `Flutterwave transaction ${transactionId} was not found`)
        return {
            id: String(data.id),
            status: data.status,
            amount: Number(data.amount),
            currency: data.currency,
            reference: data.tx_ref,
            tx_ref: data.tx_ref,
            meta: data.meta,
        }
    },

    async request<T>(path: string, init?: RequestInit): Promise<T> {
        const accessToken = await this.getAccessToken()
        const apiBaseUrl = (system.get(AppSystemProp.FLUTTERWAVE_API_BASE_URL) ?? DEFAULT_FLUTTERWAVE_API_BASE_URL).replace(/\/$/, '')
        const response = await fetch(`${apiBaseUrl}${path}`, {
            ...init,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Trace-Id': randomUUID(),
                ...init?.headers,
            },
        })

        if (!response.ok) {
            log.warn({ status: response.status, path }, 'Flutterwave API request failed')
            throw new Error(`Flutterwave API request failed with status ${response.status}`)
        }

        return response.json() as Promise<T>
    },

    async hostedCheckoutRequest<T>(path: string, init?: RequestInit): Promise<T> {
        const secretKey = system.getOrThrow(AppSystemProp.FLUTTERWAVE_SECRET_KEY)
        const checkoutBaseUrl = (system.get(AppSystemProp.FLUTTERWAVE_CHECKOUT_BASE_URL) ?? DEFAULT_FLUTTERWAVE_CHECKOUT_BASE_URL).replace(/\/$/, '')
        const response = await fetch(`${checkoutBaseUrl}${path}`, {
            ...init,
            headers: {
                Authorization: `Bearer ${secretKey}`,
                ...init?.headers,
            },
        })

        if (!response.ok) {
            log.warn({ status: response.status, path }, 'Flutterwave hosted checkout request failed')
            throw new Error(`Flutterwave hosted checkout request failed with status ${response.status}`)
        }

        return response.json() as Promise<T>
    },

    async getAccessToken(): Promise<string> {
        if (cachedToken && cachedToken.expiresAt > Date.now() + TOKEN_REFRESH_BUFFER_MS) {
            return cachedToken.accessToken
        }

        const clientId = system.getOrThrow(AppSystemProp.FLUTTERWAVE_CLIENT_ID)
        const clientSecret = system.getOrThrow(AppSystemProp.FLUTTERWAVE_CLIENT_SECRET)

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
    },
})

function createPaymentReference(plan: PlugrPlanName): string {
    return `plg-${plan.slice(0, 3)}-${randomUUID().replace(/-/g, '').slice(0, 24)}`
}
