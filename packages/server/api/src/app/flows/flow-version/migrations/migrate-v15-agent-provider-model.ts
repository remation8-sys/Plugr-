import {
    AgentPieceProps,
    FlowActionType,
    flowStructureUtil,
    FlowVersion,
} from '@activepieces/shared'
import { Migration } from '.'

export const migrateV15AgentProviderModel: Migration = {
    targetSchemaVersion: '15',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type !== FlowActionType.PIECE || step.settings.pieceName !== '@activepieces/piece-ai') {
                return step
            }

            if (step.settings.actionName === 'run_agent') {
                const input = step.settings.input as Record<string, unknown>

                // Already using the modern aiProviderModel shape (e.g. a flow authored
                // directly against the current schema) - nothing to migrate, and
                // re-running this legacy conversion would clobber it with undefined
                // provider/model since the old flat fields never existed on it.
                const existing = input[AgentPieceProps.AI_PROVIDER_MODEL] as Record<string, unknown> | undefined
                if (existing?.['provider']) {
                    return step
                }

                const provider = input['provider'] as string
                const model = input['model'] as string

                step.settings.pieceVersion = '0.1.0'
                step.settings.input = {
                    ...input,
                    [AgentPieceProps.AI_PROVIDER_MODEL]: { provider, model },
                }
                return step
            }

            step.settings.pieceVersion = '0.1.0'
            return step
        })

        return {
            ...newVersion,
            schemaVersion: '16',
        }
    },
}