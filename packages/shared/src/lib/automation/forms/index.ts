import { z } from 'zod'

const FileResponseInterfaceV1 = z.object({
    base64Url: z.string(),
    fileName: z.string(),
    extension: z.string().optional(),
})

const FileResponseInterfaceV2 = z.object({
    mimeType: z.string(),
    url: z.string(),
    fileName: z.string().optional(),
})

export const FileResponseInterface = z.union([FileResponseInterfaceV1, FileResponseInterfaceV2])

export type FileResponseInterface = z.infer<typeof FileResponseInterface>



export enum HumanInputFormResultTypes {
    FILE = 'file',
    MARKDOWN = 'markdown',
}

export function createKeyForFormInput(displayName: string) {
    const inputKey = displayName
        .toLowerCase()
        .replace(/\s+(\w)/g, (_, letter) => letter.toUpperCase())
        .replace(/^(.)/, letter => letter.toLowerCase())

    /**We do this because react form inputs must not contain quotes */
    return inputKey.replaceAll(/[\\"''\n\r\t]/g, '')
}


export const HumanInputFormResult = z.union([
    z.object({
        type: z.literal(HumanInputFormResultTypes.FILE),
        value: FileResponseInterface,
    }),
    z.object({
        type: z.literal(HumanInputFormResultTypes.MARKDOWN),
        value: z.string(),
        files: z.array(FileResponseInterface).optional(),
    }),
])

export type HumanInputFormResult = z.infer<typeof HumanInputFormResult>


export enum ChatFlowHistoryRole {
    USER = 'user',
    BOT = 'bot',
}

export const ChatFlowHistoryMessage = z.object({
    role: z.nativeEnum(ChatFlowHistoryRole),
    content: z.string(),
    timestamp: z.string(),
})

export type ChatFlowHistoryMessage = z.infer<typeof ChatFlowHistoryMessage>

/**
 * Conversation memory for chat flows lives in the key-value store, scoped to
 * the flow. The engine prefixes FLOW-scoped piece keys with `flow_{flowId}/`,
 * so the server-side writer must build the same key to stay readable from the
 * chat trigger. Keys are capped at 128 chars, hence the session id guard.
 */
export const CHAT_HISTORY_STORE_PREFIX = 'chat_history_'
export const CHAT_HISTORY_MAX_MESSAGES = 40
export const CHAT_HISTORY_MAX_MESSAGE_LENGTH = 4000
export const CHAT_HISTORY_MAX_SESSION_ID_LENGTH = 64

export function buildChatHistoryStoreKey(flowId: string, chatId: string): string {
    return `flow_${flowId}/${CHAT_HISTORY_STORE_PREFIX}${chatId}`
}

export const ChatFormResponse = z.object({
    sessionId: z.string(),
    message: z.string(),
    files: z.array(z.string()).optional(),
    history: z.array(ChatFlowHistoryMessage).optional(),
})

export type ChatFormResponse = z.infer<typeof ChatFormResponse>
