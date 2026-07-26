import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import * as webPush from 'web-push'
import { db } from '../../../helpers/db'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const previousEnvironment = {
    privateKey: process.env.AP_WEB_PUSH_PRIVATE_KEY,
    publicKey: process.env.AP_WEB_PUSH_PUBLIC_KEY,
    subject: process.env.AP_WEB_PUSH_SUBJECT,
}
const vapidKeys = webPush.generateVAPIDKeys()
const subscriptionEndpoint = 'https://fcm.googleapis.com/fcm/send/integration-test'

let app: FastifyInstance | null = null

beforeAll(async () => {
    process.env.AP_WEB_PUSH_PRIVATE_KEY = vapidKeys.privateKey
    process.env.AP_WEB_PUSH_PUBLIC_KEY = vapidKeys.publicKey
    process.env.AP_WEB_PUSH_SUBJECT = 'mailto:test@example.com'
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
    restoreEnvironmentVariable('AP_WEB_PUSH_PRIVATE_KEY', previousEnvironment.privateKey)
    restoreEnvironmentVariable('AP_WEB_PUSH_PUBLIC_KEY', previousEnvironment.publicKey)
    restoreEnvironmentVariable('AP_WEB_PUSH_SUBJECT', previousEnvironment.subject)
})

describe('Web Push API', () => {
    it('returns the public VAPID configuration', async () => {
        const context = await createTestContext(getApp())
        const response = await context.get('/v1/web-push/config')

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()).toEqual({
            enabled: true,
            publicKey: vapidKeys.publicKey,
        })
    })

    it('creates and deletes a platform-scoped subscription', async () => {
        const ownerContext = await createTestContext(getApp())
        const otherPlatformContext = await createTestContext(getApp())
        const createResponse = await ownerContext.post('/v1/web-push/subscriptions', {
            endpoint: subscriptionEndpoint,
            expirationTime: null,
            keys: {
                auth: 'integration-auth',
                p256dh: 'integration-p256dh',
            },
        })
        expect(createResponse.statusCode).toBe(StatusCodes.NO_CONTENT)

        const stored = await db.findOneBy<StoredSubscription>('web_push_subscription', {
            endpoint: subscriptionEndpoint,
            platformId: ownerContext.platform.id,
        })
        expect(stored).toMatchObject({
            endpoint: subscriptionEndpoint,
            platformId: ownerContext.platform.id,
            userId: ownerContext.user.id,
        })

        const isolatedDeleteResponse = await otherPlatformContext.delete('/v1/web-push/subscriptions', {
            endpoint: subscriptionEndpoint,
        })
        expect(isolatedDeleteResponse.statusCode).toBe(StatusCodes.NO_CONTENT)
        expect(await db.findOneBy('web_push_subscription', {
            endpoint: subscriptionEndpoint,
            platformId: ownerContext.platform.id,
        })).not.toBeNull()

        const deleteResponse = await ownerContext.delete('/v1/web-push/subscriptions', {
            endpoint: subscriptionEndpoint,
        })
        expect(deleteResponse.statusCode).toBe(StatusCodes.NO_CONTENT)
        expect(await db.findOneBy('web_push_subscription', {
            endpoint: subscriptionEndpoint,
            platformId: ownerContext.platform.id,
        })).toBeNull()
    })

    it('rejects endpoints outside known browser push services', async () => {
        const context = await createTestContext(getApp())
        const response = await context.post('/v1/web-push/subscriptions', {
            endpoint: 'https://example.com/arbitrary-endpoint',
            expirationTime: null,
            keys: {
                auth: 'integration-auth',
                p256dh: 'integration-p256dh',
            },
        })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
    })
})

function getApp(): FastifyInstance {
    if (!app) {
        throw new Error('Test application was not initialized')
    }
    return app
}

function restoreEnvironmentVariable(name: string, value: string | undefined): void {
    if (value === undefined) {
        Reflect.deleteProperty(process.env, name)
        return
    }
    process.env[name] = value
}

type StoredSubscription = {
    endpoint: string
    platformId: string
    userId: string
}
