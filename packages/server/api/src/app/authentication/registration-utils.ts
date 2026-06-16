import { UserIdentity } from '@activepieces/shared'

export function getRegistrationWorkspaceName(identity: UserIdentity): string {
    return getSafeIdentityName(identity)
}

export function getRegistrationProjectName(identity: UserIdentity): string {
    return `${getSafeIdentityName(identity)}'s Project`
}

function getSafeIdentityName(identity: UserIdentity): string {
    const rawName = identity.email.split('@')[0] || identity.firstName || identity.email || 'Workspace'
    const safeName = rawName.replace(/[./]+/g, ' ').replace(/\s+/g, ' ').trim()
    return safeName || 'Workspace'
}
