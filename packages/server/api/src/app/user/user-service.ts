import {
    ActivepiecesError,
    ApEdition,
    apId,
    assertNotNullOrUndefined,
    Cursor,
    ErrorCode,
    isNil,
    PlatformId,
    PlatformRole,
    PlugrBillingCountry,
    PlugrBillingCurrency,
    plugrFreeTierConfig,
    ProjectId,
    ProjectType,
    SeekPage,
    spreadIfDefined,
    User,
    UserId,
    UserIdentity,
    UserStatus,
    UserWithBadges,
    UserWithMetaInformation,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { nanoid } from 'nanoid'
import { In, IsNull } from 'typeorm'
import { getRegistrationProjectName } from '../authentication/registration-utils'
import { userIdentityRepository, userIdentityService } from '../authentication/user-identity/user-identity-service'
import { repoFactory } from '../core/db/repo-factory'
import { platformProjectService } from '../ee/projects/platform-project-service'
import { upsertProjectOwnerMember } from '../ee/projects/project-members/project-member-utils'
import { projectMemberRepo } from '../ee/projects/project-role/project-role.service'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { system } from '../helper/system/system'
import { platformService } from '../platform/platform.service'
import { projectService } from '../project/project-service'
import { UserEntity, UserSchema } from './user-entity'


export const userRepo = repoFactory(UserEntity)

export const userService = (log: FastifyBaseLogger) => ({
    async create(params: CreateParams): Promise<User> {
        const isActive = params.isActive ?? true
        const billingDefaults = createFreeBillingDefaults({
            billingCountry: params.billingCountry ?? 'OTHER',
            billingCurrency: params.billingCurrency ?? 'USD',
        })
        const user: NewUser = {
            id: apId(),
            identityId: params.identityId,
            platformRole: params.platformRole,
            status: isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE,
            externalId: params.externalId,
            platformId: params.platformId,
            ...billingDefaults,
        }
        return userRepo().save(user)
    },
    async getOrCreateWithProject({ identity, platformId, billingCountry, billingCurrency }: GetOrCreateWithProjectParams): Promise<User> {
        const user = await this.getOneByIdentityAndPlatform({
            identityId: identity.id,
            platformId,
        })
        if (isNil(user)) {
            const newUser = await this.create({
                identityId: identity.id,
                platformId,
                platformRole: PlatformRole.MEMBER,
                billingCountry,
                billingCurrency,
            })

            await ensurePersonalProjectForUser({
                identity,
                user: newUser,
                platformId,
                isPrivileged: false,
                log,
            })
            return newUser
        }
        await ensurePersonalProjectForUser({
            identity,
            user,
            platformId,
            isPrivileged: this.isUserPrivileged(user),
            log,
        })
        return user
    },
    async updateLastActiveDate({ id }: UpdateLastActiveDateParams): Promise<void> {
        await userRepo().update({ id }, { lastActiveDate: dayjs().toISOString() })
    },
    async update({ id, status, platformId, platformRole, externalId }: UpdateParams): Promise<UserWithMetaInformation> {
        const user = await this.getOrThrow({ id })
        assertNotNullOrUndefined(user.platformId, 'platformId')

        if (user.platformId !== platformId) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'user',
                    entityId: id,
                },
            })
        }

        const platform = await platformService(log).getOneOrThrow(user.platformId)
        if (platform.ownerId === user.id && status === UserStatus.INACTIVE) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Admin cannot be deactivated',
                },
            })
        }

        await userRepo().update({
            id,
            platformId,
        }, {
            ...spreadIfDefined('status', status),
            ...spreadIfDefined('platformRole', platformRole),
            ...spreadIfDefined('externalId', externalId),
        })

        return this.getMetaInformation({ id })
    },
    async getUsersByIdentityId({ identityId }: GetUsersByIdentityIdParams): Promise<Pick<User, 'id' | 'platformId'>[]> {
        return userRepo().find({ where: { identityId } }).then((users) => users.map((user) => ({ id: user.id, platformId: user.platformId })))
    },
    async list({ platformId, externalId, cursorRequest, limit }: ListParams): Promise<SeekPage<UserWithMetaInformation>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
        const paginator = buildPaginator({
            entity: UserEntity,
            query: {
                limit,
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const { data, cursor } = await paginator.paginate(userRepo().createQueryBuilder('user').where({
            platformId,
            ...spreadIfDefined('externalId', externalId),
        }))

        const usersWithMetaInformation = await Promise.all(data.map(this.getMetaInformation))
        return paginationHelper.createPage<UserWithMetaInformation>(usersWithMetaInformation, cursor)
    },
    async getByIdentityId({ identityId }: GetByIdentityId): Promise<UserSchema[]> {
        return userRepo().find({ where: { identityId } })
    },
    async getOneByIdentityAndPlatform({ identityId, platformId }: GetOneByIdentityIdParams): Promise<User | null> {
        return userRepo().findOneBy({ identityId, platformId: isNil(platformId) ? IsNull() : platformId })
    },
    async get({ id }: IdParams): Promise<User | null> {
        return userRepo().findOneBy({ id })
    },
    async getOrThrow({ id }: IdParams): Promise<User> {
        const user = await userRepo().findOneBy({ id })
        if (isNil(user)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'user', entityId: id },
            })
        }
        return user
    },
    async getOneOrFail({ id }: IdParams): Promise<User> {
        return userRepo().findOneOrFail({ where: { id } })
    },
    async getOneByIdAndPlatformIdOrThrow({ id, platformId }: GetOneByIdAndPlatformIdParams): Promise<UserWithBadges> {
        const user = await userRepo().findOne({ where: { id, platformId }, relations: { badges: true } })
        if (isNil(user)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'user', entityId: id },
            })
        }
        const meta = await this.getMetaInformation({ id })
        return {
            ...meta,
            badges: user.badges.map((badge) => ({
                name: badge.name,
                created: badge.created,
            })),
        }
    },
    async delete({ id, platformId }: DeleteParams): Promise<void> {
        await assertNotPlatformOwner({ id, platformId, log })
        await platformProjectService(log).deletePersonalProjectForUser({
            userId: id,
            platformId,
        })
        await userRepo().delete({
            id,
            platformId,
        })
    },
    async removeFromPlatform({ id, platformId }: DeleteParams): Promise<void> {
        await assertNotPlatformOwner({ id, platformId, log })
        const user = await this.getOneOrFail({ id })
        await platformProjectService(log).deletePersonalProjectForUser({
            userId: id,
            platformId,
        })
        await userRepo().update({
            id,
            platformId,
        }, {
            platformId: null,
        })
        await userIdentityRepository().update(user.identityId, {
            tokenVersion: nanoid(),
        })
        await userIdentityRepository().update({
            id: user.identityId,
            lastLoggedInPlatformId: platformId,
        }, {
            lastLoggedInPlatformId: null,
        })
    },

    async getByPlatformRole(id: PlatformId, role: PlatformRole): Promise<UserSchema[]> {
        return userRepo().find({ where: { platformId: id, platformRole: role }, relations: { identity: true } })
    },
    async listProjectUsers({ platformId, projectId }: ListUsersForProjectParams): Promise<UserWithMetaInformation[]> {
        const users = await getUsersForProject(platformId, projectId)
        const usersWithMetaInformation = await userRepo().find({ where: { platformId, id: In(users) }, relations: { identity: true } }).then((users) => users.map(this.getMetaInformation))
        return Promise.all(usersWithMetaInformation)
    },
    async getByPlatformAndExternalId({
        platformId,
        externalId,
    }: GetByPlatformAndExternalIdParams): Promise<User | null> {
        return userRepo().findOneBy({
            platformId,
            externalId,
        })
    },
    async getMetaInformation({ id }: IdParams): Promise<UserWithMetaInformation> {
        const user = await userRepo().findOneByOrFail({ id })
        const identity = await userIdentityService(log).getBasicInformation(user.identityId)
        return {
            id: user.id,
            email: identity.email,
            firstName: identity.firstName,
            lastName: identity.lastName,
            platformId: user.platformId,
            platformRole: user.platformRole,
            status: user.status,
            externalId: user.externalId,
            created: user.created,
            updated: user.updated,
            lastActiveDate: user.lastActiveDate,
            imageUrl: identity.imageUrl,
            ...pickUserBillingFields(user),
        }
    },

    async addOwnerToPlatform({
        id,
        platformId,
    }: UpdatePlatformIdParams): Promise<void> {
        await userRepo().update(id, {
            updated: dayjs().toISOString(),
            platformRole: PlatformRole.ADMIN,
            platformId,
        })
    },

    isUserPrivileged(user: User): boolean {
        return user.platformRole === PlatformRole.ADMIN || user.platformRole === PlatformRole.OPERATOR
    },
})


function createFreeBillingDefaults({ billingCountry, billingCurrency }: CreateFreeBillingDefaultsParams): UserBillingFields {
    const now = dayjs()
    return {
        subscriptionTier: 'free',
        subscriptionStatus: 'none',
        subscriptionPeriod: 'monthly',
        trialStartsAt: null,
        trialEndsAt: null,
        subscriptionStartsAt: null,
        subscriptionEndsAt: null,
        flutterwaveCustomerId: null,
        flutterwaveSubscriptionId: null,
        flutterwavePlanId: null,
        billingCountry,
        billingCurrency,
        aiCreditsIncluded: 0,
        aiCreditsUsed: 0,
        aiCreditsPurchased: 0,
        aiCreditsResetAt: null,
        canvasSlotsPurchased: 0,
        executionCreditsIncluded: plugrFreeTierConfig.executionCredits,
        executionCreditsUsed: 0,
        executionCreditsPurchased: 0,
        executionCreditsResetAt: now.add(1, 'month').toISOString(),
    }
}

function pickUserBillingFields(user: User): UserBillingFields {
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
        canvasSlotsPurchased: user.canvasSlotsPurchased,
        executionCreditsIncluded: user.executionCreditsIncluded,
        executionCreditsUsed: user.executionCreditsUsed,
        executionCreditsPurchased: user.executionCreditsPurchased,
        executionCreditsResetAt: user.executionCreditsResetAt,
    }
}

async function assertNotPlatformOwner({ id, platformId, log }: DeleteParams & { log: FastifyBaseLogger }): Promise<void> {
    const platform = await platformService(log).getOneOrThrow(platformId)
    if (platform.ownerId === id) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'Platform owner cannot be deleted',
            },
        })
    }
}

async function ensurePersonalProjectForUser({
    identity,
    user,
    platformId,
    isPrivileged,
    log,
}: EnsurePersonalProjectForUserParams): Promise<void> {
    const projects = await projectService(log).getAllForUser({
        platformId,
        userId: user.id,
        isPrivileged,
    })
    const personalProject = projects.find((project) => project.ownerId === user.id && project.type === ProjectType.PERSONAL)
    const project = personalProject ?? await projectService(log).create({
        displayName: getRegistrationProjectName(identity),
        ownerId: user.id,
        platformId,
        type: ProjectType.PERSONAL,
    })
    await upsertProjectOwnerMember({
        platformId,
        projectId: project.id,
        userId: user.id,
    })
}

async function getUsersForProject(platformId: PlatformId, projectId: string): Promise<UserId[]> {
    const platformAdmins = await userRepo().find({ where: { platformId, platformRole: PlatformRole.ADMIN } }).then((users) => users.map((user) => user.id))
    const edition = system.getEdition()
    if (edition === ApEdition.COMMUNITY) {
        return platformAdmins
    }
    const projectMembers = await projectMemberRepo().find({ where: { projectId, platformId } }).then((members) => members.map((member) => member.userId))
    return [...platformAdmins, ...projectMembers]
}

type UpdateLastActiveDateParams = {
    id: UserId
}

type GetOneByIdAndPlatformIdParams = {
    id: UserId
    platformId: PlatformId
}
type ListUsersForProjectParams = {
    projectId: ProjectId
    platformId: PlatformId
}

type DeleteParams = {
    id: UserId
    platformId: PlatformId
}


type ListParams = {
    platformId: PlatformId
    externalId?: string
    cursorRequest: Cursor
    limit?: number
}

type GetByIdentityId = {
    identityId: string
}


type GetOneByIdentityIdParams = {
    identityId: string
    platformId: PlatformId | null
}

type UpdateParams = {
    id: UserId
    status?: UserStatus
    platformId: PlatformId
    platformRole?: PlatformRole
    externalId?: string
}

type CreateParams = {
    identityId: string
    platformId: string | null
    externalId?: string
    platformRole: PlatformRole
    isActive?: boolean
    billingCountry?: PlugrBillingCountry
    billingCurrency?: PlugrBillingCurrency
}
type GetUsersByIdentityIdParams = {
    identityId: string
}

type NewUser = Omit<User, 'created' | 'updated'>

type UserBillingFields = Pick<User, 'subscriptionTier' | 'subscriptionStatus' | 'subscriptionPeriod' | 'trialStartsAt' | 'trialEndsAt' | 'subscriptionStartsAt' | 'subscriptionEndsAt' | 'flutterwaveCustomerId' | 'flutterwaveSubscriptionId' | 'flutterwavePlanId' | 'billingCountry' | 'billingCurrency' | 'aiCreditsIncluded' | 'aiCreditsUsed' | 'aiCreditsPurchased' | 'aiCreditsResetAt' | 'canvasSlotsPurchased' | 'executionCreditsIncluded' | 'executionCreditsUsed' | 'executionCreditsPurchased' | 'executionCreditsResetAt'>

type CreateFreeBillingDefaultsParams = {
    billingCountry: PlugrBillingCountry
    billingCurrency: PlugrBillingCurrency
}

type GetByPlatformAndExternalIdParams = {
    platformId: string
    externalId: string
}

type IdParams = {
    id: UserId
}

type UpdatePlatformIdParams = {
    id: UserId
    platformId: string
}

type GetOrCreateWithProjectParams = {
    identity: UserIdentity
    platformId: string
    billingCountry?: PlugrBillingCountry
    billingCurrency?: PlugrBillingCurrency
}

type EnsurePersonalProjectForUserParams = {
    identity: UserIdentity
    user: User
    platformId: PlatformId
    isPrivileged: boolean
    log: FastifyBaseLogger
}
