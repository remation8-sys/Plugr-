import { safeHttp } from '@activepieces/server-utils'
import { isNil, PlugrBillingCountry, PlugrBillingCurrency } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import { networkUtils } from '../helper/network-utils'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { billingEnv } from './billing-env'

const DEFAULT_IP_LOOKUP_ENDPOINT = 'https://ipapi.co/{ip}/country/'
const REQUEST_TIMEOUT_MS = 3000

export const billingCountryService = (log: FastifyBaseLogger) => ({
    async detect(request: FastifyRequest): Promise<BillingLocation> {
        const headerCountry = detectFromHeaders(request)
        if (!isNil(headerCountry)) {
            return toBillingLocation(headerCountry)
        }

        const localeCountry = detectFromLocaleHints(request)
        if (!isNil(localeCountry)) {
            return toBillingLocation(localeCountry)
        }

        const ip = networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER))
        const endpoint = billingEnv.get('PLUGR_IP_GEOLOCATION_ENDPOINT') ?? DEFAULT_IP_LOOKUP_ENDPOINT
        const country = await lookupCountry({ endpoint, ip, log })
        return toBillingLocation(country)
    },
})

async function lookupCountry({ endpoint, ip, log }: LookupCountryParams): Promise<string | undefined> {
    try {
        const url = endpoint.includes('{ip}') ? endpoint.replace('{ip}', encodeURIComponent(ip)) : `${endpoint}${encodeURIComponent(ip)}`
        const response = await safeHttp.axios.get<unknown>(url, { timeout: REQUEST_TIMEOUT_MS })
        return parseCountryResponse(response.data)
    }
    catch (error) {
        log.warn({ err: error }, 'IP country lookup failed; falling back to USD pricing')
        return undefined
    }
}

function parseCountryResponse(data: unknown): string | undefined {
    if (typeof data === 'string') {
        return data.trim()
    }
    if (typeof data !== 'object' || isNil(data)) {
        return undefined
    }
    if ('country_code' in data && typeof data.country_code === 'string') {
        return data.country_code
    }
    if ('country' in data && typeof data.country === 'string') {
        return data.country
    }
    return undefined
}

function detectFromHeaders(request: FastifyRequest): string | undefined {
    for (const header of COUNTRY_HEADERS) {
        const value = request.headers[header]
        if (Array.isArray(value)) {
            return value[0]
        }
        if (typeof value === 'string') {
            return value
        }
    }
    return undefined
}

function detectFromLocaleHints(request: FastifyRequest): string | undefined {
    const timeZone = getHeaderValue(request, 'x-plugr-time-zone')
    if (timeZone?.trim().toLowerCase() === 'africa/lagos') {
        return 'NG'
    }

    const acceptLanguage = getHeaderValue(request, 'accept-language')
    if (/\b[a-z]{2}-NG\b/i.test(acceptLanguage ?? '')) {
        return 'NG'
    }
    return undefined
}

function getHeaderValue(request: FastifyRequest, headerName: string): string | undefined {
    const value = request.headers[headerName]
    if (Array.isArray(value)) {
        return value[0]
    }
    return typeof value === 'string' ? value : undefined
}

function toBillingLocation(countryCode: string | undefined): BillingLocation {
    const normalized = countryCode?.trim().toUpperCase()
    if (normalized === 'NG') {
        return {
            country: 'NG',
            currency: 'NGN',
        }
    }
    return {
        country: 'OTHER',
        currency: 'USD',
    }
}

const COUNTRY_HEADERS = [
    'cf-ipcountry',
    'x-country-code',
    'x-vercel-ip-country',
    'x-appengine-country',
    'cloudfront-viewer-country',
]

export type BillingLocation = {
    country: PlugrBillingCountry
    currency: PlugrBillingCurrency
}

type LookupCountryParams = {
    endpoint: string
    ip: string
    log: FastifyBaseLogger
}