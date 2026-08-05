import {
    ApId,
    FlowActionType,
    Permission,
    PieceActionSettings,
    PrincipalType,
    WorkerJobType,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { getPiecePackageWithoutArchive } from '../pieces/metadata/piece-metadata-service'
import { userInteractionWatcher } from '../workers/user-interaction-watcher'

// Runs a single piece action outside of any flow, using the EXECUTE_ACTION
// engine/worker path (see adhocStepRunner / action.operation.ts). Kept
// deliberately separate from the existing MCP executeAdhocAction mechanism
// in flow-run-utils.ts (which builds a real throwaway flow + test-steps it)
// — that mechanism is unchanged and still what Raymond's tool-calling uses.
// This is a lighter-weight alternative for internal/tooling use: no flow is
// created, and results aren't persisted (no run history yet).
export const adhocRunController: FastifyPluginCallbackZod = (app, _opts, done) => {
    app.post('/run-piece-action', RunPieceActionRequest, async (request) => {
        const { projectId, pieceName, pieceVersion, actionName, input } = request.body
        const platformId = request.principal.platform.id

        const piece = await getPiecePackageWithoutArchive(request.log, platformId, {
            pieceName,
            pieceVersion,
        })

        const settings: PieceActionSettings = {
            pieceName,
            pieceVersion: piece.pieceVersion,
            actionName,
            input,
            propertySettings: {},
            errorHandlingOptions: {
                continueOnFailure: { value: false },
                retryOnFailure: { value: false },
            },
        }

        const result = await userInteractionWatcher.submitAndWaitForResponse({
            jobType: WorkerJobType.EXECUTE_ACTION,
            projectId,
            platformId,
            piece,
            step: {
                name: 'step_1',
                displayName: actionName,
                valid: true,
                lastUpdatedDate: dayjs().toISOString(),
                type: FlowActionType.PIECE,
                settings,
            },
        }, request.log)

        return result
    })
    done()
}

const RunPieceActionRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.WRITE_FLOW,
            {
                type: ProjectResourceType.BODY,
            },
        ),
    },
    schema: {
        tags: ['adhoc-run'],
        description: 'Run a single piece action outside of any flow and return its result directly',
        body: z.object({
            projectId: ApId,
            pieceName: z.string(),
            pieceVersion: z.string(),
            actionName: z.string(),
            input: z.record(z.string(), z.unknown()),
        }),
    },
}
