import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { webPushController } from './web-push.controller'

const webPushModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(webPushController, { prefix: '/v1/web-push' })
}

export { webPushModule }
