import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { requireTier } from '../billing/billing-guards'
import { agentToolsController } from './agent-tools-controller'

export const agentsModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', requireTier('business', 'The specialist agent is available on the Business plan. A real expert will build and fix your flows within 24-48hrs.'))
    await app.register(agentToolsController, { prefix: '/v1/projects/:projectId/agent-tools' })
}
