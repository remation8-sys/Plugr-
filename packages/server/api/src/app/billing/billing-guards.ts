import { PrincipalType } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { plugrBillingService } from './billing.service'

export async function plugrUserMustHavePlugrAccess(request: FastifyRequest): Promise<void> {
    if (request.principal.type !== PrincipalType.USER) {
        return
    }
    await plugrBillingService(request.log).assertUserHasPlugrAccess({ userId: request.principal.id })
}
