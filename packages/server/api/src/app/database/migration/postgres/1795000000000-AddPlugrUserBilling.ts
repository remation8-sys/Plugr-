import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddPlugrUserBilling1795000000000 implements Migration {
    name = 'AddPlugrUserBilling1795000000000'
    breaking = false
    release = '0.85.2'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD COLUMN IF NOT EXISTS "subscriptionTier" character varying NOT NULL DEFAULT 'trial',
            ADD COLUMN IF NOT EXISTS "subscriptionStatus" character varying NOT NULL DEFAULT 'trial',
            ADD COLUMN IF NOT EXISTS "subscriptionPeriod" character varying NOT NULL DEFAULT 'monthly',
            ADD COLUMN IF NOT EXISTS "trialStartsAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
            ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
            ADD COLUMN IF NOT EXISTS "subscriptionStartsAt" TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS "subscriptionEndsAt" TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS "flutterwaveCustomerId" character varying,
            ADD COLUMN IF NOT EXISTS "flutterwaveSubscriptionId" character varying,
            ADD COLUMN IF NOT EXISTS "flutterwavePlanId" character varying,
            ADD COLUMN IF NOT EXISTS "billingCountry" character varying NOT NULL DEFAULT 'OTHER',
            ADD COLUMN IF NOT EXISTS "billingCurrency" character varying NOT NULL DEFAULT 'USD',
            ADD COLUMN IF NOT EXISTS "aiCreditsIncluded" integer NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "aiCreditsUsed" integer NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "aiCreditsPurchased" integer NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "aiCreditsResetAt" TIMESTAMP WITH TIME ZONE
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "credit_transactions" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "userId" character varying NOT NULL,
                "actionType" character varying NOT NULL,
                "creditsUsed" integer NOT NULL,
                "flowId" character varying,
                CONSTRAINT "PK_credit_transactions_id" PRIMARY KEY ("id")
            )
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "credit_purchases" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "userId" character varying NOT NULL,
                "creditsPurchased" integer NOT NULL,
                "amountPaid" integer NOT NULL,
                "currency" character varying NOT NULL,
                "flutterwaveReference" character varying NOT NULL,
                CONSTRAINT "PK_credit_purchases_id" PRIMARY KEY ("id")
            )
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "billing_transactions" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "userId" character varying NOT NULL,
                "type" character varying NOT NULL,
                "status" character varying NOT NULL,
                "tier" character varying,
                "period" character varying,
                "creditsPurchased" integer,
                "amountPaid" integer NOT NULL,
                "currency" character varying NOT NULL,
                "flutterwaveReference" character varying,
                "flutterwaveTransactionId" character varying,
                "receiptUrl" character varying,
                CONSTRAINT "PK_billing_transactions_id" PRIMARY KEY ("id")
            )
        `)

        await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_credit_transactions_user_id_created" ON "credit_transactions" ("userId", "created")')
        await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_credit_purchases_user_id_created" ON "credit_purchases" ("userId", "created")')
        await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "idx_credit_purchases_flutterwave_reference" ON "credit_purchases" ("flutterwaveReference")')
        await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_billing_transactions_user_id_created" ON "billing_transactions" ("userId", "created")')
        await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "idx_billing_transactions_flutterwave_reference" ON "billing_transactions" ("flutterwaveReference")')

        await queryRunner.query('ALTER TABLE "credit_transactions" ADD CONSTRAINT "fk_credit_transactions_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE')
        await queryRunner.query('ALTER TABLE "credit_purchases" ADD CONSTRAINT "fk_credit_purchases_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE')
        await queryRunner.query('ALTER TABLE "billing_transactions" ADD CONSTRAINT "fk_billing_transactions_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "billing_transactions" DROP CONSTRAINT IF EXISTS "fk_billing_transactions_user_id"')
        await queryRunner.query('ALTER TABLE "credit_purchases" DROP CONSTRAINT IF EXISTS "fk_credit_purchases_user_id"')
        await queryRunner.query('ALTER TABLE "credit_transactions" DROP CONSTRAINT IF EXISTS "fk_credit_transactions_user_id"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_billing_transactions_flutterwave_reference"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_billing_transactions_user_id_created"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_credit_purchases_flutterwave_reference"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_credit_purchases_user_id_created"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_credit_transactions_user_id_created"')
        await queryRunner.query('DROP TABLE IF EXISTS "billing_transactions"')
        await queryRunner.query('DROP TABLE IF EXISTS "credit_purchases"')
        await queryRunner.query('DROP TABLE IF EXISTS "credit_transactions"')
        await queryRunner.query(`
            ALTER TABLE "user"
            DROP COLUMN IF EXISTS "aiCreditsResetAt",
            DROP COLUMN IF EXISTS "aiCreditsPurchased",
            DROP COLUMN IF EXISTS "aiCreditsUsed",
            DROP COLUMN IF EXISTS "aiCreditsIncluded",
            DROP COLUMN IF EXISTS "billingCurrency",
            DROP COLUMN IF EXISTS "billingCountry",
            DROP COLUMN IF EXISTS "flutterwavePlanId",
            DROP COLUMN IF EXISTS "flutterwaveSubscriptionId",
            DROP COLUMN IF EXISTS "flutterwaveCustomerId",
            DROP COLUMN IF EXISTS "subscriptionEndsAt",
            DROP COLUMN IF EXISTS "subscriptionStartsAt",
            DROP COLUMN IF EXISTS "trialEndsAt",
            DROP COLUMN IF EXISTS "trialStartsAt",
            DROP COLUMN IF EXISTS "subscriptionPeriod",
            DROP COLUMN IF EXISTS "subscriptionStatus",
            DROP COLUMN IF EXISTS "subscriptionTier"
        `)
    }
}