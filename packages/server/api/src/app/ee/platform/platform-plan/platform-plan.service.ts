import { apDayjs } from '@activepieces/server-utils'
import { ActivepiecesError, AiCreditsAutoTopUpState, ApEdition, ApEnvironment, apId, ErrorCode, FlowStatus, isCloudPlanButNotEnterprise, isNil, OPEN_SOURCE_PLAN, PlanName, PlatformPlan, PlatformPlanLimits, PlatformPlanWithOnlyLimits, PlatformUsage, PlatformUsageMetric, PRICE_ID_MAP, PRICE_NAMES, STANDARD_CLOUD_PLAN, TeamProjectsLimit, UserWithMetaInformation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../../core/db/repo-factory'
import { getPlatformPlanNameKey } from '../../../database/redis/keys'
import { distributedLock, distributedStore } from '../../../database/redis-connections'
import { flowRepo } from '../../../flows/flow/flow.repo'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { isOperatorPlatform, platformService } from '../../../platform/platform.service'
import { userService } from '../../../user/user-service'
import { platformAiCreditsService } from './platform-ai-credits.service'
import { PlatformPlanEntity } from './platform-plan.entity'
import { stripeHelper } from './stripe-helper'

export const platformPlanRepo = repoFactory(PlatformPlanEntity)

type UpdatePlatformBillingParams = {
    platformId: string
} & Partial<PlatformPlanLimits>

const edition = system.getEdition()
const stripeSecretKey = system.get(AppSystemProp.STRIPE_SECRET_KEY)

export const ACTIVE_FLOW_PRICE_ID = getPriceIdFor(PRICE_NAMES.ACTIVE_FLOWS)

export const platformPlanService = (log: FastifyBaseLogger) => ({

    async getOrCreateForPlatform(platformId: string): Promise<PlatformPlan> {
        const plan = await getOrCreatePlatformPlan(platformId, log)
        return applyOperatorPlanOverride(platformId, plan)
    },

    async getBillingDates(platformPlan: PlatformPlan): Promise<{ startDate: number, endDate: number }> {
        const { stripeSubscriptionStartDate: startDate, stripeSubscriptionEndDate: endDate } = platformPlan

        if (isNil(startDate) || isNil(endDate)) {
            return { startDate: apDayjs().startOf('month').unix(), endDate: apDayjs().endOf('month').unix() }
        }
        return { startDate, endDate }
    },

    async update(params: UpdatePlatformBillingParams): Promise<PlatformPlan> {
        const { platformId, ...update } = params
        log.info({ platformId }, 'updating platform billing')

        const platformPlan = await platformPlanRepo().findOneByOrFail({
            platformId,
        })

        const normalizedUpdate = Object.fromEntries(
            Object.entries(update).map(([key, value]) => [key, value === undefined ? null : value]),
        )

        const updatedPlatformPlan = await platformPlanRepo().save({ ...platformPlan, ...normalizedUpdate })
        if (!isNil(updatedPlatformPlan.plan)) {
            await distributedStore.put(getPlatformPlanNameKey(platformId), updatedPlatformPlan.plan)
        }
        return updatedPlatformPlan
    },
    async getNextBillingAmount(params: GetBillingAmountParams): Promise<number> {
        const { subscriptionId } = params
        const stripe = stripeHelper(log).getStripe()
        if (isNil(stripe)) {
            return 0
        }

        try {
            const upcomingInvoice = await stripe.invoices.createPreview({
                subscription: subscriptionId ?? undefined,
            })

            return upcomingInvoice.amount_due ? upcomingInvoice.amount_due / 100 : 0
        }
        catch {
            return 0
        }
    },
    async isCloudNonEnterprisePlan(platformId: string): Promise<boolean> {
        const platformPlan = await platformPlanRepo().findOneByOrFail({ platformId })
        return isCloudPlanButNotEnterprise(platformPlan.plan)
    },
    async getUsage(platformId: string): Promise<PlatformUsage> {
        const activeFlowsCount = await flowRepo()
            .createQueryBuilder('flow')
            .innerJoin('project', 'project', 'project.id = flow."projectId"')
            .where('project."platformId" = :platformId', { platformId })
            .andWhere('flow.status = :status', { status: FlowStatus.ENABLED })
            .getCount()
        const aiCreditsUsage = await platformAiCreditsService(log).getUsage(platformId)
        return {
            activeFlows: activeFlowsCount,
            aiCreditsLimit: aiCreditsUsage.limit,
            aiCreditsRemaining: aiCreditsUsage.usageRemaining,
            totalAiCreditsUsed: aiCreditsUsage.usage,
            totalAiCreditsUsedThisMonth: aiCreditsUsage.usageMonthly,
        }
    },
    checkActiveFlowsExceededLimit: async (platformId: string, metric: PlatformUsageMetric): Promise<void> => {
        if (ApEdition.COMMUNITY === edition) {
            return
        }
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        const usage = await platformPlanService(log).getUsage(platformId)
        if (!isNil(platformPlan.activeFlowsLimit) && usage.activeFlows >= platformPlan.activeFlowsLimit) {
            throw new ActivepiecesError({
                code: ErrorCode.QUOTA_EXCEEDED,
                params: {
                    metric,
                },
            })
        }
    },
})

async function getOrCreatePlatformPlan(platformId: string, log: FastifyBaseLogger): Promise<PlatformPlan> {
    const platformPlan = await platformPlanRepo().findOneBy({ platformId })
    if (!isNil(platformPlan)) return platformPlan

    return distributedLock(log).runExclusive({
        key: `platform_plan_${platformId}`,
        timeoutInSeconds: 60,
        fn: async () => {
            const platformPlan = await platformPlanRepo().findOneBy({ platformId })
            if (!isNil(platformPlan)) return platformPlan

            return createInitialBilling(platformId, log)
        },
    })
}

// Management features the SaaS operator (David's platform) always gets, so the platform-admin
// screens (branding, pieces, templates, SSO, API keys, audit logs, etc.) are never locked.
// Applied at read time, so it also covers an already-existing operator plan row and is never
// wiped by the license trial-tracker (which only touches platforms that hold a license key).
const PLUGR_OPERATOR_FEATURES: Partial<PlatformPlanWithOnlyLimits> = {
    tablesEnabled: true,
    embeddingEnabled: true,
    agentsEnabled: true,
    aiProvidersEnabled: true,
    chatEnabled: true,
    dataManipulationEnabled: true,
    globalConnectionsEnabled: true,
    customRolesEnabled: true,
    environmentsEnabled: true,
    eventStreamingEnabled: true,
    analyticsEnabled: true,
    auditLogEnabled: true,
    managePiecesEnabled: true,
    manageTemplatesEnabled: true,
    customAppearanceEnabled: true,
    teamProjectsLimit: TeamProjectsLimit.UNLIMITED,
    projectRolesEnabled: true,
    apiKeysEnabled: true,
    ssoEnabled: true,
    secretManagersEnabled: true,
    scimEnabled: true,
    activeFlowsLimit: null,
    projectsLimit: null,
}

async function applyOperatorPlanOverride(platformId: string, plan: PlatformPlan): Promise<PlatformPlan> {
    if (!(await isOperatorPlatform(platformId))) {
        return plan
    }
    return {
        ...plan,
        ...PLUGR_OPERATOR_FEATURES,
        plan: plan.plan ?? PlanName.ENTERPRISE,
    }
}

function getPriceIdFor(price: PRICE_NAMES): string {
    const isDev = stripeSecretKey?.startsWith('sk_test')
    const env = isDev ? 'dev' : 'prod'

    const entry = PRICE_ID_MAP[price]

    if (!entry) {
        throw new Error(`No price with the given price name '${price}' is available`)
    }

    return entry[env]
}

function getInitialPlanByEdition(): PlatformPlanWithOnlyLimits {
    switch (edition) {
        case ApEdition.COMMUNITY:
        case ApEdition.ENTERPRISE:
            return OPEN_SOURCE_PLAN
        case ApEdition.CLOUD:
            return STANDARD_CLOUD_PLAN
    }
}

async function createInitialBilling(platformId: string, log: FastifyBaseLogger): Promise<PlatformPlan> {
    const platform = await platformService(log).getOneOrThrow(platformId)
    const user = await userService(log).getMetaInformation({ id: platform.ownerId })
    const stripeCustomerId = await createInitialCustomer(user, platformId, log)

    const defaultStartDate = apDayjs().startOf('month').unix()
    const defaultEndDate = apDayjs().endOf('month').unix()

    const plan = getInitialPlanByEdition()

    const platformPlan: Omit<PlatformPlan, 'created' | 'updated'> = {
        ...plan,
        id: apId(),
        platformId,
        stripeCustomerId,
        stripeSubscriptionStartDate: defaultStartDate,
        stripeSubscriptionEndDate: defaultEndDate,
        aiCreditsAutoTopUpState: plan.aiCreditsAutoTopUpState ?? AiCreditsAutoTopUpState.DISABLED,
    }
    const savedPlatformPlan = await platformPlanRepo().save(platformPlan)
    if (!isNil(savedPlatformPlan.plan)) {
        await distributedStore.put(getPlatformPlanNameKey(platformId), savedPlatformPlan.plan)
    }

    return savedPlatformPlan
}

async function createInitialCustomer(user: UserWithMetaInformation, platformId: string, log: FastifyBaseLogger): Promise<string | undefined> {
    const environment = system.getOrThrow(AppSystemProp.ENVIRONMENT)
    if (edition !== ApEdition.CLOUD || environment === ApEnvironment.TESTING) {
        return undefined
    }
    const stripeCustomerId = await stripeHelper(log).createCustomer(
        user,
        platformId,
    )
    return stripeCustomerId
}

type GetBillingAmountParams = {
    subscriptionId?: string | null
}