import { isNil } from '@activepieces/shared'

function get(name: string): string | undefined {
    return nonEmpty(process.env[name]) ?? nonEmpty(process.env[`AP_${name}`])
}

function getOrThrow(name: string): string {
    const value = get(name)
    if (isNil(value) || value.length === 0) {
        throw new Error(`Environment variable ${name} is not set`)
    }
    return value
}

function getMonthlyPlanId(params: GetMonthlyPlanIdParams): string | undefined {
    return get(`FLUTTERWAVE_${params.tier.toUpperCase()}_MONTHLY_${params.currency}_PLAN_ID`)
}

export const billingEnv = {
    get,
    getMonthlyPlanId,
    getOrThrow,
}

type GetMonthlyPlanIdParams = {
    tier: string
    currency: string
}

function nonEmpty(value: string | undefined): string | undefined {
    return isNil(value) || value.length === 0 ? undefined : value
}
