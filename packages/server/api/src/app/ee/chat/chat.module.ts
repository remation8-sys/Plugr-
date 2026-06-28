import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { plugrUserMustHavePlugrAccess } from '../../billing/billing-guards'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { chatController } from './chat-controller'

export const chatModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.chatEnabled))
    app.addHook('preHandler', plugrUserMustHavePlugrAccess)
    await app.register(chatController, { prefix: '/v1/chat' })
}
