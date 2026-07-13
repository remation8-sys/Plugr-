import {
    ActivepiecesError,
    apId,
    ErrorCode,
    getPlugrCreditPackPrice,
    getPlugrCreditsRemaining,
    getPlugrPlanPrice,
    getPlugrTierRank,
    isNil,
    isPlugrPaidTier,
    PlugrBillingCurrency,
    PlugrBillingInfo,
    PlugrBillingTransaction,
    PlugrBillingTransactionStatus,
    PlugrBillingTransactionType,
    plugrCreditActionCosts,
    PlugrCreditActionType,
    PlugrCreditPackSize,
    PlugrInlineCheckoutParams,
    PlugrPaidTier,
    plugrPlanCatalog,
    PlugrPricingInfo,
    PlugrSubscriptionPeriod,
    PlugrUserBilling,
    PlugrVerifyTransactionResponse,
    User,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import { EntityManager } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { databaseConnection } from '../database/database-connection'
import { FlowEntity, FlowSchema } from '../flows/flow/flow.entity'
import { userRepo, userService } from '../user/user-service'
import { billingCountryService, type BillingLocation } from './billing-country.service'
import { billingEnv } from './billing-env'
import { BillingTransactionEntity, BillingTransactionSchema } from './billing-transaction.entity'
import { CreditPurchaseEntity, CreditPurchaseSchema } from './credit-purchase.entity'
import { CreditTransactionEntity, CreditTransactionSchema } from './credit-transaction.entity'
import { flutterwaveBillingService, FlutterwaveVerifiedTransaction } from './flutterwave-billing.service'

export const billingTransactionRepo = repoFactory<BillingTransactionSchema>(BillingTransactionEntity)
export const creditPurchaseRepo = repoFactory<CreditPurchaseSchema>(CreditPurchaseEntity)
export const creditTransactionRepo = repoFactory<CreditTransactionSchema>(CreditTransactionEntity)
const flowRepo = repoFactory<FlowSchema>(FlowEntity)

export const plugrBillingService = (log: FastifyBaseLogger) => ({
    async getPricing({ request }: GetPricingParams): Promise<PlugrPricingInfo> {
        const location = await billingCountryService(log).detect(request)
        return buildPricingInfo({ currency: location.currency, country: location.country })
    },

    async getInfo({ userId }: UserIdParams): Promise<PlugrBillingInfo> {
        const user = await getNormalizedUser({ userId, log })
        const history = await billingTransactionRepo().find({
            where: { userId },
            order: { created: 'DESC' },
            take: 12,
        })
        return {
            user: pickBillingFields(user),
            creditsRemaining: getPlugrCreditsRemaining({
                included: user.aiCreditsIncluded,
                purchased: user.aiCreditsPurchased,
                used: user.aiCreditsUsed,
            }),
            history: history.map(toBillingTransaction),
        }
    },

    async createSubscriptionCheckout(params: CreateSubscriptionCheckoutParams): Promise<{ checkoutUrl: string, reference: string, inline?: PlugrInlineCheckoutParams }> {
        // Plugr bills monthly only — ignore any other period the client sends.
        params.period = 'monthly'
        const user = await getNormalizedUser({ userId: params.userId, log })
        assertCanStartCheckout({ user, tier: params.tier })
        const location = await resolveBillingLocation({ request: params.request, user, log })
        const price = getPlugrPlanPrice({ tier: params.tier, period: params.period, currency: location.currency })
        const paymentPlanId = params.period === 'monthly'
            ? billingEnv.getMonthlyPlanId({ tier: params.tier, currency: location.currency })
            : undefined
        if (params.period === 'monthly' && isNil(paymentPlanId)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: `Flutterwave monthly plan ID is missing for ${params.tier} ${location.currency}` },
            })
        }
        const userMeta = await userService(log).getMetaInformation({ id: params.userId })
        const reference = `plg_sub_${apId()}`
        await savePendingTransaction({
            userId: params.userId,
            type: 'subscription',
            tier: params.tier,
            period: params.period,
            creditsPurchased: null,
            amountPaid: price.total,
            currency: location.currency,
            reference,
        })
        const customerName = `${userMeta.firstName} ${userMeta.lastName}`.trim()
        const title = `Plugr ${plugrPlanCatalog[params.tier].name}`
        const description = `${plugrPlanCatalog[params.tier].name} plan for Plugr`
        const metadata = {
            plugrPaymentType: 'subscription',
            userId: params.userId,
            tier: params.tier,
            period: params.period,
            currency: location.currency,
            billingCountry: location.country,
        }
        const checkoutUrl = await flutterwaveBillingService(log).createCheckout({
            amount: price.total,
            currency: location.currency,
            customerEmail: userMeta.email,
            customerName,
            reference,
            redirectUrl: buildRedirectUrl({ status: 'success' }),
            title,
            description,
            metadata,
            paymentPlanId,
        })
        return {
            checkoutUrl,
            reference,
            inline: buildInlineParams({
                amount: price.total,
                currency: location.currency,
                reference,
                customerEmail: userMeta.email,
                customerName,
                title,
                description,
                metadata,
                paymentPlanId,
            }),
        }
    },
    async createCreditCheckout(params: CreateCreditCheckoutParams): Promise<{ checkoutUrl: string, reference: string, inline?: PlugrInlineCheckoutParams }> {
        const user = await getNormalizedUser({ userId: params.userId, log })
        assertPlugrAccess(user)
        const location = await resolveBillingLocation({ request: params.request, user, log })
        const price = getPlugrCreditPackPrice({ pack: params.pack, currency: location.currency })
        const userMeta = await userService(log).getMetaInformation({ id: params.userId })
        const reference = `plg_crd_${apId()}`
        await savePendingTransaction({
            userId: params.userId,
            type: 'credits',
            tier: null,
            period: null,
            creditsPurchased: price.credits,
            amountPaid: price.amount,
            currency: location.currency,
            reference,
        })
        const customerName = `${userMeta.firstName} ${userMeta.lastName}`.trim()
        const title = `${price.credits} Plugr credits`
        const description = `${price.credits} Plugr credits`
        const metadata = {
            plugrPaymentType: 'credits',
            userId: params.userId,
            pack: params.pack,
            credits: price.credits,
            currency: location.currency,
            billingCountry: location.country,
        }
        const checkoutUrl = await flutterwaveBillingService(log).createCheckout({
            amount: price.amount,
            currency: location.currency,
            customerEmail: userMeta.email,
            customerName,
            reference,
            redirectUrl: buildRedirectUrl({ status: 'success' }),
            title,
            description,
            metadata,
        })
        return {
            checkoutUrl,
            reference,
            inline: buildInlineParams({
                amount: price.amount,
                currency: location.currency,
                reference,
                customerEmail: userMeta.email,
                customerName,
                title,
                description,
                metadata,
            }),
        }
    },

    async cancelSubscription({ userId }: UserIdParams): Promise<PlugrBillingInfo> {
        const user = await getNormalizedUser({ userId, log })
        if (!isPlugrPaidTier(user.subscriptionTier) || user.subscriptionStatus === 'expired') {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'No active Plugr subscription was found' },
            })
        }
        if (!isNil(user.flutterwaveSubscriptionId)) {
            await flutterwaveBillingService(log).cancelSubscription(user.flutterwaveSubscriptionId)
        }
        else {
            log.warn({ userId }, 'User subscription has no Flutterwave subscription id; cancelling locally')
        }
        await userRepo().update({ id: userId }, {
            subscriptionStatus: 'cancelled',
            subscriptionEndsAt: user.subscriptionEndsAt ?? dayjs().toISOString(),
        })
        return this.getInfo({ userId })
    },

    async applyVerifiedTransaction(transaction: FlutterwaveVerifiedTransaction): Promise<void> {
        if (!isSuccessfulTransaction(transaction.status)) {
            await markTransactionByReference({ reference: transaction.reference, status: 'failed', transactionId: transaction.id })
            return
        }
        const paymentType = getStringMeta(transaction.meta, 'plugrPaymentType')
        switch (paymentType) {
            case 'subscription':
                await applySubscriptionPayment({ transaction, log })
                return
            case 'credits':
                await applyCreditPayment({ transaction, log })
                return
            default:
                log.info({ reference: transaction.reference }, 'Ignoring Flutterwave payment without Plugr metadata')
        }
    },

    async verifyAndApplyTransaction(params: VerifyTransactionParams): Promise<PlugrVerifyTransactionResponse> {
        let status: PlugrVerifyTransactionResponse['status'] = 'pending'
        if (!isNil(params.transactionId) && params.transactionId.length > 0) {
            const transaction = await flutterwaveBillingService(log).verifyTransaction(params.transactionId)
            const ownerId = getStringMeta(transaction.meta, 'userId')
            if (!isNil(ownerId) && ownerId !== params.userId) {
                throw new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: { message: 'This transaction does not belong to your account' },
                })
            }
            await this.applyVerifiedTransaction(transaction)
            status = isSuccessfulTransaction(transaction.status) ? 'successful' : 'failed'
        }
        else if (!isNil(params.reference) && params.reference.length > 0) {
            const record = await billingTransactionRepo().findOneBy({ userId: params.userId, flutterwaveReference: params.reference })
            if (record?.status === 'successful') {
                status = 'successful'
            }
            else if (record?.status === 'failed') {
                status = 'failed'
            }
        }
        const billing = await this.getInfo({ userId: params.userId })
        return { status, billing }
    },

    async markSubscriptionEnded(params: MarkSubscriptionEndedParams): Promise<void> {
        const user = await findUserFromWebhook(params)
        if (isNil(user)) {
            log.warn(params, 'Flutterwave subscription event did not match a Plugr user')
            return
        }
        await userRepo().update({ id: user.id }, {
            subscriptionStatus: 'expired',
            subscriptionEndsAt: user.subscriptionEndsAt ?? dayjs().toISOString(),
        })
    },

    async assertUserHasAppAccess({ userId }: UserIdParams): Promise<void> {
        const user = await getNormalizedUser({ userId, log })
        assertAppAccess(user)
    },

    async assertUserHasPlugrAccess({ userId }: UserIdParams): Promise<void> {
        const user = await getNormalizedUser({ userId, log })
        assertPlugrAccess(user)
    },

    async assertUserHasMinimumTier(params: MinimumTierParams): Promise<void> {
        const user = await getNormalizedUser({ userId: params.userId, log })
        assertMinimumTier({ user, minimumTier: params.minimumTier, message: params.message })
    },

    async deductCredits(params: DeductCreditsParams): Promise<void> {
        await deductCredits({ ...params, log })
    },

    async assertActiveFlowsAllowed({ userId }: ActiveFlowLimitParams): Promise<void> {
        const user = await getNormalizedUser({ userId, log })
        assertAppAccess(user)
    },

    async canExecuteFlow({ flowId }: FlowIdParams): Promise<boolean> {
        const flow = await flowRepo().findOneBy({ id: flowId })
        if (isNil(flow?.ownerId)) {
            return true
        }
        const user = await getNormalizedUser({ userId: flow.ownerId, log })
        return hasAppAccess(user)
    },
})
async function deductCredits(params: DeductCreditsParams & { log: FastifyBaseLogger }): Promise<void> {
    const cost = plugrCreditActionCosts[params.actionType]
    await databaseConnection().transaction(async (entityManager) => {
        const user = await getNormalizedUser({ userId: params.userId, log: params.log, entityManager, lock: true })
        assertPlugrAccess(user)
        const remaining = getPlugrCreditsRemaining({
            included: user.aiCreditsIncluded,
            purchased: user.aiCreditsPurchased,
            used: user.aiCreditsUsed,
        })
        if (remaining < cost) {
            throw new ActivepiecesError({
                code: ErrorCode.FEATURE_DISABLED,
                params: { message: `You need ${cost - remaining} more credits for this. Buy credits or upgrade your plan.` },
            })
        }
        await userRepo(entityManager).update({ id: params.userId }, {
            aiCreditsUsed: user.aiCreditsUsed + cost,
        })
        await creditTransactionRepo(entityManager).save({
            id: apId(),
            userId: params.userId,
            actionType: params.actionType,
            creditsUsed: cost,
            flowId: params.flowId ?? null,
        })
    })
}

async function applySubscriptionPayment({ transaction, log }: ApplyTransactionParams): Promise<void> {
    const userId = getRequiredMeta(transaction.meta, 'userId')
    const tier = parsePaidTier(getRequiredMeta(transaction.meta, 'tier'))
    const period = parsePeriod(getRequiredMeta(transaction.meta, 'period'))
    const expectedPrice = getPlugrPlanPrice({ tier, period, currency: transaction.currency })
    assertAmountMatches({ actual: transaction.amount, expected: expectedPrice.total, currency: transaction.currency })
    const applied = await databaseConnection().transaction(async (entityManager) => {
        if (await isTransactionAlreadyApplied({ reference: transaction.reference, entityManager })) {
            return false
        }
        const now = dayjs()
        const plan = plugrPlanCatalog[tier]
        await userRepo(entityManager).update({ id: userId }, {
            subscriptionTier: tier,
            subscriptionStatus: 'active',
            subscriptionPeriod: period,
            subscriptionStartsAt: now.toISOString(),
            subscriptionEndsAt: now.add(expectedPrice.months, 'month').toISOString(),
            flutterwaveCustomerId: transaction.customerId,
            flutterwavePlanId: transaction.paymentPlanId,
            billingCurrency: transaction.currency,
            billingCountry: transaction.currency === 'NGN' ? 'NG' : 'OTHER',
            aiCreditsIncluded: plan.includedCredits,
            aiCreditsUsed: 0,
            aiCreditsResetAt: now.add(1, 'month').toISOString(),
        })
        await markTransactionByReference({ reference: transaction.reference, status: 'successful', transactionId: transaction.id, entityManager })
        return true
    })
    if (applied) {
        log.info({ userId, tier, period, reference: transaction.reference }, 'Plugr subscription payment applied')
    }
}

async function applyCreditPayment({ transaction, log }: ApplyTransactionParams): Promise<void> {
    const userId = getRequiredMeta(transaction.meta, 'userId')
    const pack = parseCreditPack(getRequiredMeta(transaction.meta, 'pack'))
    const expectedPrice = getPlugrCreditPackPrice({ pack, currency: transaction.currency })
    assertAmountMatches({ actual: transaction.amount, expected: expectedPrice.amount, currency: transaction.currency })
    const applied = await databaseConnection().transaction(async (entityManager) => {
        if (await isTransactionAlreadyApplied({ reference: transaction.reference, entityManager })) {
            return false
        }
        const user = await getNormalizedUser({ userId, log, entityManager, lock: true })
        await userRepo(entityManager).update({ id: userId }, {
            aiCreditsPurchased: user.aiCreditsPurchased + expectedPrice.credits,
        })
        await creditPurchaseRepo(entityManager).save({
            id: apId(),
            userId,
            creditsPurchased: expectedPrice.credits,
            amountPaid: expectedPrice.amount,
            currency: transaction.currency,
            flutterwaveReference: transaction.reference,
        })
        await markTransactionByReference({ reference: transaction.reference, status: 'successful', transactionId: transaction.id, entityManager })
        return true
    })
    if (applied) {
        log.info({ userId, credits: expectedPrice.credits, reference: transaction.reference }, 'Plugr credits added')
    }
}

async function isTransactionAlreadyApplied({ reference, entityManager }: IsTransactionAppliedParams): Promise<boolean> {
    if (reference.length === 0) {
        return false
    }
    const record = await billingTransactionRepo(entityManager).findOne({
        where: { flutterwaveReference: reference },
        lock: { mode: 'pessimistic_write' },
    })
    return record?.status === 'successful'
}

async function resolveBillingLocation(params: ResolveBillingLocationParams): Promise<BillingLocation> {
    const detected = await billingCountryService(params.log).detect(params.request)
    if (detected.country === 'NG') {
        await persistUserBillingLocationIfChanged({ user: params.user, location: detected })
        return detected
    }
    if (params.user.billingCountry === 'NG' || params.user.billingCurrency === 'NGN') {
        return { country: 'NG', currency: 'NGN' }
    }
    return detected
}

async function persistUserBillingLocationIfChanged({ user, location }: PersistBillingLocationParams): Promise<void> {
    if (user.billingCountry === location.country && user.billingCurrency === location.currency) {
        return
    }
    await userRepo().update({ id: user.id }, {
        billingCountry: location.country,
        billingCurrency: location.currency,
    })
}

async function getNormalizedUser(params: NormalizeUserParams): Promise<User> {
    const repo = userRepo(params.entityManager)
    const query = repo.createQueryBuilder('user').where('user.id = :userId', { userId: params.userId })
    const user = params.lock ? await query.setLock('pessimistic_write').getOneOrFail() : await query.getOneOrFail()
    const updates = getBillingNormalizationUpdates(user)
    if (Object.keys(updates).length === 0) {
        return user
    }
    await repo.update({ id: user.id }, updates)
    return {
        ...user,
        ...updates,
    }
}

function getBillingNormalizationUpdates(user: User): Partial<User> {
    const now = dayjs()
    const updates: Partial<User> = {}
    if (user.subscriptionStatus === 'trial' && !isNil(user.trialEndsAt) && dayjs(user.trialEndsAt).isBefore(now)) {
        updates.subscriptionStatus = 'expired'
    }
    if ((user.subscriptionStatus === 'active' || user.subscriptionStatus === 'cancelled') && !isNil(user.subscriptionEndsAt) && dayjs(user.subscriptionEndsAt).isBefore(now)) {
        updates.subscriptionStatus = 'expired'
    }
    if (user.subscriptionStatus === 'active' && isPlugrPaidTier(user.subscriptionTier) && !isNil(user.aiCreditsResetAt) && dayjs(user.aiCreditsResetAt).isBefore(now)) {
        updates.aiCreditsIncluded = plugrPlanCatalog[user.subscriptionTier].includedCredits
        updates.aiCreditsUsed = 0
        updates.aiCreditsResetAt = now.add(1, 'month').toISOString()
    }
    return updates
}

async function savePendingTransaction(params: SavePendingTransactionParams): Promise<void> {
    await billingTransactionRepo().save({
        id: apId(),
        userId: params.userId,
        type: params.type,
        status: 'pending',
        tier: params.tier,
        period: params.period,
        creditsPurchased: params.creditsPurchased,
        amountPaid: params.amountPaid,
        currency: params.currency,
        flutterwaveReference: params.reference,
        flutterwaveTransactionId: null,
        receiptUrl: null,
    })
}

async function markTransactionByReference(params: MarkTransactionParams): Promise<void> {
    if (params.reference.length === 0) {
        return
    }
    await billingTransactionRepo(params.entityManager).update({ flutterwaveReference: params.reference }, {
        status: params.status,
        flutterwaveTransactionId: params.transactionId,
    })
}

async function findUserFromWebhook(params: MarkSubscriptionEndedParams): Promise<User | null> {
    if (!isNil(params.userId)) {
        return userRepo().findOneBy({ id: params.userId })
    }
    if (!isNil(params.subscriptionId)) {
        return userRepo().findOneBy({ flutterwaveSubscriptionId: params.subscriptionId })
    }
    return null
}
function assertCanStartCheckout({ user, tier }: AssertCheckoutParams): void {
    if (user.subscriptionStatus === 'expired' || !isPlugrPaidTier(user.subscriptionTier)) {
        return
    }
    assertAppAccess(user)
    if (getPlugrTierRank(tier) < getPlugrTierRank(user.subscriptionTier)) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: 'Downgrades wait until the current paid period ends. Cancel your current plan first, then choose the lower plan after the period ends.' },
        })
    }
}

function assertAppAccess(user: User): void {
    if (hasAppAccess(user)) {
        return
    }
    const message = user.subscriptionTier === 'trial'
        ? 'Your 7-day free trial has ended. Choose a plan to keep automating.'
        : 'Your subscription has ended. Reactivate to continue using Plugr.'
    throw new ActivepiecesError({
        code: ErrorCode.FEATURE_DISABLED,
        params: { message },
    })
}

function assertPlugrAccess(user: User): void {
    assertAppAccess(user)
    if (user.subscriptionTier === 'trial') {
        throw new ActivepiecesError({
            code: ErrorCode.FEATURE_DISABLED,
            params: { message: 'Plugr is available on paid plans. Start a plan to unlock Plugr.' },
        })
    }
}

function assertMinimumTier({ user, minimumTier, message }: AssertMinimumTierParams): void {
    assertAppAccess(user)
    if (getPlugrTierRank(user.subscriptionTier) >= getPlugrTierRank(minimumTier)) {
        return
    }
    const planName = plugrPlanCatalog[minimumTier].name
    throw new ActivepiecesError({
        code: ErrorCode.FEATURE_DISABLED,
        params: { message: message ?? 'Available on ' + planName + ' plan.' },
    })
}

function hasAppAccess(user: User): boolean {
    if (user.subscriptionStatus === 'expired') {
        return false
    }
    if (user.subscriptionStatus === 'trial') {
        return !isNil(user.trialEndsAt) && dayjs(user.trialEndsAt).isAfter(dayjs())
    }
    if (user.subscriptionStatus === 'active') {
        return true
    }
    if (user.subscriptionStatus === 'cancelled') {
        return !isNil(user.subscriptionEndsAt) && dayjs(user.subscriptionEndsAt).isAfter(dayjs())
    }
    return false
}

function buildPricingInfo({ currency, country }: BuildPricingInfoParams): PlugrPricingInfo {
    return {
        country,
        currency,
        plans: {
            starter: buildPlanPricing({ tier: 'starter', currency }),
            builder: buildPlanPricing({ tier: 'builder', currency }),
            pro: buildPlanPricing({ tier: 'pro', currency }),
            business: buildPlanPricing({ tier: 'business', currency }),
        },
        creditPacks: {
            100: getPlugrCreditPackPrice({ pack: '100', currency }),
            500: getPlugrCreditPackPrice({ pack: '500', currency }),
            1000: getPlugrCreditPackPrice({ pack: '1000', currency }),
        },
    }
}

function buildPlanPricing({ tier, currency }: BuildPlanPricingParams) {
    const plan = plugrPlanCatalog[tier]
    return {
        tier,
        name: plan.name,
        includedCredits: plan.includedCredits,
        activeFlowsLimit: plan.activeFlowsLimit,
        popular: plan.popular,
        features: plan.features,
        prices: {
            monthly: getPlugrPlanPrice({ tier, period: 'monthly', currency }),
            quarterly: getPlugrPlanPrice({ tier, period: 'quarterly', currency }),
            biannual: getPlugrPlanPrice({ tier, period: 'biannual', currency }),
            annual: getPlugrPlanPrice({ tier, period: 'annual', currency }),
        },
    }
}

function pickBillingFields(user: User): PlugrUserBilling {
    return {
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPeriod: user.subscriptionPeriod,
        trialStartsAt: user.trialStartsAt,
        trialEndsAt: user.trialEndsAt,
        subscriptionStartsAt: user.subscriptionStartsAt,
        subscriptionEndsAt: user.subscriptionEndsAt,
        flutterwaveCustomerId: user.flutterwaveCustomerId,
        flutterwaveSubscriptionId: user.flutterwaveSubscriptionId,
        flutterwavePlanId: user.flutterwavePlanId,
        billingCountry: user.billingCountry,
        billingCurrency: user.billingCurrency,
        aiCreditsIncluded: user.aiCreditsIncluded,
        aiCreditsUsed: user.aiCreditsUsed,
        aiCreditsPurchased: user.aiCreditsPurchased,
        aiCreditsResetAt: user.aiCreditsResetAt,
    }
}

function toBillingTransaction(transaction: BillingTransactionSchema): PlugrBillingTransaction {
    return {
        id: transaction.id,
        created: transaction.created,
        type: transaction.type,
        status: transaction.status,
        tier: transaction.tier,
        period: transaction.period,
        creditsPurchased: transaction.creditsPurchased,
        amountPaid: transaction.amountPaid,
        currency: transaction.currency,
        flutterwaveReference: transaction.flutterwaveReference,
        flutterwaveTransactionId: transaction.flutterwaveTransactionId,
        receiptUrl: transaction.receiptUrl,
    }
}

function parsePaidTier(value: string): PlugrPaidTier {
    switch (value) {
        case 'starter':
        case 'builder':
        case 'pro':
        case 'business':
            return value
    }
    throw new Error(`Invalid Plugr plan tier ${value}`)
}

function parsePeriod(value: string): PlugrSubscriptionPeriod {
    switch (value) {
        case 'monthly':
        case 'quarterly':
        case 'biannual':
        case 'annual':
            return value
    }
    return 'monthly'
}

function parseCreditPack(value: string): PlugrCreditPackSize {
    switch (value) {
        case '100':
        case '500':
        case '1000':
            return value
    }
    throw new Error(`Invalid Plugr credit pack ${value}`)
}

function getRequiredMeta(meta: Record<string, unknown>, key: string): string {
    const value = getStringMeta(meta, key)
    if (isNil(value)) {
        throw new Error(`Flutterwave metadata is missing ${key}`)
    }
    return value
}

function getStringMeta(meta: Record<string, unknown>, key: string): string | undefined {
    const value = meta[key]
    if (typeof value === 'string' && value.length > 0) {
        return value
    }
    if (typeof value === 'number') {
        return String(value)
    }
    return undefined
}

function assertAmountMatches({ actual, expected, currency }: AssertAmountMatchesParams): void {
    if (actual !== expected) {
        throw new Error(`Flutterwave amount mismatch for ${currency}. Expected ${expected}, got ${actual}`)
    }
}

function isSuccessfulTransaction(status: string | undefined): boolean {
    return ['successful', 'success', 'succeeded'].includes(status ?? '')
}

function getFrontendUrl(): string {
    return (billingEnv.get('FRONTEND_URL') ?? 'http://localhost:8080').replace(/\/$/, '')
}

function buildRedirectUrl({ status }: BuildRedirectUrlParams): string {
    return `${getFrontendUrl()}/billing/${status}`
}

function buildInlineParams(params: BuildInlineParams): PlugrInlineCheckoutParams | undefined {
    const publicKey = billingEnv.get('FLUTTERWAVE_PUBLIC_KEY')
    if (isNil(publicKey)) {
        return undefined
    }
    return {
        publicKey,
        txRef: params.reference,
        amount: params.amount,
        currency: params.currency,
        paymentPlanId: params.paymentPlanId,
        paymentOptions: 'card,banktransfer,ussd',
        redirectUrl: buildRedirectUrl({ status: 'success' }),
        customer: {
            email: params.customerEmail,
            name: params.customerName,
        },
        meta: params.metadata,
        customizations: {
            title: params.title,
            description: params.description,
            logo: `${getFrontendUrl()}/plugr-logo-v2.png`,
        },
    }
}

type ActiveFlowLimitParams = UserIdParams & {
    flowId: string
}

type AssertMinimumTierParams = {
    user: User
    minimumTier: PlugrPaidTier
    message?: string
}

type ApplyTransactionParams = {
    transaction: FlutterwaveVerifiedTransaction
    log: FastifyBaseLogger
}

type AssertAmountMatchesParams = {
    actual: number
    expected: number
    currency: PlugrBillingCurrency
}

type AssertCheckoutParams = {
    user: User
    tier: PlugrPaidTier
}

type BuildPlanPricingParams = {
    tier: PlugrPaidTier
    currency: PlugrBillingCurrency
}

type BuildPricingInfoParams = {
    country: 'NG' | 'OTHER'
    currency: PlugrBillingCurrency
}

type BuildRedirectUrlParams = {
    status: 'success' | 'failed'
}

type BuildInlineParams = {
    amount: number
    currency: PlugrBillingCurrency
    reference: string
    customerEmail: string
    customerName: string
    title: string
    description: string
    metadata: Record<string, string | number | boolean | null>
    paymentPlanId?: string
}

type CreateCreditCheckoutParams = UserIdParams & {
    request: FastifyRequest
    pack: PlugrCreditPackSize
}

type CreateSubscriptionCheckoutParams = UserIdParams & {
    request: FastifyRequest
    tier: PlugrPaidTier
    period: PlugrSubscriptionPeriod
}

type DeductCreditsParams = UserIdParams & {
    actionType: PlugrCreditActionType
    flowId?: string
}

type FlowIdParams = {
    flowId: string
}

type GetPricingParams = {
    request: FastifyRequest
}

type MarkSubscriptionEndedParams = {
    userId?: string
    subscriptionId?: string
}

type MinimumTierParams = UserIdParams & {
    minimumTier: PlugrPaidTier
    message?: string
}

type VerifyTransactionParams = UserIdParams & {
    transactionId?: string
    reference?: string
}

type IsTransactionAppliedParams = {
    reference: string
    entityManager: EntityManager
}

type MarkTransactionParams = {
    reference: string
    status: PlugrBillingTransactionStatus
    transactionId: string
    entityManager?: EntityManager
}

type NormalizeUserParams = UserIdParams & {
    log: FastifyBaseLogger
    entityManager?: EntityManager
    lock?: boolean
}

type ResolveBillingLocationParams = {
    request: FastifyRequest
    user: User
    log: FastifyBaseLogger
}

type PersistBillingLocationParams = {
    user: User
    location: BillingLocation
}

type SavePendingTransactionParams = UserIdParams & {
    type: PlugrBillingTransactionType
    tier: PlugrPaidTier | null
    period: PlugrSubscriptionPeriod | null
    creditsPurchased: number | null
    amountPaid: number
    currency: PlugrBillingCurrency
    reference: string
}

type UserIdParams = {
    userId: string
}