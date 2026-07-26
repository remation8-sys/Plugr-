import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddWebPushSubscription1796000000000 implements Migration {
    name = 'AddWebPushSubscription1796000000000'
    breaking = false
    release = '0.85.2'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE IF NOT EXISTS "web_push_subscription" (' +
            '"id" character varying(21) NOT NULL, ' +
            '"created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ' +
            '"updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ' +
            '"platformId" character varying(21) NOT NULL, ' +
            '"userId" character varying(21) NOT NULL, ' +
            '"endpoint" text NOT NULL, ' +
            '"endpointHash" character varying(64) NOT NULL, ' +
            '"auth" text NOT NULL, ' +
            '"p256dh" text NOT NULL, ' +
            '"expirationTime" TIMESTAMP WITH TIME ZONE, ' +
            'CONSTRAINT "PK_web_push_subscription_id" PRIMARY KEY ("id"))',
        )
        await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "idx_web_push_subscription_platform_endpoint" ON "web_push_subscription" ("platformId", "endpointHash")')
        await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_web_push_subscription_platform_user" ON "web_push_subscription" ("platformId", "userId")')
        await queryRunner.query('ALTER TABLE "web_push_subscription" ADD CONSTRAINT "fk_web_push_subscription_platform" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE')
        await queryRunner.query('ALTER TABLE "web_push_subscription" ADD CONSTRAINT "fk_web_push_subscription_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "web_push_subscription" DROP CONSTRAINT IF EXISTS "fk_web_push_subscription_user"')
        await queryRunner.query('ALTER TABLE "web_push_subscription" DROP CONSTRAINT IF EXISTS "fk_web_push_subscription_platform"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_web_push_subscription_platform_user"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_web_push_subscription_platform_endpoint"')
        await queryRunner.query('DROP TABLE IF EXISTS "web_push_subscription"')
    }
}
