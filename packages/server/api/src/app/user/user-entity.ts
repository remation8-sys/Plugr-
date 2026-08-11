import { Project, User, UserBadge, UserIdentity } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../database/database-common'

export type UserSchema = User & {
    projects: Project[]
    identity: UserIdentity
    badges: UserBadge[]
}

export const UserEntity = new EntitySchema<UserSchema>({
    name: 'user',
    columns: {
        ...BaseColumnSchemaPart,
        status: {
            type: String,
        },
        platformRole: {
            type: String,
            nullable: false,
        },
        identityId: {
            type: String,
            nullable: false,
        },
        externalId: {
            type: String,
            nullable: true,
        },
        platformId: {
            type: String,
            nullable: true,
        },
        lastActiveDate: {
            type: 'timestamp with time zone',
            nullable: true,
        },
        subscriptionTier: {
            type: String,
            nullable: false,
            default: 'free',
        },
        subscriptionStatus: {
            type: String,
            nullable: false,
            default: 'none',
        },
        subscriptionPeriod: {
            type: String,
            nullable: false,
            default: 'monthly',
        },
        trialStartsAt: {
            type: 'timestamp with time zone',
            nullable: true,
        },
        trialEndsAt: {
            type: 'timestamp with time zone',
            nullable: true,
        },
        subscriptionStartsAt: {
            type: 'timestamp with time zone',
            nullable: true,
        },
        subscriptionEndsAt: {
            type: 'timestamp with time zone',
            nullable: true,
        },
        flutterwaveCustomerId: {
            type: String,
            nullable: true,
        },
        flutterwaveSubscriptionId: {
            type: String,
            nullable: true,
        },
        flutterwavePlanId: {
            type: String,
            nullable: true,
        },
        billingCountry: {
            type: String,
            nullable: false,
            default: 'OTHER',
        },
        billingCurrency: {
            type: String,
            nullable: false,
            default: 'USD',
        },
        aiCreditsIncluded: {
            type: Number,
            nullable: false,
            default: 0,
        },
        aiCreditsUsed: {
            type: Number,
            nullable: false,
            default: 0,
        },
        aiCreditsPurchased: {
            type: Number,
            nullable: false,
            default: 0,
        },
        aiCreditsResetAt: {
            type: 'timestamp with time zone',
            nullable: true,
        },
        canvasSlotsPurchased: {
            type: Number,
            nullable: false,
            default: 0,
        },
        executionCreditsIncluded: {
            type: Number,
            nullable: false,
            default: 2000,
        },
        executionCreditsUsed: {
            type: Number,
            nullable: false,
            default: 0,
        },
        executionCreditsPurchased: {
            type: Number,
            nullable: false,
            default: 0,
        },
        executionCreditsResetAt: {
            type: 'timestamp with time zone',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_user_platform_id_email',
            columns: ['platformId', 'identityId'],
            unique: true,
        },
        {
            name: 'idx_user_platform_id_external_id',
            columns: ['platformId', 'externalId'],
            unique: true,
        },
        {
            name: 'idx_user_identity_id',
            columns: ['identityId'],
        },
    ],
    relations: {
        projects: {
            type: 'one-to-many',
            target: 'project',
            inverseSide: 'owner',
        },
        identity: {
            type: 'many-to-one',
            target: 'user_identity',
            joinColumn: {
                name: 'identityId',
                referencedColumnName: 'id',
            },
        },
        badges: {
            type: 'one-to-many',
            target: 'user_badge',
            inverseSide: 'user',
        },
    },
})