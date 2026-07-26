import { z } from 'zod'

const WebPushSubscriptionKeys = z.object({
    auth: z.string().min(1).max(512),
    p256dh: z.string().min(1).max(512),
})

const WebPushSubscriptionRequest = z.object({
    endpoint: z.string().url().max(2048),
    expirationTime: z.number().min(0).max(8_640_000_000_000_000).nullable(),
    keys: WebPushSubscriptionKeys,
})

const WebPushSubscriptionDeleteRequest = z.object({
    endpoint: z.string().url().max(2048),
})

const WebPushConfig = z.object({
    enabled: z.boolean(),
    publicKey: z.string().nullable(),
})

export {
    WebPushConfig,
    WebPushSubscriptionDeleteRequest,
    WebPushSubscriptionKeys,
    WebPushSubscriptionRequest,
}

export type WebPushConfig = z.infer<typeof WebPushConfig>
export type WebPushSubscriptionDeleteRequest = z.infer<typeof WebPushSubscriptionDeleteRequest>
export type WebPushSubscriptionKeys = z.infer<typeof WebPushSubscriptionKeys>
export type WebPushSubscriptionRequest = z.infer<typeof WebPushSubscriptionRequest>
