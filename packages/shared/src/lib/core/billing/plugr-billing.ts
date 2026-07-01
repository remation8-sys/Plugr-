import { z } from 'zod'
import { DateOrString, Nullable } from '../common/base-model'

const plugrSubscriptionTierValues = ['trial', 'starter', 'builder', 'pro', 'business'] as const
const plugrPaidTierValues = ['starter', 'builder', 'pro', 'business'] as const
const plugrSubscriptionStatusValues = ['trial', 'active', 'cancelled', 'expired'] as const
const plugrSubscriptionPeriodValues = ['monthly', 'quarterly', 'biannual', 'annual'] as const
const plugrBillingCountryValues = ['NG', 'OTHER'] as const
const plugrBillingCurrencyValues = ['NGN', 'USD'] as const
const plugrCreditActionTypeValues = ['build_simple', 'build_complex', 'audit', 'fix', 'modify', 'report'] as const
const plugrCreditPackSizeValues = ['100', '500', '1000'] as const
const plugrBillingTransactionTypeValues = ['subscription', 'credits'] as const
const plugrBillingTransactionStatusValues = ['pending', 'successful', 'failed', 'cancelled'] as const

const PlugrSubscriptionTierSchema = z.enum(plugrSubscriptionTierValues)
const PlugrPaidTierSchema = z.enum(plugrPaidTierValues)
const PlugrSubscriptionStatusSchema = z.enum(plugrSubscriptionStatusValues)
const PlugrSubscriptionPeriodSchema = z.enum(plugrSubscriptionPeriodValues)
const PlugrBillingCountrySchema = z.enum(plugrBillingCountryValues)
const PlugrBillingCurrencySchema = z.enum(plugrBillingCurrencyValues)
const PlugrCreditActionTypeSchema = z.enum(plugrCreditActionTypeValues)
const PlugrCreditPackSizeSchema = z.enum(plugrCreditPackSizeValues)
const PlugrBillingTransactionTypeSchema = z.enum(plugrBillingTransactionTypeValues)
const PlugrBillingTransactionStatusSchema = z.enum(plugrBillingTransactionStatusValues)

function getPlugrPlanPrice(params: GetPlugrPlanPriceParams): PlugrPriceBreakdown {
    const monthlyPrice = plugrPlanCatalog[params.tier].prices[params.currency]
    const period = plugrSubscriptionPeriods[params.period]
    const totalBeforeDiscount = monthlyPrice * period.months
    const savings = Math.round(totalBeforeDiscount * period.discount)
    return {
        currency: params.currency,
        monthlyPrice,
        months: period.months,
        discountPercent: period.discountPercent,
        totalBeforeDiscount,
        savings,
        total: totalBeforeDiscount - savings,
    }
}

function getPlugrCreditPackPrice(params: GetPlugrCreditPackPriceParams): PlugrCreditPackPrice {
    const pack = plugrCreditPacks[params.pack]
    return {
        credits: pack.credits,
        currency: params.currency,
        amount: pack.prices[params.currency],
    }
}

function getPlugrTierRank(tier: PlugrSubscriptionTier): number {
    return plugrTierRank[tier]
}

function isPlugrPaidTier(tier: PlugrSubscriptionTier): tier is PlugrPaidTier {
    return tier !== 'trial'
}

function getPlugrCreditsRemaining(params: GetPlugrCreditsRemainingParams): number {
    return Math.max(0, params.included + params.purchased - params.used)
}

const plugrTierRank: Record<PlugrSubscriptionTier, number> = {
    trial: 0,
    starter: 1,
    builder: 2,
    pro: 3,
    business: 4,
}

const plugrSubscriptionPeriods: Record<PlugrSubscriptionPeriod, PlugrSubscriptionPeriodConfig> = {
    monthly: {
        months: 1,
        discountPercent: 0,
        discount: 0,
        label: 'Monthly',
    },
    quarterly: {
        months: 3,
        discountPercent: 10,
        discount: 0.1,
        label: '3 months',
    },
    biannual: {
        months: 6,
        discountPercent: 20,
        discount: 0.2,
        label: '6 months',
    },
    annual: {
        months: 12,
        discountPercent: 30,
        discount: 0.3,
        label: '12 months',
    },
}

const plugrPlanCatalog: Record<PlugrPaidTier, PlugrPlanCatalogEntry> = {
    starter: {
        tier: 'starter',
        name: 'Starter',
        prices: {
            USD: 9,
            NGN: 14400,
        },
        includedCredits: 0,
        activeFlowsLimit: null,
        features: [
            'Unlimited flows',
            'Unlimited executions',
            'All 700+ Plugs',
            'Templates',
            'Community support',
            'Plugr AI not included',
        ],
    },
    builder: {
        tier: 'builder',
        name: 'Builder',
        prices: {
            USD: 24,
            NGN: 38400,
        },
        includedCredits: 30,
        activeFlowsLimit: null,
        popular: true,
        features: [
            '30 Plugr credits monthly',
            'Unlimited flows',
            'Unlimited executions',
            'All 700+ Plugs',
            'Templates',
            'Email support',
        ],
    },
    pro: {
        tier: 'pro',
        name: 'Pro',
        prices: {
            USD: 49,
            NGN: 78400,
        },
        includedCredits: 75,
        activeFlowsLimit: null,
        features: [
            '75 Plugr credits monthly',
            'Unlimited flows',
            'Unlimited executions',
            'All 700+ Plugs',
            'Templates',
            'Priority support 24-48hrs',
            'Advanced analytics',
        ],
    },
    business: {
        tier: 'business',
        name: 'Business',
        prices: {
            USD: 99,
            NGN: 158400,
        },
        includedCredits: 150,
        activeFlowsLimit: null,
        features: [
            '150 Plugr credits monthly',
            'Unlimited flows',
            'Unlimited executions',
            'All 700+ Plugs',
            'Templates',
            'Specialist workflow agent',
            'Dedicated account manager',
            'Fastest priority support',
        ],
    },
}

const plugrCreditPacks: Record<PlugrCreditPackSize, PlugrCreditPack> = {
    100: {
        credits: 100,
        prices: {
            USD: 50,
            NGN: 80000,
        },
    },
    500: {
        credits: 500,
        prices: {
            USD: 220,
            NGN: 352000,
        },
    },
    1000: {
        credits: 1000,
        prices: {
            USD: 420,
            NGN: 672000,
        },
    },
}

const plugrCreditActionCosts: Record<PlugrCreditActionType, number> = {
    build_simple: 10,
    build_complex: 30,
    audit: 6,
    fix: 10,
    modify: 6,
    report: 4,
}

const PlugrUserBilling = z.object({
    subscriptionTier: PlugrSubscriptionTierSchema,
    subscriptionStatus: PlugrSubscriptionStatusSchema,
    subscriptionPeriod: PlugrSubscriptionPeriodSchema,
    trialStartsAt: Nullable(DateOrString),
    trialEndsAt: Nullable(DateOrString),
    subscriptionStartsAt: Nullable(DateOrString),
    subscriptionEndsAt: Nullable(DateOrString),
    flutterwaveCustomerId: Nullable(z.string()),
    flutterwaveSubscriptionId: Nullable(z.string()),
    flutterwavePlanId: Nullable(z.string()),
    billingCountry: PlugrBillingCountrySchema,
    billingCurrency: PlugrBillingCurrencySchema,
    aiCreditsIncluded: z.number(),
    aiCreditsUsed: z.number(),
    aiCreditsPurchased: z.number(),
    aiCreditsResetAt: Nullable(DateOrString),
})

const PlugrBillingTransaction = z.object({
    id: z.string(),
    created: DateOrString,
    type: PlugrBillingTransactionTypeSchema,
    status: PlugrBillingTransactionStatusSchema,
    tier: Nullable(PlugrPaidTierSchema),
    period: Nullable(PlugrSubscriptionPeriodSchema),
    creditsPurchased: Nullable(z.number()),
    amountPaid: z.number(),
    currency: PlugrBillingCurrencySchema,
    flutterwaveReference: Nullable(z.string()),
    flutterwaveTransactionId: Nullable(z.string()),
    receiptUrl: Nullable(z.string()),
})

const PlugrBillingInfo = z.object({
    user: PlugrUserBilling,
    creditsRemaining: z.number(),
    history: z.array(PlugrBillingTransaction),
})

const PlugrPricingInfo = z.object({
    country: PlugrBillingCountrySchema,
    currency: PlugrBillingCurrencySchema,
    plans: z.record(PlugrPaidTierSchema, z.object({
        tier: PlugrPaidTierSchema,
        name: z.string(),
        includedCredits: z.number(),
        activeFlowsLimit: Nullable(z.number()),
        popular: z.boolean().optional(),
        features: z.array(z.string()),
        prices: z.record(PlugrSubscriptionPeriodSchema, z.object({
            currency: PlugrBillingCurrencySchema,
            monthlyPrice: z.number(),
            months: z.number(),
            discountPercent: z.number(),
            totalBeforeDiscount: z.number(),
            savings: z.number(),
            total: z.number(),
        })),
    })),
    creditPacks: z.record(PlugrCreditPackSizeSchema, z.object({
        credits: z.number(),
        currency: PlugrBillingCurrencySchema,
        amount: z.number(),
    })),
})

const PlugrCreateCheckoutRequest = z.object({
    tier: PlugrPaidTierSchema,
    period: PlugrSubscriptionPeriodSchema,
})

const PlugrCreateCreditCheckoutRequest = z.object({
    pack: PlugrCreditPackSizeSchema,
})

const PlugrCancelSubscriptionRequest = z.object({
    confirmation: z.literal('CANCEL'),
})

const PlugrInlineCheckoutParams = z.object({
    publicKey: z.string(),
    txRef: z.string(),
    amount: z.number(),
    currency: PlugrBillingCurrencySchema,
    paymentPlanId: z.string().optional(),
    paymentOptions: z.string(),
    redirectUrl: z.string(),
    customer: z.object({
        email: z.string(),
        name: z.string().optional(),
    }),
    meta: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
    customizations: z.object({
        title: z.string(),
        description: z.string(),
        logo: z.string().optional(),
    }),
})

const PlugrCheckoutResponse = z.object({
    checkoutUrl: z.string(),
    reference: z.string(),
    inline: PlugrInlineCheckoutParams.optional(),
})

const PlugrVerifyTransactionRequest = z.object({
    transactionId: z.string().optional(),
    reference: z.string().optional(),
})

const PlugrVerifyTransactionResponse = z.object({
    status: z.enum(['successful', 'pending', 'failed']),
    billing: PlugrBillingInfo,
})

const PlugrTrialStartResponse = z.object({
    trialEndsAt: DateOrString,
})

export {
    getPlugrCreditPackPrice,
    getPlugrCreditsRemaining,
    getPlugrPlanPrice,
    getPlugrTierRank,
    isPlugrPaidTier,
    PlugrBillingCountrySchema,
    PlugrBillingCurrencySchema,
    PlugrBillingInfo,
    PlugrBillingTransaction,
    plugrBillingTransactionStatusValues,
    PlugrBillingTransactionStatusSchema,
    plugrBillingTransactionTypeValues,
    PlugrBillingTransactionTypeSchema,
    PlugrCancelSubscriptionRequest,
    PlugrCheckoutResponse,
    PlugrCreateCheckoutRequest,
    PlugrCreateCreditCheckoutRequest,
    PlugrInlineCheckoutParams,
    plugrCreditActionCosts,
    plugrCreditActionTypeValues,
    PlugrCreditActionTypeSchema,
    plugrCreditPacks,
    plugrCreditPackSizeValues,
    PlugrCreditPackSizeSchema,
    plugrPaidTierValues,
    PlugrPaidTierSchema,
    plugrPlanCatalog,
    PlugrPricingInfo,
    plugrSubscriptionPeriods,
    plugrSubscriptionPeriodValues,
    PlugrSubscriptionPeriodSchema,
    plugrSubscriptionStatusValues,
    PlugrSubscriptionStatusSchema,
    plugrSubscriptionTierValues,
    PlugrSubscriptionTierSchema,
    PlugrTrialStartResponse,
    PlugrUserBilling,
    PlugrVerifyTransactionRequest,
    PlugrVerifyTransactionResponse,
}

export type GetPlugrCreditPackPriceParams = {
    pack: PlugrCreditPackSize
    currency: PlugrBillingCurrency
}

export type GetPlugrCreditsRemainingParams = {
    included: number
    purchased: number
    used: number
}

export type GetPlugrPlanPriceParams = {
    tier: PlugrPaidTier
    period: PlugrSubscriptionPeriod
    currency: PlugrBillingCurrency
}

export type PlugrBillingCountry = z.infer<typeof PlugrBillingCountrySchema>
export type PlugrBillingCurrency = z.infer<typeof PlugrBillingCurrencySchema>
export type PlugrBillingInfo = z.infer<typeof PlugrBillingInfo>
export type PlugrBillingTransaction = z.infer<typeof PlugrBillingTransaction>
export type PlugrBillingTransactionStatus = z.infer<typeof PlugrBillingTransactionStatusSchema>
export type PlugrBillingTransactionType = z.infer<typeof PlugrBillingTransactionTypeSchema>
export type PlugrCancelSubscriptionRequest = z.infer<typeof PlugrCancelSubscriptionRequest>
export type PlugrCheckoutResponse = z.infer<typeof PlugrCheckoutResponse>
export type PlugrInlineCheckoutParams = z.infer<typeof PlugrInlineCheckoutParams>
export type PlugrCreateCheckoutRequest = z.infer<typeof PlugrCreateCheckoutRequest>
export type PlugrCreateCreditCheckoutRequest = z.infer<typeof PlugrCreateCreditCheckoutRequest>
export type PlugrVerifyTransactionRequest = z.infer<typeof PlugrVerifyTransactionRequest>
export type PlugrVerifyTransactionResponse = z.infer<typeof PlugrVerifyTransactionResponse>
export type PlugrCreditActionType = z.infer<typeof PlugrCreditActionTypeSchema>
export type PlugrCreditPackSize = z.infer<typeof PlugrCreditPackSizeSchema>
export type PlugrPaidTier = z.infer<typeof PlugrPaidTierSchema>
export type PlugrPriceBreakdown = {
    currency: PlugrBillingCurrency
    monthlyPrice: number
    months: number
    discountPercent: number
    totalBeforeDiscount: number
    savings: number
    total: number
}
export type PlugrPricingInfo = z.infer<typeof PlugrPricingInfo>
export type PlugrSubscriptionPeriod = z.infer<typeof PlugrSubscriptionPeriodSchema>
export type PlugrSubscriptionStatus = z.infer<typeof PlugrSubscriptionStatusSchema>
export type PlugrSubscriptionTier = z.infer<typeof PlugrSubscriptionTierSchema>
export type PlugrTrialStartResponse = z.infer<typeof PlugrTrialStartResponse>
export type PlugrUserBilling = z.infer<typeof PlugrUserBilling>

type PlugrCreditPack = {
    credits: number
    prices: Record<PlugrBillingCurrency, number>
}

type PlugrCreditPackPrice = {
    credits: number
    currency: PlugrBillingCurrency
    amount: number
}

type PlugrPlanCatalogEntry = {
    tier: PlugrPaidTier
    name: string
    prices: Record<PlugrBillingCurrency, number>
    includedCredits: number
    activeFlowsLimit: number | null
    features: string[]
    popular?: boolean
}

type PlugrSubscriptionPeriodConfig = {
    months: number
    discountPercent: number
    discount: number
    label: string
}