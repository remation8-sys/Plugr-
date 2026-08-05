import {
    DEFAULT_MCP_DATA,
    EngineOperationType,
    EngineResponseStatus,
    ExecuteActionJobData,
    FlowActionType,
    tryCatch,
    WorkerJobType,
} from '@activepieces/shared'
import { provisioner } from '../../cache/provisioner'
import { CodeArtifact } from '../../cache/code/code-builder'
import { JobContext, JobHandler, JobResultKind, SynchronousJobResult } from '../types'
import { isSandboxTimeout } from '../utils/sandbox-helpers'

// Ad-hoc actions run synchronously while the caller waits on the API-side watcher, whose
// safety timeout is 5 minutes (WATCHER_SAFETY_TIMEOUT_MS in user-interaction-watcher.ts). The
// sandbox timeout must stay well below that so a long-running step returns a clean TIMEOUT
// instead of the watcher giving up with an INTERNAL_ERROR.
const ADHOC_ACTION_TIMEOUT_SECONDS = 120

export const executeActionJob: JobHandler<ExecuteActionJobData, SynchronousJobResult> = {
    jobType: WorkerJobType.EXECUTE_ACTION,
    async execute(ctx: JobContext, data: ExecuteActionJobData): Promise<SynchronousJobResult> {
        const timeoutInSeconds = ADHOC_ACTION_TIMEOUT_SECONDS

        await provisioner(ctx.log, ctx.apiClient).provision({
            pieces: data.piece ? [data.piece] : [],
            codeSteps: toCodeArtifacts(data.step),
        })

        const sandbox = ctx.sandboxManager.acquire({ log: ctx.log, apiClient: ctx.apiClient })
        const { data: result, error } = await tryCatch(async () => {
            await sandbox.start({
                flowVersionId: undefined,
                platformId: data.platformId,
                mounts: [],
            })

            return sandbox.execute(
                EngineOperationType.EXECUTE_ACTION,
                {
                    step: data.step,
                    projectId: data.projectId,
                    platformId: data.platformId,
                    engineToken: ctx.engineToken,
                    internalApiUrl: ctx.internalApiUrl,
                    publicApiUrl: ctx.publicApiUrl,
                    timeoutInSeconds,
                },
                { timeoutInSeconds },
            )
        })
        await ctx.sandboxManager.release(ctx.log)

        if (error) {
            await ctx.sandboxManager.invalidate(ctx.log)
            if (isSandboxTimeout(error)) {
                return { kind: JobResultKind.SYNCHRONOUS, status: EngineResponseStatus.TIMEOUT, response: {} }
            }
            throw error
        }

        return {
            kind: JobResultKind.SYNCHRONOUS,
            status: result.status,
            response: result.response,
            errorMessage: result.error,
            logs: result.logs,
        }
    },
}

function toCodeArtifacts(step: ExecuteActionJobData['step']): CodeArtifact[] {
    if (step.type !== FlowActionType.CODE) {
        return []
    }
    return [{
        name: step.name,
        sourceCode: step.settings.sourceCode,
        flowVersionId: DEFAULT_MCP_DATA.flowVersionId,
        flowVersionState: DEFAULT_MCP_DATA.flowVersionState,
    }]
}
