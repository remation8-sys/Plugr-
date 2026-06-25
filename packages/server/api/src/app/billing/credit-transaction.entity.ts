import { PlugrCreditActionType, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../database/database-common'

export type CreditTransactionSchema = {
    id: string
    created: string
    updated: string
    userId: string
    actionType: PlugrCreditActionType
    creditsUsed: number
    flowId: string | null
    user?: User
}

export const CreditTransactionEntity = new EntitySchema<CreditTransactionSchema>({
    name: 'credit_transactions',
    columns: {
        ...BaseColumnSchemaPart,
        userId: {
            type: String,
            nullable: false,
        },
        actionType: {
            type: String,
            nullable: false,
        },
        creditsUsed: {
            type: Number,
            nullable: false,
        },
        flowId: {
            type: String,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_credit_transactions_user_id_created',
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
                foreignKeyConstraintName: 'fk_credit_transactions_user_id',
            },
        },
    },
})