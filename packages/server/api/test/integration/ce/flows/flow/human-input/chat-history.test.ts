import {
    buildChatHistoryStoreKey,
    CHAT_HISTORY_MAX_MESSAGES,
    ChatFlowHistoryMessage,
    ChatFlowHistoryRole,
    Flow,
    FlowStatus,
    FlowTriggerType,
    FlowVersionState,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { chatHistoryService } from '../../../../../../src/app/flows/flow/human-input/chat-history.service'
import { storeEntryService } from '../../../../../../src/app/store-entry/store-entry.service'
import { db } from '../../../../../helpers/db'
import {
    createMockFlow,
    createMockFlowVersion,
} from '../../../../../helpers/mocks'
import { createTestContext } from '../../../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../../helpers/test-setup'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const CHAT_TRIGGER = {
    type: FlowTriggerType.PIECE,
    settings: {
        pieceName: '@activepieces/piece-forms',
        pieceVersion: '0.4.16',
        triggerName: 'chat_submission',
        input: { botName: 'AI Bot' },
        propertySettings: {},
    },
    valid: true,
    name: 'trigger',
    displayName: 'Chat UI',
}

async function createChatFlow(projectId: string, trigger: Record<string, unknown> = CHAT_TRIGGER): Promise<{ flow: Flow, flowVersionId: string }> {
    const mockFlow = createMockFlow({
        projectId,
        status: FlowStatus.ENABLED,
    })
    await db.save('flow', mockFlow)
    const mockFlowVersion = createMockFlowVersion({
        flowId: mockFlow.id,
        state: FlowVersionState.LOCKED,
        trigger,
    })
    await db.save('flow_version', mockFlowVersion)
    await db.update('flow', mockFlow.id, { publishedVersionId: mockFlowVersion.id })
    return { flow: mockFlow as Flow, flowVersionId: mockFlowVersion.id }
}

function chatPayload(chatId: string, message: string): Record<string, unknown> {
    return {
        method: 'POST',
        headers: {},
        queryParams: {},
        body: { chatId, message },
    }
}

const okMarkdownResponse = (value: string) => ({
    status: StatusCodes.OK,
    body: { type: 'markdown', value },
    headers: {},
})

describe('chatHistoryService.recordExchange', () => {
    it('records the user and bot messages under the flow-scoped store key', async () => {
        const ctx = await createTestContext(app!)
        const { flow, flowVersionId } = await createChatFlow(ctx.project.id)
        const chatId = 'session-one'

        await chatHistoryService(mockLog).recordExchange({
            flow,
            flowVersionId,
            payload: chatPayload(chatId, 'hello'),
            response: okMarkdownResponse('hi, how can I help?'),
        })

        const entry = await storeEntryService.getOne({
            projectId: ctx.project.id,
            key: buildChatHistoryStoreKey(flow.id, chatId),
        })
        expect(entry).not.toBeNull()
        const history = entry?.value as ChatFlowHistoryMessage[]
        expect(history).toHaveLength(2)
        expect(history[0]).toEqual(expect.objectContaining({
            role: ChatFlowHistoryRole.USER,
            content: 'hello',
        }))
        expect(history[1]).toEqual(expect.objectContaining({
            role: ChatFlowHistoryRole.BOT,
            content: 'hi, how can I help?',
        }))
    })

    it('appends later exchanges to the same session and trims to the cap', async () => {
        const ctx = await createTestContext(app!)
        const { flow, flowVersionId } = await createChatFlow(ctx.project.id)
        const chatId = 'session-two'
        const key = buildChatHistoryStoreKey(flow.id, chatId)

        const preSeeded: ChatFlowHistoryMessage[] = Array.from({ length: CHAT_HISTORY_MAX_MESSAGES }, (_, i) => ({
            role: i % 2 === 0 ? ChatFlowHistoryRole.USER : ChatFlowHistoryRole.BOT,
            content: `message ${i}`,
            timestamp: new Date().toISOString(),
        }))
        await storeEntryService.upsert({
            projectId: ctx.project.id,
            request: { key, value: preSeeded },
        })

        await chatHistoryService(mockLog).recordExchange({
            flow,
            flowVersionId,
            payload: chatPayload(chatId, 'newest question'),
            response: okMarkdownResponse('newest answer'),
        })

        const entry = await storeEntryService.getOne({ projectId: ctx.project.id, key })
        const history = entry?.value as ChatFlowHistoryMessage[]
        expect(history).toHaveLength(CHAT_HISTORY_MAX_MESSAGES)
        expect(history[history.length - 2].content).toBe('newest question')
        expect(history[history.length - 1].content).toBe('newest answer')
        expect(history[0].content).toBe('message 2')
    })

    it('does not record for flows whose trigger is not the chat trigger', async () => {
        const ctx = await createTestContext(app!)
        const { flow, flowVersionId } = await createChatFlow(ctx.project.id, {
            ...CHAT_TRIGGER,
            settings: {
                ...CHAT_TRIGGER.settings,
                triggerName: 'form_submission',
            },
        })
        const chatId = 'session-three'

        await chatHistoryService(mockLog).recordExchange({
            flow,
            flowVersionId,
            payload: chatPayload(chatId, 'hello'),
            response: okMarkdownResponse('hi'),
        })

        const entry = await storeEntryService.getOne({
            projectId: ctx.project.id,
            key: buildChatHistoryStoreKey(flow.id, chatId),
        })
        expect(entry).toBeNull()
    })

    it('does not record failed responses or non-chat payloads', async () => {
        const ctx = await createTestContext(app!)
        const { flow, flowVersionId } = await createChatFlow(ctx.project.id)

        await chatHistoryService(mockLog).recordExchange({
            flow,
            flowVersionId,
            payload: chatPayload('session-four', 'hello'),
            response: { status: StatusCodes.NO_CONTENT, body: {}, headers: {} },
        })
        await chatHistoryService(mockLog).recordExchange({
            flow,
            flowVersionId,
            payload: { body: { somethingElse: true } },
            response: okMarkdownResponse('hi'),
        })

        const entry = await storeEntryService.getOne({
            projectId: ctx.project.id,
            key: buildChatHistoryStoreKey(flow.id, 'session-four'),
        })
        expect(entry).toBeNull()
    })
})
