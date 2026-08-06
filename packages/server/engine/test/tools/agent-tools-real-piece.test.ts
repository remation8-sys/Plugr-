/* eslint-disable @typescript-eslint/no-explicit-any */
// Integration check: exercises the direct-schema fast path against a REAL,
// unmocked piece (delay/delayFor) loaded from disk via the real pieceLoader -
// not a hand-rolled fixture. Complements agent-tools.test.ts, which uses
// synthetic Action fixtures to isolate the schema-building logic itself.
import { AgentPieceTool, AgentToolType } from '@activepieces/shared'
import { agentTools } from '../../src/lib/tools'
import { generateMockEngineConstants } from '../handler/test-helper'

describe('agentTools.tools - direct-schema fast path against a real piece', () => {
    it('builds a real schema for @activepieces/piece-delay delayFor (depth-0, static dropdown + number, no auth)', async () => {
        const tool: AgentPieceTool = {
            type: AgentToolType.PIECE,
            toolName: 'delay',
            pieceMetadata: {
                pieceName: '@activepieces/piece-delay',
                pieceVersion: '0.0.1',
                actionName: 'delayFor',
            },
        }

        const tools = await agentTools.tools({
            engineConstants: generateMockEngineConstants(),
            tools: [tool],
            model: {} as any,
        })

        const resolved = tools.delay as any
        expect(resolved).toBeDefined()

        // Real fields, not the legacy `instruction` field - and the markdown
        // prop must be excluded (display-only, not fillable).
        const valid = await resolved.inputSchema.safeParseAsync({ unit: 'seconds', delayFor: 5 })
        expect(valid.success).toBe(true)
        expect(resolved.inputSchema.shape.markdown).toBeUndefined()
        expect(resolved.inputSchema.shape.instruction).toBeUndefined()

        // Real dropdown options, fetched via the real piece's static options,
        // end up in the field's description for the top-level agent to see.
        expect(resolved.inputSchema.shape.unit.description).toContain('seconds')
        expect(resolved.inputSchema.shape.unit.description).toContain('minutes')
        expect(resolved.inputSchema.shape.unit.description).toContain('hours')
        expect(resolved.inputSchema.shape.unit.description).toContain('days')
    })
})
