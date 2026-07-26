import { Platform, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

type WebPushSubscriptionSchema = {
    id: string
    created: string
    updated: string
    platformId: string
    userId: string
    endpoint: string
    endpointHash: string
    auth: string
    p256dh: string
    expirationTime: Date | null
    platform?: Platform
    user?: User
}

const WebPushSubscriptionEntity = new EntitySchema<WebPushSubscriptionSchema>({
    name: 'web_push_subscription',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: ApIdSchema,
        userId: ApIdSchema,
        endpoint: {
            type: 'text',
        },
        endpointHash: {
            type: String,
            length: 64,
        },
        auth: {
            type: 'text',
        },
        p256dh: {
            type: 'text',
        },
        expirationTime: {
            type: 'timestamp with time zone',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_web_push_subscription_platform_endpoint',
            columns: ['platformId', 'endpointHash'],
            unique: true,
        },
        {
            name: 'idx_web_push_subscription_platform_user',
            columns: ['platformId', 'userId'],
        },
    ],
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                foreignKeyConstraintName: 'fk_web_push_subscription_platform',
            },
        },
        user: {
            type: 'many-to-one',
            target: 'user',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'userId',
                foreignKeyConstraintName: 'fk_web_push_subscription_user',
            },
        },
    },
})

export { WebPushSubscriptionEntity }
export type { WebPushSubscriptionSchema }
