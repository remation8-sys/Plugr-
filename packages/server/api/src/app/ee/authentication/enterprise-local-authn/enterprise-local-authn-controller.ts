import {
    ResetPasswordRequestBody,
    VerifyEmailRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { checkAndReplyRateLimit } from '../../../core/security/redis-rate-limiter'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { enterpriseLocalAuthnService } from './enterprise-local-authn-service'

export const enterpriseLocalAuthnController: FastifyPluginAsyncZod = async (
    app,
) => {
    app.post('/verify-email', VerifyEmailRequest, async (req) => {
        await enterpriseLocalAuthnService(req.log).verifyEmail(req.body)
    })

    app.post('/reset-password', ResetPasswordRequest, async (req, reply) => {
        const limited = await checkAndReplyRateLimit(
            req.body.identityId,
            {
                keyPrefix: 'rate:reset-pwd',
                max: Number.parseInt(system.getOrThrow(AppSystemProp.API_RATE_LIMIT_RESET_PWD_MAX), 10),
                windowSeconds: Number.parseInt(system.getOrThrow(AppSystemProp.API_RATE_LIMIT_RESET_PWD_WINDOW), 10),
            },
            reply,
        )
        if (limited) {
            return
        }
        await enterpriseLocalAuthnService(req.log).resetPassword(req.body)
    })
}

const VerifyEmailRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        body: VerifyEmailRequestBody,
    },
}

const ResetPasswordRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        body: ResetPasswordRequestBody,
    },
}
