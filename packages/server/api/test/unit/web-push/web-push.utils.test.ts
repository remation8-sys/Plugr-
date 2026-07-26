import { describe, expect, it } from 'vitest'
import { isAllowedWebPushEndpoint } from '../../../src/app/web-push/web-push.utils'

describe('isAllowedWebPushEndpoint', () => {
    it.each([
        'https://fcm.googleapis.com/fcm/send/example',
        'https://updates.push.services.mozilla.com/wpush/v2/example',
        'https://web.push.apple.com/Q/example',
        'https://db5.notify.windows.com/w/?token=example',
    ])('allows a browser push service endpoint: %s', (endpoint) => {
        expect(isAllowedWebPushEndpoint(endpoint)).toBe(true)
    })

    it.each([
        'http://fcm.googleapis.com/fcm/send/example',
        'https://127.0.0.1/push',
        'https://example.com/push',
        'https://fcm.googleapis.com:8443/fcm/send/example',
        'not-a-url',
    ])('rejects an unsafe or unrelated endpoint: %s', (endpoint) => {
        expect(isAllowedWebPushEndpoint(endpoint)).toBe(false)
    })
})
