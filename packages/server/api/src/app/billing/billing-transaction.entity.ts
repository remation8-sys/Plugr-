import { PlugrBillingCurrency, PlugrBillingTransactionStatus, PlugrBillingTransactionType, PlugrPaidTier, PlugrSubscriptionPeriod, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../database/database-common'

export type BillingTransactionSchema = {
    id: string
    created: string
    updated: string
    userId: string
    type: PlugrBillingTransactionType
    status: PlugrBillingTransactionStatus
    tier: PlugrPaidTier | null
    period: PlugrSubscriptionPeriod | null
    creditsPurchased: number | null
    amountPaid: number
    currency: PlugrBillingCurrency
    flutterwaveReference: string | null
    flutterwaveTransactionId: string | null
    receiptUrl: string | null
    user?: User
}

export const BillingTransactionEntity = new EntitySchema<BillingTransactionSchema>({
    name: 'billing_transactions',
    columns: {
        ...BaseColumnSchemaPart,
        userId: {
            type: String,
            nullable: false,
        },
        type: {
            type: String,
            nullable: false,
        },
        status: {
            type: String,
            nullable: false,
        },
        tier: {
            type: String,
            nullable: true,
        },
        period: {
            type: String,
            nullable: true,
        },
        creditsPurchased: {
            type: Number,
            nullable: true,
        },
        amountPaid: {
            type: Number,
            nullable: false,
        },
        currency: {
            type: String,
            nullable: false,
        },
        flutterwaveReference: {
            type: String,
            nullable: true,
            unique: true,
        },
        flutterwaveTransactionId: {
            type: String,
            nullable: true,
        },
        receiptUrl: {
            type: String,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_billing_transactions_user_id_created',
            columns: ['userId', 'created'],
        },
    ],
    relations: {
        user: {
            type: 'many-to-one',
            target: 'user',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'userId',
                foreignKeyConstraintName: 'fk_billing_transactions_user_id',
            },
        },
    },
})