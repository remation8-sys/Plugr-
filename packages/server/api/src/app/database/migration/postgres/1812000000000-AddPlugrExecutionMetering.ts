import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddPlugrExecutionMetering1812000000000 implements Migration {
    name = 'AddPlugrExecutionMetering1812000000000'
    breaking = false
    release = '0.86.5'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD COLUMN IF NOT EXISTS "canvasSlotsPurchased" integer NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "executionCreditsIncluded" integer NOT NULL DEFAULT 2000,
            ADD COLUMN IF NOT EXISTS "executionCreditsUsed" integer NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "executionCreditsPurchased" integer NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "executionCreditsResetAt" TIMESTAMP WITH TIME ZONE
        `)

        await queryRunner.query(`
            ALTER TABLE "credit_purchases"
            ADD COLUMN IF NOT EXISTS "productType" character varying NOT NULL DEFAULT 'ai_credits'
        `)

        // Plugr had no live users at the time of this pricing-model overhaul (4 paid
        // tiers -> free/plus + pay-as-you-go), so any existing dev/staging rows are
        // collapsed outright rather than value-mapped. Tier/status history is not
        // preserved by design - see the plan doc for this change.
        await queryRunner.query(`
            UPDATE "user"
            SET "subscriptionTier" = 'free', "subscriptionStatus" = 'none'
            WHERE "subscriptionStatus" != 'active'
        `)
        await queryRunner.query(`
            UPDATE "user"
            SET "subscriptionTier" = 'plus'
            WHERE "subscriptionStatus" = 'active'
        `)

        // Column defaults from the original billing migration are stale ('trial') -
        // new rows are always inserted with explicit values by the app, but fix the
        // column-level defaults too so they can't silently resurrect the old tier.
        await queryRunner.query(`
            ALTER TABLE "user"
            ALTER COLUMN "subscriptionTier" SET DEFAULT 'free',
            ALTER COLUMN "subscriptionStatus" SET DEFAULT 'none'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Tier/status collapse in up() is intentionally lossy and not reversed here.
        await queryRunner.query(`
            ALTER TABLE "user"
            ALTER COLUMN "subscriptionTier" SET DEFAULT 'trial',
            ALTER COLUMN "subscriptionStatus" SET DEFAULT 'trial'
        `)
        await queryRunner.query(`
            ALTER TABLE "credit_purchases"
            DROP COLUMN IF EXISTS "productType"
        `)
        await queryRunner.query(`
            ALTER TABLE "user"
            DROP COLUMN IF EXISTS "executionCreditsResetAt",
            DROP COLUMN IF EXISTS "executionCreditsPurchased",
            DROP COLUMN IF EXISTS "executionCreditsUsed",
            DROP COLUMN IF EXISTS "executionCreditsIncluded",
            DROP COLUMN IF EXISTS "canvasSlotsPurchased"
        `)
    }
}
