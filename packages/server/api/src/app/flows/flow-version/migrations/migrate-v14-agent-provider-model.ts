import {
    AgentPieceProps,
    FlowActionType,
    flowStructureUtil,
    FlowVersion,
} from '@activepieces/shared'
import { Migration } from '.'

export const migrateV14AgentProviderModel: Migration = {
    targetSchemaVersion: '14',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type === FlowActionType.PIECE && step.settings.pieceName === '@activepieces/piece-ai') {
                const actionName = step.settings.actionName
                const input = step.settings?.input as Record<string, unknown>

                if (actionName === 'run_agent') {
                    // Already using the modern aiProviderModel shape - nothing to
                    // migrate, and re-running this legacy conversion would clobber
                    // it with undefined provider/model since the old flat fields
                    // never existed on a step authored directly in the new shape.
                    const existing = input[AgentPieceProps.AI_PROVIDER_MODEL] as Record<string, unknown> | undefined
                    if (existing?.['provider']) {
                        return step
                    }

                    const provider = input['provider'] as string
                    const model = input['model'] as string

                    return {
                        ...step,
                        settings: {
                            ...step.settings,
                            input: {
                                ...input,
                                [AgentPieceProps.AI_PROVIDER_MODEL]: { provider, model },
                            },
                        },
                    }
                }
                return step
            }
            return step
        })

        return {
            ...newVersion,
            schemaVersion: '15',
        }
    },
}