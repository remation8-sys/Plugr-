import { apId } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { plugrBillingService } from '../../../../src/app/billing/billing.service'
import { FlutterwaveVerifiedTransaction } from '../../../../src/app/billing/flutterwave-billing.service'
import { db } from '../../../helpers/db'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let ctx: TestContext

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    ctx = await createTestContext(app!)
})

// These simulate what happens once Flutterwave confirms a payment succeeded -
// the exact metadata shape our checkout methods attach and our webhook/verify
// handler consumes. Proves "pay for X -> automatically receive X" end to end
// on the side that's actually ours to get right (Flutterwave's own charge
// processing is out of scope for a unit-level test).

async function savePendingTransaction(params: { reference: string, userId: string, type: string, tier?: string | null, period?: string | null, creditsPurchased?: number | null, amountPaid: number, currency: string }): Promise<void> {
    await db.save('billing_transactions', {
        id: apId(),
        userId: params.userId,
        type: params.type,
        status: 'pending',
        tier: params.tier ?? null,
        period: params.period ?? null,
        creditsPurchased: params.creditsPurchased ?? null,
        amountPaid: params.amountPaid,
        currency: params.currency,
        flutterwaveReference: params.reference,
        flutterwaveTransactionId: null,
        receiptUrl: null,
    })
}

function buildTransaction(params: { reference: string, amount: number, currency: 'USD' | 'NGN', meta: Record<string, unknown> }): FlutterwaveVerifiedTransaction {
    return {
        id: apId(),
        reference: params.reference,
        status: 'successful',
        amount: params.amount,
        currency: params.currency,
        flutterwaveReference: params.reference,
        customerId: 'cus_test',
        customerEmail: 'test@example.com',
        paymentPlanId: null,
        meta: params.meta,
        processorResponse: null,
    }
}

describe('Plugr billing fulfillment - pay for X, automatically receive X', () => {
    it('subscription payment upgrades the user to Plugr Plus with the plan credits', async () => {
        const reference = `plg_sub_${apId()}`
        await savePendingTransaction({
            reference,
            userId: ctx.user.id,
            type: 'subscription',
            tier: 'plus',
            period: 'monthly',
            amountPaid: 15,
            currency: 'USD',
        })

        await plugrBillingService(app!.log).applyVerifiedTransaction(buildTransaction({
            reference,
            amount: 15,
            currency: 'USD',
            meta: { plugrPaymentType: 'subscription', userId: ctx.user.id, tier: 'plus', period: 'monthly' },
        }))

        const user = await db.findOneByOrFail<{ subscriptionTier: string, subscriptionStatus: string, aiCreditsIncluded: number, aiCreditsUsed: number }>('user', { id: ctx.user.id })
        expect(user.subscriptionTier).toBe('plus')
        expect(user.subscriptionStatus).toBe('active')
        expect(user.aiCreditsIncluded).toBe(75)
        expect(user.aiCreditsUsed).toBe(0)

        const txn = await db.findOneByOrFail<{ status: string }>('billing_transactions', { flutterwaveReference: reference })
        expect(txn.status).toBe('successful')
    })

    it('AI credit pack payment adds to the purchased balance', async () => {
        const reference = `plg_crd_${apId()}`
        await savePendingTransaction({
            reference,
            userId: ctx.user.id,
            type: 'ai_credits',
            creditsPurchased: 100,
            amountPaid: 50,
            currency: 'USD',
        })

        await plugrBillingService(app!.log).applyVerifiedTransaction(buildTransaction({
            reference,
            amount: 50,
            currency: 'USD',
            meta: { plugrPaymentType: 'ai_credits', userId: ctx.user.id, pack: '100' },
        }))

        const user = await db.findOneByOrFail<{ aiCreditsPurchased: number }>('user', { id: ctx.user.id })
        expect(user.aiCreditsPurchased).toBe(100)

        const purchase = await db.findOneByOrFail<{ productType: string, creditsPurchased: number }>('credit_purchases', { flutterwaveReference: reference })
        expect(purchase.productType).toBe('ai_credits')
        expect(purchase.creditsPurchased).toBe(100)
    })

    it('execution credit top-up payment adds to the purchased balance, never expires', async () => {
        const reference = `plg_exc_${apId()}`
        await savePendingTransaction({
            reference,
            userId: ctx.user.id,
            type: 'execution_credits',
            amountPaid: 5,
            currency: 'USD',
        })

        await plugrBillingService(app!.log).applyVerifiedTransaction(buildTransaction({
            reference,
            amount: 5,
            currency: 'USD',
            meta: { plugrPaymentType: 'execution_credits', userId: ctx.user.id },
        }))

        const user = await db.findOneByOrFail<{ executionCreditsPurchased: number }>('user', { id: ctx.user.id })
        expect(user.executionCreditsPurchased).toBe(5000)

        const purchase = await db.findOneByOrFail<{ productType: string, creditsPurchased: number }>('credit_purchases', { flutterwaveReference: reference })
        expect(purchase.productType).toBe('execution_credits')
        expect(purchase.creditsPurchased).toBe(5000)
    })

    it('canvas slot payment grants exactly one additional permanent slot', async () => {
        const reference = `plg_cvs_${apId()}`
        await savePendingTransaction({
            reference,
            userId: ctx.user.id,
            type: 'canvas_slot',
            amountPaid: 5,
            currency: 'USD',
        })

        await plugrBillingService(app!.log).applyVerifiedTransaction(buildTransaction({
            reference,
            amount: 5,
            currency: 'USD',
            meta: { plugrPaymentType: 'canvas_slot', userId: ctx.user.id },
        }))

        const user = await db.findOneByOrFail<{ canvasSlotsPurchased: number }>('user', { id: ctx.user.id })
        expect(user.canvasSlotsPurchased).toBe(1)
    })

    it('never double-grants when Flutterwave sends the same successful webhook twice', async () => {
        const reference = `plg_cvs_${apId()}`
        await savePendingTransaction({
            reference,
            userId: ctx.user.id,
            type: 'canvas_slot',
            amountPaid: 5,
            currency: 'USD',
        })
        const transaction = buildTransaction({
            reference,
            amount: 5,
            currency: 'USD',
            meta: { plugrPaymentType: 'canvas_slot', userId: ctx.user.id },
        })

        await plugrBillingService(app!.log).applyVerifiedTransaction(transaction)
        await plugrBillingService(app!.log).applyVerifiedTransaction(transaction)

        const user = await db.findOneByOrFail<{ canvasSlotsPurchased: number }>('user', { id: ctx.user.id })
        expect(user.canvasSlotsPurchased).toBe(1)

        const purchases = await db.findOneByOrFail<{ id: string }>('credit_purchases', { flutterwaveReference: reference })
        expect(purchases).toBeDefined()
    })

    it('grants nothing when the transaction is not successful', async () => {
        const reference = `plg_cvs_${apId()}`
        await savePendingTransaction({
            reference,
            userId: ctx.user.id,
            type: 'canvas_slot',
            amountPaid: 5,
            currency: 'USD',
        })

        await plugrBillingService(app!.log).applyVerifiedTransaction({
            ...buildTransaction({
                reference,
                amount: 5,
                currency: 'USD',
                meta: { plugrPaymentType: 'canvas_slot', userId: ctx.user.id },
            }),
            status: 'failed',
        })

        const user = await db.findOneByOrFail<{ canvasSlotsPurchased: number }>('user', { id: ctx.user.id })
        expect(user.canvasSlotsPurchased).toBe(0)

        const txn = await db.findOneByOrFail<{ status: string }>('billing_transactions', { flutterwaveReference: reference })
        expect(txn.status).toBe('failed')
    })
})
