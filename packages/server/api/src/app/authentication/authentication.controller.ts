import { ApplicationEventName,
    isNil,
    PrincipalType,
    SignInRequest,
    SignUpRequest,
    SwitchPlatformRequest,
    UserIdentityProvider,
} from '@activepieces/shared'
import { RateLimitOptions } from '@fastify/rate-limit'
import { FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { billingCountryService } from '../billing/billing-country.service'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { applicationEvents } from '../helper/application-events'
import { networkUtils } from '../helper/network-utils'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { platformUtils } from '../platform/platform.utils'
import { userService } from '../user/user-service'
import { userInvitationsService } from '../user-invitations/user-invitation.service'
import { authenticationService } from './authentication.service'

export const authenticationController: FastifyPluginAsyncZod = async (
    app,
) => {
    app.post('/sign-up', SignUpRequestOptions, async (request) => {

        // Public SaaS signup must create the user's OWN isolated workspace/platform.
        // We only attach the request's platform (the operator/oldest platform on self-hosted
        // editions) when the email is actually invited to it. Otherwise we pass null so the
        // signup service provisions a brand new platform + project for this user.
        const platformId = await resolveSignUpPlatformId(request, request.body.email)
        const billingLocation = await billingCountryService(request.log).detect(request)
        const signUpResponse = await authenticationService(request.log).signUp({
            ...request.body,
            provider: UserIdentityProvider.EMAIL,
            platformId,
            billingCountry: billingLocation.country,
            billingCurrency: billingLocation.currency,
        })

        if (!isNil(signUpResponse.platformId)) {
            applicationEvents(request.log).sendUserEvent({
                platformId: signUpResponse.platformId,
                userId: signUpResponse.id,
                projectId: signUpResponse.projectId ?? undefined,
                ip: networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
            }, {
                action: ApplicationEventName.USER_SIGNED_UP,
                data: {
                    source: 'credentials',
                },
            })
        }

        return signUpResponse
    })

    app.post('/sign-in', SignInRequestOptions, async (request) => {

        // Don't pin sign-in to the operator/oldest platform. Each user owns their own
        // workspace, so we let the service resolve the platform the user actually belongs to
        // (via their preferred/last-used platform). Passing null enables that resolution.
        const response = await authenticationService(request.log).signInWithPassword({
            email: request.body.email,
            password: request.body.password,
            predefinedPlatformId: null,
        })

        if (!isNil(response.platformId)) {
            applicationEvents(request.log).sendUserEvent({
                platformId: response.platformId,
                userId: response.id,
                projectId: response.projectId ?? undefined,
                ip: networkUtils.extractClientRealIp(request, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
            }, {
                action: ApplicationEventName.USER_SIGNED_IN,
                data: {},
            })
        }

        return response
    })

    app.post('/switch-platform', SwitchPlatformRequestOptions, async (request) => {
        const user = await userService(request.log).getOneOrFail({ id: request.principal.id })
        return authenticationService(request.log).switchPlatform({
            identityId: user.identityId,
            platformId: request.body.platformId,
        })
    })

}

async function resolveSignUpPlatformId(request: FastifyRequest, email: string): Promise<string | null> {
    const candidatePlatformId = await platformUtils.getPlatformIdForRequest(request)
    // Cloud-style requests already resolve to null (own platform); nothing to gate.
    if (isNil(candidatePlatformId)) {
        return null
    }
    // Only join the existing platform when the email has actually been invited to it.
    // Anyone else gets their own fresh workspace (platformId = null).
    const isInvited = await userInvitationsService(request.log).hasAnyAcceptedInvitations({
        platformId: candidatePlatformId,
        email,
    })
    return isInvited ? candidatePlatformId : null
}

const rateLimitOptions: RateLimitOptions = {
    max: Number.parseInt(
        system.getOrThrow(AppSystemProp.API_RATE_LIMIT_AUTHN_MAX),
        10,
    ),
    timeWindow: system.getOrThrow(AppSystemProp.API_RATE_LIMIT_AUTHN_WINDOW),
}



const SwitchPlatformRequestOptions = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SwitchPlatformRequest,
    },
}

const SignUpRequestOptions = {
    config: {
        security: securityAccess.public(),
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SignUpRequest,
    },
}

const SignInRequestOptions = {
    config: {
        security: securityAccess.public(),
        rateLimit: rateLimitOptions,
    },
    schema: {
        body: SignInRequest,
    },
}
