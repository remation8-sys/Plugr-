import { safeHttp } from '@activepieces/server-utils'
import { assertNotNullOrUndefined } from '@activepieces/shared'
import { AxiosError } from 'axios'
import { FastifyBaseLogger } from 'fastify'
import { randomUUID, timingSafeEqual } from 'node:crypto'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'

const FLUTTERWAVE_TOKEN_URL = 'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token'
const DEFAULT_FLUTTERWAVE_API_BASE_URL = 'https://developersandbox-api.flutterwave.com'
const DEFAULT_FLUTTERWAVE_CHECKOUT_BASE_URL = 'https://api.flutterwave.com/v3'
const TOKEN_REFRESH_BUFFER_MS = 60 * 1000
const REQUEST_TIMEOUT_MS = 15_000

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
        if (!secretHash || !signature) {
            return false
        }
        const a = Buffer.from(signature)
        const b = Buffer.from(secretHash)
        return a.length === b.length && timingSafeEqual(a, b)
    },

    async createHostedCheckout(params: CreateHostedCheckoutParams): Promise<string> {
        const secretKey = system.getOrThrow(AppSystemProp.FLUTTERWAVE_SECRET_KEY)
        const checkoutBaseUrl = (system.get(AppSystemProp.FLUTTERWAVE_CHECKOUT_BASE_URL) ?? DEFAULT_FLUTTERWAVE_CHECKOUT_BASE_URL).replace(/\/$/, '')
        const reference = createPaymentReference(params.plan)
        const client = safeHttp.createAxios({ baseURL: checkoutBaseUrl, timeout: REQUEST_TIMEOUT_MS })
        let response: FlutterwaveHostedCheckoutResponse
        try {
            const { data } = await client.post<FlutterwaveHostedCheckoutResponse>('/payments', {
                tx_ref: reference,
                amount: params.amount,
                currency: params.currency,
                redirect_url: params.redirectUrl,
                customer: { email: params.email, name: params.name },
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
            }, {
                headers: { Authorization: `Bearer ${secretKey}` },
            })
            response = data
        }
        catch (err) {
            const status = err instanceof AxiosError ? err.response?.status : undefined
            log.warn({ status }, 'Flutterwave hosted checkout request failed')
            throw new Error('Flutterwave hosted checkout request failed')
        }
        const checkoutUrl = response.data?.link
        assertNotNullOrUndefined(checkoutUrl, response.message ?? 'Flutterwave checkout response is missing a payment link')
        return checkoutUrl
    },

    async retrieveCharge(chargeId: string): Promise<FlutterwaveCharge> {
        assertNumericId(chargeId, 'charge')
        const accessToken = await this.getAccessToken()
        const apiBaseUrl = (system.get(AppSystemProp.FLUTTERWAVE_API_BASE_URL) ?? DEFAULT_FLUTTERWAVE_API_BASE_URL).replace(/\/$/, '')
        const client = safeHttp.createAxios({ baseURL: apiBaseUrl, timeout: REQUEST_TIMEOUT_MS })
        let response: FlutterwaveApiResponse<FlutterwaveCharge>
        try {
            const { data } = await client.get<FlutterwaveApiResponse<FlutterwaveCharge>>(`/charges/${chargeId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'X-Trace-Id': randomUUID(),
                },
            })
            response = data
        }
        catch (err) {
            const status = err instanceof AxiosError ? err.response?.status : undefined
            log.warn({ status }, 'Flutterwave API request failed')
            throw new Error('Flutterwave API request failed')
        }
        assertNotNullOrUndefined(response.data, 'Flutterwave charge was not found')
        return response.data
    },

    async verifyHostedPayment(transactionId: string): Promise<FlutterwaveCharge> {
        assertNumericId(transactionId, 'transaction')
        const secretKey = system.getOrThrow(AppSystemProp.FLUTTERWAVE_SECRET_KEY)
        const checkoutBaseUrl = (system.get(AppSystemProp.FLUTTERWAVE_CHECKOUT_BASE_URL) ?? DEFAULT_FLUTTERWAVE_CHECKOUT_BASE_URL).replace(/\/$/, '')
        const client = safeHttp.createAxios({ baseURL: checkoutBaseUrl, timeout: REQUEST_TIMEOUT_MS })
        let response: FlutterwaveTransactionVerificationResponse
        try {
            const { data } = await client.get<FlutterwaveTransactionVerificationResponse>(`/transactions/${transactionId}/verify`, {
                headers: { Authorization: `Bearer ${secretKey}` },
            })
            response = data
        }
        catch (err) {
            const status = err instanceof AxiosError ? err.response?.status : undefined
            log.warn({ status }, 'Flutterwave hosted checkout request failed')
            throw new Error('Flutterwave hosted checkout request failed')
        }
        const txData = response.data
        assertNotNullOrUndefined(txData, 'Flutterwave transaction was not found')
        return {
            id: String(txData.id),
            status: txData.status,
            amount: Number(txData.amount),
            currency: txData.currency,
            reference: txData.tx_ref,
            tx_ref: txData.tx_ref,
            meta: txData.meta,
        }
    },

    async getAccessToken(): Promise<string> {
        if (cachedToken && cachedToken.expiresAt > Date.now() + TOKEN_REFRESH_BUFFER_MS) {
            return cachedToken.accessToken
        }

        const clientId = system.getOrThrow(AppSystemProp.FLUTTERWAVE_CLIENT_ID)
        const clientSecret = system.getOrThrow(AppSystemProp.FLUTTERWAVE_CLIENT_SECRET)
        let tokenData: FlutterwaveTokenResponse
        try {
            const client = safeHttp.createAxios({ timeout: REQUEST_TIMEOUT_MS })
            const { data } = await client.post<FlutterwaveTokenResponse>(
                FLUTTERWAVE_TOKEN_URL,
                new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: 'client_credentials',
                }).toString(),
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                },
            )
            tokenData = data
        }
        catch (err) {
            const status = err instanceof AxiosError ? err.response?.status : undefined
            log.warn({ status }, 'Flutterwave token request failed')
            throw new Error('Flutterwave token request failed')
        }
        assertNotNullOrUndefined(tokenData.access_token, 'Flutterwave token response is missing access_token')
        cachedToken = {
            accessToken: tokenData.access_token,
            expiresAt: Date.now() + ((tokenData.expires_in ?? 600) * 1000),
        }
        return cachedToken.accessToken
    },
})

function assertNumericId(id: string, label: string): void {
    if (!/^\d{1,20}$/.test(id)) {
        throw new Error(`Invalid Flutterwave ${label} id: must be numeric`)
    }
}

function createPaymentReference(plan: PlugrPlanName): string {
    return `plg-${plan.slice(0, 3)}-${randomUUID().replace(/-/g, '').slice(0, 24)}`
}
