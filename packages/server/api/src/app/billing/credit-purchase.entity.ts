import { PlugrBillingCurrency, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../database/database-common'

export type CreditPurchaseSchema = {
    id: string
    created: string
    updated: string
    userId: string
    creditsPurchased: number
    amountPaid: number
    currency: PlugrBillingCurrency
    flutterwaveReference: string
    user?: User
}

export const CreditPurchaseEntity = new EntitySchema<CreditPurchaseSchema>({
    name: 'credit_purchases',
    columns: {
        ...BaseColumnSchemaPart,
        userId: {
            type: String,
            nullable: false,
        },
        creditsPurchased: {
            type: Number,
            nullable: false,
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
            nullable: false,
            unique: true,
        },
    },
    indices: [
        {
            name: 'idx_credit_purchases_user_id_created',
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
                foreignKeyConstraintName: 'fk_credit_purchases_user_id',
            },
        },
    },
})