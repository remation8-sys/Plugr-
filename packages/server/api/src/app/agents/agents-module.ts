import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { plugrUserMustHavePlugrAccess } from '../billing/billing-guards'
import { agentToolsController } from './agent-tools-controller'

export const agentsModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', plugrUserMustHavePlugrAccess)
    await app.register(agentToolsController, { prefix: '/v1/projects/:projectId/agent-tools' })
}
