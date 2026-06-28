import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { plugrUserMustHavePlugrAccess } from '../../billing/billing-guards'
import { chatController } from './chat-controller'

// Plugr gates the AI chat purely by its own subscription tiers (paid users only,
// trials blocked) via plugrUserMustHavePlugrAccess — NOT by Activepieces'
// per-platform `chatEnabled` plan flag, which would otherwise block every
// customer who isn't the operator. So the chat is available on all editions.
export const chatModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', plugrUserMustHavePlugrAccess)
    await app.register(chatController, { prefix: '/v1/chat' })
}
