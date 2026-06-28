import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { plugrUserMustHaveAppAccess } from '../billing/billing-guards'
import { aiProviderController } from './ai-provider-controller'

export const aiProviderModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', plugrUserMustHaveAppAccess)
    await app.register(aiProviderController, { prefix: '/v1/ai-providers' })
}
