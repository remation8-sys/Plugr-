import {
    buildChatHistoryStoreKey,
    CHAT_HISTORY_MAX_MESSAGE_LENGTH,
    CHAT_HISTORY_MAX_MESSAGES,
    CHAT_HISTORY_MAX_SESSION_ID_LENGTH,
    ChatFlowHistoryMessage,
    ChatFlowHistoryRole,
    EngineHttpResponse,
    Flow,
    FlowVersionId,
    HumanInputFormResultTypes,
    isNil,
    PieceTrigger,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { storeEntryService } from '../../../store-entry/store-entry.service'
import { flowVersionRepo } from '../../flow-version/flow-version.service'

const CHAT_PIECE_NAME = '@activepieces/piece-forms'
const CHAT_TRIGGER_NAME = 'chat_submission'

export const chatHistoryService = (log: FastifyBaseLogger) => ({
    /**
     * Persists one user/bot exchange of a chat flow into the flow-scoped
     * key-value store, under the same key the chat trigger reads its
     * `history` output from. Intentionally best-effort: it runs
     * fire-and-forget after the sync webhook response and must never
     * affect the response itself.
     */
    async recordExchange({ flow, flowVersionId, payload, response }: RecordExchangeParams): Promise<void> {
        try {
            const body = extractRequestBody(payload)
            const chatId = body?.chatId
            const userMessage = body?.message
            const isChatShapedRequest = typeof chatId === 'string'
                && typeof userMessage === 'string'
                && chatId.length > 0
                && chatId.length <= CHAT_HISTORY_MAX_SESSION_ID_LENGTH
                && userMessage.length > 0
            if (!isChatShapedRequest || response.status !== StatusCodes.OK) {
                return
            }
            const botMessage = extractBotMessage(response.body)
            if (isNil(botMessage)) {
                return
            }
            const isChatFlow = await flowVersionHasChatTrigger(flowVersionId)
            if (!isChatFlow) {
                return
            }
            const key = buildChatHistoryStoreKey(flow.id, chatId)
            const existing = await storeEntryService.getOne({ projectId: flow.projectId, key })
            const existingValue = existing?.value
            const history: ChatFlowHistoryMessage[] = Array.isArray(existingValue) ? existingValue as ChatFlowHistoryMessage[] : []
            const now = new Date().toISOString()
            history.push({
                role: ChatFlowHistoryRole.USER,
                content: truncateMessage(userMessage),
                timestamp: now,
            }, {
                role: ChatFlowHistoryRole.BOT,
                content: truncateMessage(botMessage),
                timestamp: now,
            })
            await storeEntryService.upsert({
                projectId: flow.projectId,
                request: {
                    key,
                    value: history.slice(-CHAT_HISTORY_MAX_MESSAGES),
                },
            })
        }
        catch (error) {
            log.warn({ error, flowId: flow.id }, '[chatHistoryService] failed to record chat exchange')
        }
    },
})

function extractRequestBody(payload: unknown): Record<string, unknown> | null {
    if (isNil(payload) || typeof payload !== 'object') {
        return null
    }
    const body = (payload as Record<string, unknown>).body
    if (isNil(body) || typeof body !== 'object') {
        return null
    }
    return body as Record<string, unknown>
}

function extractBotMessage(responseBody: unknown): string | null {
    if (isNil(responseBody) || typeof responseBody !== 'object') {
        return null
    }
    const result = responseBody as { type?: unknown, value?: unknown }
    switch (result.type) {
        case HumanInputFormResultTypes.MARKDOWN:
            return typeof result.value === 'string' ? result.value : null
        case HumanInputFormResultTypes.FILE:
            return '[file attachment]'
        default:
            return null
    }
}

async function flowVersionHasChatTrigger(flowVersionId: FlowVersionId): Promise<boolean> {
    const flowVersion = await flowVersionRepo().findOne({
        where: { id: flowVersionId },
        select: ['id', 'trigger'],
    })
    if (isNil(flowVersion)) {
        return false
    }
    const settings = (flowVersion.trigger as PieceTrigger | undefined)?.settings
    return settings?.pieceName === CHAT_PIECE_NAME && settings?.triggerName === CHAT_TRIGGER_NAME
}

function truncateMessage(message: string): string {
    return message.length > CHAT_HISTORY_MAX_MESSAGE_LENGTH
        ? `${message.slice(0, CHAT_HISTORY_MAX_MESSAGE_LENGTH)}…`
        : message
}

type RecordExchangeParams = {
    flow: Flow
    flowVersionId: FlowVersionId
    payload: unknown
    response: EngineHttpResponse
}
