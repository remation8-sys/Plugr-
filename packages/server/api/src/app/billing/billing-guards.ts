import { PlugrPaidTier, PrincipalType } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { plugrBillingService } from './billing.service'

export async function plugrUserMustHaveAppAccess(request: FastifyRequest): Promise<void> {
    if (request.principal.type !== PrincipalType.USER) {
        return
    }
    await plugrBillingService(request.log).assertUserHasAppAccess({ userId: request.principal.id })
}

export async function plugrUserMustHavePlugrAccess(request: FastifyRequest): Promise<void> {
    if (request.principal.type !== PrincipalType.USER) {
        return
    }
    await plugrBillingService(request.log).assertUserHasPlugrAccess({ userId: request.principal.id })
}

export function plugrUserMustHaveMinimumTier(minimumTier: PlugrPaidTier, message?: string): (request: FastifyRequest) => Promise<void> {
    return async (request: FastifyRequest): Promise<void> => {
        if (request.principal.type !== PrincipalType.USER) {
            return
        }
        await plugrBillingService(request.log).assertUserHasMinimumTier({
            userId: request.principal.id,
            minimumTier,
            message,
        })
    }
}

export const checkSubscription = plugrUserMustHaveAppAccess
export const checkAIAccess = plugrUserMustHavePlugrAccess
export const requireTier = plugrUserMustHaveMinimumTier