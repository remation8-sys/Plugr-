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

// TEMPORARY local-only proof-of-concept endpoint used to verify the new
// EXECUTE_ACTION engine/worker path in isolation, without touching the
// existing MCP executeAdhocAction (temp-flow) mechanism at all. Not wired
// into production — see conversation for context before promoting this.
export const adhocRunController: FastifyPluginCallbackZod = (app, _opts, done) => {
    app.post('/test-piece-action', TestPieceActionRequest, async (request) => {
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

const TestPieceActionRequest = {
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
        description: 'TEMPORARY test-only endpoint for the ad-hoc single-step run proof of concept',
        body: z.object({
            projectId: ApId,
            pieceName: z.string(),
            pieceVersion: z.string(),
            actionName: z.string(),
            input: z.record(z.string(), z.unknown()),
        }),
    },
}
