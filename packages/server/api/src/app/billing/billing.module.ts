import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { plugrBillingController } from './billing.controller'

export const plugrBillingModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(plugrBillingController, { prefix: '/v1/user-billing' })
}