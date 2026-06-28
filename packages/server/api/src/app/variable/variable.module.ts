import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { plugrUserMustHaveAppAccess } from '../billing/billing-guards'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { variableWorkerController } from './variable-worker.controller'
import { variableController } from './variable.controller'

export const variableModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', plugrUserMustHaveAppAccess)
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(variableController, {
        prefix: '/v1/variables',
    })
    await app.register(variableWorkerController, {
        prefix: '/v1/worker/variables',
    })
}
