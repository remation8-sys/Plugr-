import {
    apId,
    FlowAction,
    FlowActionType,
    FlowStatus,
    FlowTrigger,
    FlowTriggerType,
    FlowVersionState,
    isNil,
    SampleDataFileType,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { fileRepo } from '../../../../../src/app/file/file.service'
import { sampleDataService } from '../../../../../src/app/flows/step-run/sample-data.service'
import { db } from '../../../../helpers/db'
import { describeWithAuth } from '../../../../helpers/describe-with-auth'
import { createMockFlow, createMockFlowVersion } from '../../../../helpers/mocks'
import { createTestContext } from '../../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Flow sample data API', () => {
    describeWithAuth('GET /v1/sample-data/flow', () => app!, (setup) => {
        it('returns input and output sample data for every step', async () => {
            const ctx = await setup()
            await db.update('user', ctx.user.id, {
                subscriptionTier: 'starter',
                subscriptionStatus: 'active',
            })
            const actionWithoutSampleData = createCodeAction({
                name: 'step_2',
                displayName: 'Archive record',
            })
            const action = createCodeAction({
                name: 'step_1',
                displayName: 'Process record',
                nextAction: actionWithoutSampleData,
            })
            const trigger = createEmptyTrigger({ nextAction: action })
            const flow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.DISABLED,
            })
            const flowVersion = createMockFlowVersion({
                flowId: flow.id,
                state: FlowVersionState.DRAFT,
                trigger,
                updatedBy: ctx.user.id,
            })
            await db.save('flow', flow)
            await db.save('flow_version', flowVersion)

            const triggerPayload = { event: 'new-record', recordId: 'record-1' }
            const actionPayload = { processed: true, count: 3 }
            const triggerInputPayload = { source: 'webhook' }
            const actionInputPayload = { recordId: 'record-1' }
            const triggerSampleData = await sampleDataService(app!.log).saveSampleDataFileIdsInStep({
                projectId: ctx.project.id,
                flowVersionId: flowVersion.id,
                stepName: trigger.name,
                payload: triggerPayload,
                type: SampleDataFileType.OUTPUT,
            })
            const actionSampleData = await sampleDataService(app!.log).saveSampleDataFileIdsInStep({
                projectId: ctx.project.id,
                flowVersionId: flowVersion.id,
                stepName: action.name,
                payload: actionPayload,
                type: SampleDataFileType.OUTPUT,
            })
            const triggerWithOutputSampleData: FlowTrigger = {
                ...trigger,
                settings: {
                    ...trigger.settings,
                    sampleData: triggerSampleData,
                },
                nextAction: {
                    ...action,
                    settings: {
                        ...action.settings,
                        sampleData: actionSampleData,
                    },
                },
            }
            await db.update('flow_version', flowVersion.id, {
                trigger: triggerWithOutputSampleData,
            })

            const triggerInputSampleData = await sampleDataService(app!.log).saveSampleDataFileIdsInStep({
                projectId: ctx.project.id,
                flowVersionId: flowVersion.id,
                stepName: trigger.name,
                payload: triggerInputPayload,
                type: SampleDataFileType.INPUT,
            })
            const actionInputSampleData = await sampleDataService(app!.log).saveSampleDataFileIdsInStep({
                projectId: ctx.project.id,
                flowVersionId: flowVersion.id,
                stepName: action.name,
                payload: actionInputPayload,
                type: SampleDataFileType.INPUT,
            })
            const triggerWithAllSampleData: FlowTrigger = {
                ...triggerWithOutputSampleData,
                settings: {
                    ...triggerWithOutputSampleData.settings,
                    sampleData: triggerInputSampleData,
                },
                nextAction: {
                    ...action,
                    settings: {
                        ...action.settings,
                        sampleData: actionInputSampleData,
                    },
                },
            }
            await db.update('flow_version', flowVersion.id, {
                trigger: triggerWithAllSampleData,
            })

            const findSampleDataFiles = vi.spyOn(fileRepo(), 'find')
            const response = await ctx.get('/v1/sample-data/flow', {
                flowId: flow.id,
                flowVersionId: flowVersion.id,
                projectId: ctx.project.id,
            })

            expect(response.statusCode, response.body).toBe(StatusCodes.OK)
            expect(response.json()).toEqual({
                input: {
                    trigger: triggerInputPayload,
                    step_1: actionInputPayload,
                    step_2: {},
                },
                output: {
                    trigger: triggerPayload,
                    step_1: actionPayload,
                    step_2: {},
                },
            })
            expect(findSampleDataFiles).toHaveBeenCalledTimes(1)

            const actionInputFileId = actionInputSampleData.sampleDataInputFileId
            if (isNil(actionInputFileId)) {
                throw new Error('Expected action input sample data file')
            }
            await db.update('file', actionInputFileId, {
                data: Buffer.from('invalid-json'),
            })
            const responseWithCorruptSample = await ctx.get('/v1/sample-data/flow', {
                flowId: flow.id,
                flowVersionId: flowVersion.id,
                projectId: ctx.project.id,
            })

            expect(responseWithCorruptSample.statusCode, responseWithCorruptSample.body).toBe(StatusCodes.OK)
            expect(responseWithCorruptSample.json()).toEqual({
                input: {
                    trigger: triggerInputPayload,
                    step_2: {},
                },
                output: {
                    trigger: triggerPayload,
                    step_1: actionPayload,
                    step_2: {},
                },
            })
            expect(findSampleDataFiles).toHaveBeenCalledTimes(2)
            findSampleDataFiles.mockRestore()
        })
    })

    it('rejects a project id outside the caller scope', async () => {
        const ownerContext = await createTestContext(app!)
        const otherContext = await createTestContext(app!)
        const flow = createMockFlow({ projectId: ownerContext.project.id })
        const flowVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.DRAFT,
            updatedBy: ownerContext.user.id,
        })
        await db.save('flow', flow)
        await db.save('flow_version', flowVersion)

        const response = await otherContext.get('/v1/sample-data/flow', {
            flowId: flow.id,
            flowVersionId: flowVersion.id,
            projectId: ownerContext.project.id,
        })

        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
    })

    it('chunks sample file reads for large flows', async () => {
        let nextAction: FlowAction | undefined
        for (let index = 249; index >= 0; index--) {
            const action = createCodeAction({
                name: `step_${index}`,
                displayName: `Step ${index}`,
                nextAction,
            })
            action.settings.sampleData = {
                sampleDataFileId: apId(),
                sampleDataInputFileId: apId(),
            }
            nextAction = action
        }
        if (isNil(nextAction)) {
            throw new Error('Expected a generated action chain')
        }
        const trigger = createEmptyTrigger({ nextAction })
        trigger.settings.sampleData = {
            sampleDataFileId: apId(),
            sampleDataInputFileId: apId(),
        }
        const flowVersion = createMockFlowVersion({ trigger })
        const findSampleDataFiles = vi.spyOn(fileRepo(), 'find').mockResolvedValue([])

        try {
            await sampleDataService(app!.log).getAllSampleDataForFlow({
                projectId: apId(),
                flowVersion,
            })

            expect(findSampleDataFiles).toHaveBeenCalledTimes(2)
        }
        finally {
            findSampleDataFiles.mockRestore()
        }
    })
})

function createCodeAction({ name, displayName, nextAction }: CreateCodeActionParams): FlowAction {
    return {
        type: FlowActionType.CODE,
        name,
        displayName,
        valid: true,
        lastUpdatedDate: new Date().toISOString(),
        settings: {
            sourceCode: {
                code: 'export const code = async () => ({ processed: true })',
                packageJson: '{}',
            },
            input: {},
            errorHandlingOptions: {},
        },
        nextAction,
    }
}

function createEmptyTrigger({ nextAction }: { nextAction: FlowAction }): FlowTrigger {
    return {
        type: FlowTriggerType.EMPTY,
        name: 'trigger',
        displayName: 'Trigger',
        valid: true,
        lastUpdatedDate: new Date().toISOString(),
        settings: {},
        nextAction,
    }
}

type CreateCodeActionParams = {
    name: string
    displayName: string
    nextAction?: FlowAction
}
