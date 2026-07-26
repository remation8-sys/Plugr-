import * as webPush from 'web-push'

const ALLOWED_WEB_PUSH_HOSTS = new Set([
    'android.googleapis.com',
    'fcm.googleapis.com',
    'push.services.mozilla.com',
    'updates.push.services.mozilla.com',
    'web.push.apple.com',
])

function isAllowedWebPushEndpoint(endpoint: string): boolean {
    try {
        const url = new URL(endpoint)
        const isWindowsPushHost = url.hostname === 'notify.windows.com' || url.hostname.endsWith('.notify.windows.com')
        return url.protocol === 'https:' &&
            url.port === '' &&
            url.username === '' &&
            url.password === '' &&
            (ALLOWED_WEB_PUSH_HOSTS.has(url.hostname) || isWindowsPushHost)
    }
    catch {
        return false
    }
}

function getWebPushErrorStatusCode(error: unknown): number | null {
    return error instanceof webPush.WebPushError ? error.statusCode : null
}

export {
    ALLOWED_WEB_PUSH_HOSTS,
    getWebPushErrorStatusCode,
    isAllowedWebPushEndpoint,
}
