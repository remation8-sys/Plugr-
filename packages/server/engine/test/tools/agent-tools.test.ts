/* eslint-disable @typescript-eslint/no-explicit-any */
import { PropertyType } from '@activepieces/pieces-framework'
import { AgentPieceTool, AgentToolType, FieldControlMode } from '@activepieces/shared'
import { vi } from 'vitest'
import { pieceHelper } from '../../src/lib/helper/piece-helper'
import { pieceLoader } from '../../src/lib/helper/piece-loader'
import { agentTools } from '../../src/lib/tools'
import { generateMockEngineConstants } from '../handler/test-helper'

vi.mock('../../src/lib/helper/piece-loader', () => ({
    pieceLoader: {
        getPieceAndActionOrThrow: vi.fn(),
    },
}))

vi.mock('../../src/lib/helper/piece-helper', () => ({
    pieceHelper: {
        executeProps: vi.fn(),
    },
}))

const buildTool = (overrides?: Partial<AgentPieceTool['pieceMetadata']>): AgentPieceTool => ({
    type: AgentToolType.PIECE,
    toolName: 'agentTool',
    pieceMetadata: {
        pieceName: '@activepieces/piece-test',
        pieceVersion: '1.0.0',
        actionName: 'send_message',
        ...overrides,
    },
})

const mockPieceAction = (pieceAction: unknown): void => {
    vi.mocked(pieceLoader.getPieceAndActionOrThrow).mockResolvedValue({
        piece: {} as any,
        pieceAction: pieceAction as any,
    })
}

describe('agentTools.tools - direct-schema fast path', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('exposes real fields directly for a depth-0 action, not an instruction field', async () => {
        mockPieceAction({
            name: 'send_message',
            displayName: 'Send Message',
            description: 'Sends a message',
            requireAuth: true,
            props: {
                channel: {
                    displayName: 'Channel',
                    description: 'Which channel to post in',
                    type: PropertyType.STATIC_DROPDOWN,
                    required: true,
                    options: {
                        options: [
                            { label: 'General', value: 'general' },
                            { label: 'Random', value: 'random' },
                        ],
                    },
                },
                text: {
                    displayName: 'Text',
                    type: PropertyType.SHORT_TEXT,
                    required: true,
                },
            },
        })

        const tools = await agentTools.tools({
            engineConstants: generateMockEngineConstants(),
            tools: [buildTool()],
            model: {} as any,
        })

        const tool = tools.agentTool as any
        expect(tool).toBeDefined()

        const withRealFields = await tool.inputSchema.safeParseAsync({ channel: 'general', text: 'hi' })
        expect(withRealFields.success).toBe(true)

        const withInstruction = await tool.inputSchema.safeParseAsync({ instruction: 'send hi to general' })
        expect(withInstruction.success).toBe(false)

        // real dropdown options are inlined into the field's description, not a separate prompt
        expect(tool.inputSchema.shape.channel.description).toContain('general')
        expect(tool.inputSchema.shape.channel.description).toContain('random')
    })

    it('falls back to the instruction-based schema for an action with a genuine cross-property dependency', async () => {
        mockPieceAction({
            name: 'create_record',
            displayName: 'Create Record',
            description: 'Creates a record',
            requireAuth: true,
            props: {
                base: {
                    displayName: 'Base',
                    type: PropertyType.STATIC_DROPDOWN,
                    required: true,
                    options: { options: [{ label: 'Base A', value: 'baseA' }] },
                },
                table: {
                    displayName: 'Table',
                    type: PropertyType.DROPDOWN,
                    required: true,
                    refreshers: ['base'],
                    options: async () => ({ options: [] }),
                },
            },
        })

        const tools = await agentTools.tools({
            engineConstants: generateMockEngineConstants(),
            tools: [buildTool({ actionName: 'create_record' })],
            model: {} as any,
        })

        const tool = tools.agentTool as any
        const withInstruction = await tool.inputSchema.safeParseAsync({ instruction: 'create a record in base A' })
        expect(withInstruction.success).toBe(true)
        // pieceHelper.executeProps should never be reached - the depth check short-circuits before any option-fetching
        expect(pieceHelper.executeProps).not.toHaveBeenCalled()
    })

    it('excludes a CHOOSE_YOURSELF predefined field from the exposed schema', async () => {
        mockPieceAction({
            name: 'send_message',
            displayName: 'Send Message',
            description: 'Sends a message',
            requireAuth: true,
            props: {
                channel: {
                    displayName: 'Channel',
                    type: PropertyType.STATIC_DROPDOWN,
                    required: true,
                    options: { options: [{ label: 'General', value: 'general' }] },
                },
                text: {
                    displayName: 'Text',
                    type: PropertyType.SHORT_TEXT,
                    required: true,
                },
            },
        })

        const tools = await agentTools.tools({
            engineConstants: generateMockEngineConstants(),
            tools: [buildTool({
                predefinedInput: {
                    fields: {
                        channel: { mode: FieldControlMode.CHOOSE_YOURSELF, value: 'general' },
                    },
                },
            })],
            model: {} as any,
        })

        const tool = tools.agentTool as any
        // schema is .strict() and channel was never added to it, so supplying it must fail
        const withChannel = await tool.inputSchema.safeParseAsync({ channel: 'general', text: 'hi' })
        expect(withChannel.success).toBe(false)

        const withoutChannel = await tool.inputSchema.safeParseAsync({ text: 'hi' })
        expect(withoutChannel.success).toBe(true)
    })

    it('bounds recursion when a dynamic property nests another dynamic property too deeply, then falls back', async () => {
        mockPieceAction({
            name: 'send_message',
            displayName: 'Send Message',
            description: 'Sends a message',
            requireAuth: true,
            props: {
                root: {
                    displayName: 'Root',
                    type: PropertyType.DYNAMIC,
                    required: true,
                },
            },
        })
        // Every call returns another DYNAMIC property, however deep we go -
        // this must terminate via the depth limit, not recurse forever.
        vi.mocked(pieceHelper.executeProps).mockResolvedValue({
            options: {
                nested: {
                    displayName: 'Nested',
                    type: PropertyType.DYNAMIC,
                    required: true,
                },
            },
        } as any)

        const tools = await agentTools.tools({
            engineConstants: generateMockEngineConstants(),
            tools: [buildTool()],
            model: {} as any,
        })

        const tool = tools.agentTool as any
        expect(tool).toBeDefined()
        // fast path failed (depth exceeded) -> fell back to the instruction schema
        const withInstruction = await tool.inputSchema.safeParseAsync({ instruction: 'do it' })
        expect(withInstruction.success).toBe(true)
        // must terminate, not recurse without bound
        expect(vi.mocked(pieceHelper.executeProps).mock.calls.length).toBeLessThanOrEqual(3)
    })

    it('falls back to the legacy instruction-based tool when the fast path fails to build a schema', async () => {
        mockPieceAction({
            name: 'send_message',
            displayName: 'Send Message',
            description: 'Sends a message',
            requireAuth: true,
            props: {
                channel: {
                    displayName: 'Channel',
                    type: PropertyType.DROPDOWN,
                    required: true,
                    refreshers: [],
                    options: async () => ({ options: [] }),
                },
            },
        })
        vi.mocked(pieceHelper.executeProps).mockRejectedValue(new Error('boom: auth expired'))

        const tools = await agentTools.tools({
            engineConstants: generateMockEngineConstants(),
            tools: [buildTool()],
            model: {} as any,
        })

        const tool = tools.agentTool as any
        expect(tool).toBeDefined()
        const withInstruction = await tool.inputSchema.safeParseAsync({ instruction: 'send it' })
        expect(withInstruction.success).toBe(true)
    })
})
