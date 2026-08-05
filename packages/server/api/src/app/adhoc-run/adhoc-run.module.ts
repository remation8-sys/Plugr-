import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { adhocRunController } from './adhoc-run.controller'

export const adhocRunModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(adhocRunController, {
        prefix: '/v1/adhoc-runs',
    })
}
