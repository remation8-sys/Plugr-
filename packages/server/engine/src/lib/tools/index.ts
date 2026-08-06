import { Action, DropdownOption, ExecutePropsResult, PieceProperty, PropertyType } from '@activepieces/pieces-framework'
import { AgentPieceTool, BaseEngineOperation, ExecuteToolOperation, ExecuteToolResponse, ExecutionToolStatus, FieldControlMode, FlowActionType, isNil, PieceAction, PropertyExecutionType, StepOutputStatus } from '@activepieces/shared'
import { generateText, JSONParseError, LanguageModel, NoObjectGeneratedError, Output, Tool, zodSchema } from 'ai'
import dayjs from 'dayjs'
import { z } from 'zod'
import { EngineConstants } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { flowExecutor } from '../handler/flow-executor'
import { pieceHelper } from '../helper/piece-helper'
import { pieceLoader } from '../helper/piece-loader'
import { tsort } from './tsort'

// The AI SDK's `Tool` type has no `name` field - the name is only the key in
// the Record<string, Tool> the caller passes to streamText. We need the name
// alongside the tool definition while building the map below.
type NamedTool = Tool & { name: string }

export const agentTools = {
    async tools({ engineConstants, tools, model }: ConstructToolParams): Promise<Record<string, Tool>> {
        const piecesTools = await Promise.all(tools.map(async (tool): Promise<NamedTool> => {
            const { pieceAction } = await pieceLoader.getPieceAndActionOrThrow({
                pieceName: tool.pieceMetadata.pieceName,
                pieceVersion: tool.pieceMetadata.pieceVersion,
                actionName: tool.pieceMetadata.actionName,
                devPieces: EngineConstants.DEV_PIECES,
            })

            const directTool = await tryBuildDirectTool(tool, pieceAction, engineConstants).catch((error) => {
                console.warn(`[agentTools] Direct-schema fast path failed for tool "${tool.toolName}" (${tool.pieceMetadata.pieceName}/${tool.pieceMetadata.actionName}); falling back to instruction-based resolution.`, error)
                return null
            })
            if (!isNil(directTool)) {
                return directTool
            }

            return {
                name: tool.toolName,
                description: pieceAction.description,
                inputSchema: z.object({
                    instruction: z.string().describe('The instruction to the tool'),
                }),
                execute: async ({ instruction }: { instruction: string }) =>
                    execute({
                        ...engineConstants,
                        instruction,
                        pieceName: tool.pieceMetadata.pieceName,
                        pieceVersion: tool.pieceMetadata.pieceVersion,
                        actionName: tool.pieceMetadata.actionName,
                        predefinedInput: tool.pieceMetadata.predefinedInput,
                        model,
                    }),
            }
        }))

        return {
            ...Object.fromEntries(piecesTools.map((tool) => [tool.name, tool])),
        }
    },
}

// Props whose values are never meant to be filled by the agent (auth handled
// separately via predefinedInput/prefix values; MARKDOWN/CUSTOM are display-only).
const NON_FILLABLE_PROPERTY_TYPES = [
    PropertyType.BASIC_AUTH,
    PropertyType.OAUTH2,
    PropertyType.CUSTOM_AUTH,
    PropertyType.CUSTOM,
    PropertyType.MARKDOWN,
]

const MAX_INLINE_OPTIONS = 100

// Fast path: if an action's properties have no cross-property dependency (all
// depth-0 - see tsort.ts), expose the action's real fields directly as the
// tool's input schema instead of a free-text `instruction`, so the top-level
// agent fills them in in one call instead of needing a second, nested
// generateText() call (resolveProperties/execute below) to translate a
// free-text instruction into structured values. Returns null when the action
// has genuine cross-property dependencies (execute()'s multi-call path
// handles those, unchanged) or when anything about building the schema fails.
async function tryBuildDirectTool(tool: AgentPieceTool, pieceAction: Action, engineConstants: EngineConstants): Promise<NamedTool | null> {
    const depthToPropertyMap = tsort.sortPropertiesByDependencies(pieceAction.props)
    if (Object.keys(depthToPropertyMap).length > 1) {
        return null
    }

    const predefinedInput = tool.pieceMetadata.predefinedInput
    const baseOperation: SchemaBuildOperation = {
        ...engineConstants,
        pieceName: tool.pieceMetadata.pieceName,
        pieceVersion: tool.pieceMetadata.pieceVersion,
        actionName: tool.pieceMetadata.actionName,
        predefinedInput,
    }
    const prefixValues = buildPrefixValues(predefinedInput)
    const properties = depthToPropertyMap[0] ?? []

    const eligible = properties.filter((name) => {
        const property = pieceAction.props[name]
        return !NON_FILLABLE_PROPERTY_TYPES.includes(property.type) && !(name in prefixValues)
    })

    const entries = await Promise.all(eligible.map(async (name) => {
        const property = pieceAction.props[name]
        const [schema, detail] = await Promise.all([
            propertyToSchema(name, property, baseOperation, prefixValues),
            buildPropertyDetail(name, property, baseOperation, prefixValues),
        ])
        return [name, withOptionsDescription(schema, detail)] as const
    }))

    const schemaFields = Object.fromEntries(entries)

    return {
        name: tool.toolName,
        description: pieceAction.description,
        inputSchema: z.object(schemaFields).strict(),
        execute: async (args: Record<string, unknown>) => executeDirect(baseOperation, prefixValues, args),
    }
}

function withOptionsDescription(schema: z.ZodTypeAny, detail: PropertyDetail | null): z.ZodTypeAny {
    if (isNil(detail) || isNil(detail.options) || detail.options.length === 0) {
        return schema
    }
    const shown = detail.options.slice(0, MAX_INLINE_OPTIONS)
    const truncated = detail.options.length > MAX_INLINE_OPTIONS
    const remaining = detail.options.length - MAX_INLINE_OPTIONS
    const optionsText = `Valid options (use the 'value' field): ${JSON.stringify(shown)}${truncated ? ` …and ${remaining} more not shown.` : ''}`
    return schema.describe(optionsText)
}

async function executeDirect(
    baseOperation: BaseEngineOperation & PieceActionIdentifiers,
    prefixValues: Record<string, unknown>,
    args: Record<string, unknown>,
): Promise<ExecuteToolResponse> {
    try {
        // prefixValues last: predefined/auth values are authoritative even
        // though a `.strict()` schema already makes it impossible for the
        // model to have populated those fields itself.
        const resolvedInput = { ...args, ...prefixValues }
        return await runPieceAction(baseOperation, resolvedInput)
    }
    catch (error) {
        return {
            status: ExecutionToolStatus.FAILED,
            output: undefined,
            resolvedInput: {},
            errorMessage: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
        }
    }
}

function buildPrefixValues(predefinedInput: ExecuteToolOperation['predefinedInput']): Record<string, unknown> {
    const auth = predefinedInput?.auth
    const predefinedInputsFields = predefinedInput?.fields || {}

    const result: Record<string, unknown> = {}

    if (auth) {
        result.auth = auth
    }

    for (const [propertyName, field] of Object.entries(predefinedInputsFields)) {
        if (field.mode === FieldControlMode.CHOOSE_YOURSELF) {
            result[propertyName] = field.value
        }
        else if (field.mode === FieldControlMode.LEAVE_EMPTY) {
            result[propertyName] = undefined
        }
        // FieldControlMode.AGENT_DECIDE: intentionally not added here - must remain exposed for filling
    }

    return result
}

async function resolveProperties(
    depthToPropertyMap: Record<number, string[]>,
    instruction: string,
    action: Action,
    model: LanguageModel,
    operation: ExecuteToolOperation,
): Promise<Record<string, unknown>> {
    let result: Record<string, unknown> = buildPrefixValues(operation.predefinedInput)

    for (const [_, properties] of Object.entries(depthToPropertyMap)) {
        const propertyToFill: Record<string, z.ZodTypeAny> = {}
        const propertyDetails: PropertyDetail[] = []

        for (const property of properties) {
            const propertyFromAction = action.props[property]
            const propertyType = propertyFromAction.type
            const skipTypes = [
                PropertyType.BASIC_AUTH,
                PropertyType.OAUTH2,
                PropertyType.CUSTOM_AUTH,
                PropertyType.CUSTOM,
                PropertyType.MARKDOWN,
            ]
            if (skipTypes.includes(propertyType) || property in result) {
                continue
            }

            const propertySchema = await propertyToSchema(
                property,
                propertyFromAction,
                operation,
                result,
            )
            propertyToFill[property] = propertySchema

            const propertyDetail = await buildPropertyDetail(
                property,
                propertyFromAction,
                operation,
                result,
            )
            if (!isNil(propertyDetail)) {
                propertyDetails.push(propertyDetail)
            }
        }

        if (Object.keys(propertyToFill).length === 0) continue

        const schemaObject = zodSchema(z.object(propertyToFill).strict())
        const extractionPrompt = constructExtractionPrompt(
            instruction,
            propertyToFill,
            propertyDetails,
            result,
        )

        const { output } = await generateText({
            model,
            prompt: extractionPrompt,
            output: Output.object({
                schema: schemaObject,

            }),
            
        }).catch(error => {
            if (NoObjectGeneratedError.isInstance(error) && JSONParseError.isInstance(error.cause) && error.text?.startsWith('```json') && error.text?.endsWith('```')) {
                return {
                    output: JSON.parse(error.text.replace('```json', '').replace('```', '')),
                }
            }
            throw error
        })

        result = {
            ...result,
            ...(output as Record<string, unknown>),
        }

    }
    return result
}

type PieceActionIdentifiers = {
    actionName: string
    pieceName: string
    pieceVersion: string
}

async function runPieceAction(
    baseOperation: BaseEngineOperation & PieceActionIdentifiers,
    resolvedInput: Record<string, unknown>,
): Promise<ExecuteToolResponse> {
    const step: PieceAction = {
        name: baseOperation.actionName,
        displayName: baseOperation.actionName,
        type: FlowActionType.PIECE,
        lastUpdatedDate: dayjs().toISOString(),
        settings: {
            input: resolvedInput,
            actionName: baseOperation.actionName,
            pieceName: baseOperation.pieceName,
            pieceVersion: baseOperation.pieceVersion,
            propertySettings: Object.fromEntries(Object.entries(resolvedInput).map(([key]) => [key, {
                type: PropertyExecutionType.MANUAL,
                schema: undefined,
            }])),
        },
        valid: true,
    }
    const output = await flowExecutor.getExecutorForAction(step.type).handle({
        action: step,
        executionState: FlowExecutorContext.empty(),
        constants: EngineConstants.fromExecuteActionInput(baseOperation),
    })
    const { output: stepOutput, errorMessage, status } = output.steps[baseOperation.actionName]

    return {
        status: status === StepOutputStatus.FAILED ? ExecutionToolStatus.FAILED : ExecutionToolStatus.SUCCESS,
        output: stepOutput,
        resolvedInput: {
            ...resolvedInput,
            auth: 'Redacted',
        },
        errorMessage,
    }
}

async function execute(operation: ExecuteToolOperationWithModel): Promise<ExecuteToolResponse> {
    try {
        const { pieceAction } = await pieceLoader.getPieceAndActionOrThrow({
            pieceName: operation.pieceName,
            pieceVersion: operation.pieceVersion,
            actionName: operation.actionName,
            devPieces: EngineConstants.DEV_PIECES,
        })
        const depthToPropertyMap = tsort.sortPropertiesByDependencies(pieceAction.props)
        const resolvedInput = await resolveProperties(depthToPropertyMap, operation.instruction, pieceAction, operation.model, operation)
        return await runPieceAction(operation, resolvedInput)
    }
    catch (error) {
        return {
            status: ExecutionToolStatus.FAILED,
            output: undefined,
            resolvedInput: {},
            errorMessage: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
        }
    }
}

const constructExtractionPrompt = (
    instruction: string,
    propertyToFill: Record<string, z.ZodTypeAny>,
    propertyDetails: PropertyDetail[],
    existingValues: Record<string, unknown>,
): string => {
    const propertyNames = Object.keys(propertyToFill).join('", "')

    const existingValuesContext = Object.keys(existingValues).length > 0
        ? buildExistingValuesSection(existingValues)
        : ''

    const propertyDetailsSection = propertyDetails.length > 0
        ? buildPropertyDetailsSection(propertyDetails)
        : ''

    return `
You are an expert at understanding API schemas and filling out properties based on user instructions.

**TASK**:
- Fill out the properties "${propertyNames}" based on the user's instructions.
- Output must be a valid JSON object matching the schema.

**USER INSTRUCTIONS**:
${instruction}

${existingValuesContext}

${propertyDetailsSection}

**RULES** (MUST FOLLOW):
- For dropdown, multi-select dropdown, and static dropdown properties: Select values ONLY from the provided options array. Use the 'value' field from the option objects.
- For array properties: Select values ONLY from the provided options array if specified.
- For dynamic properties: Select values ONLY from the provided options array if specified.
- Options format: [{ label: string, value: string | object | number | boolean }]
- For DATE_TIME properties: Use ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
- Use actual values from the user instructions to determine property values.
- Use already filled values as context for consistency.
- Required properties: MUST include all, even if missing from instructions. Infer reasonable defaults or look for hints if possible.
- Optional properties: Skip if no information is available—do not invent values.
- Do not add extra properties outside the requested ones.
- Ensure output is parseable JSON without additional text.
`
}

type ExecuteToolOperationWithModel = ExecuteToolOperation & {
    model: LanguageModel
}

// The schema-building helpers below never read `.instruction` - widened so the
// fast path (tryBuildDirectTool) can call them without inventing a fake one.
type SchemaBuildOperation = Omit<ExecuteToolOperation, 'instruction'>

async function propertyToSchema(propertyName: string, property: PieceProperty, operation: SchemaBuildOperation, resolvedInput: Record<string, unknown>): Promise<z.ZodTypeAny> {
    let schema: z.ZodTypeAny

    switch (property.type) {
        case PropertyType.SHORT_TEXT:
        case PropertyType.LONG_TEXT:
        case PropertyType.MARKDOWN:
        case PropertyType.DATE_TIME:
        case PropertyType.FILE:
        case PropertyType.COLOR:
            schema = z.string()
            break
        case PropertyType.DROPDOWN:
        case PropertyType.STATIC_DROPDOWN: {
            schema = z.union([z.string(), z.number(), z.object({}).loose()])
            break
        }
        case PropertyType.MULTI_SELECT_DROPDOWN:
        case PropertyType.STATIC_MULTI_SELECT_DROPDOWN: {
            schema = z.union([z.array(z.string()), z.array(z.object({}).loose())])
            break
        }
        case PropertyType.NUMBER:
            schema = z.number()
            break
        case PropertyType.ARRAY: {
            if (property.properties) {
                schema = z.array(await buildObjectSchemaFromProperties(property.properties, operation, resolvedInput))
            }
            else {
                schema = z.array(z.union([z.string(), z.number(), z.boolean(), z.object({}).loose()]))
            }
            break
        }
        case PropertyType.OBJECT:
            schema = z.object({}).loose()
            break
        case PropertyType.JSON:
            schema = z.union([z.object({}).loose(), z.array(z.unknown())])
            break
        case PropertyType.DYNAMIC: {
            schema = await buildDynamicSchema(propertyName, operation, resolvedInput)
            break
        }
        case PropertyType.CHECKBOX:
            schema = z.boolean()
            break
        case PropertyType.CUSTOM:
            schema = z.string()
            break
        case PropertyType.OAUTH2:
        case PropertyType.BASIC_AUTH:
        case PropertyType.CUSTOM_AUTH:
        case PropertyType.SECRET_TEXT:
            throw new Error(`Unsupported property type: ${property.type}`)
    }
    if (property.description) {
        schema = schema.describe(property.description)
    }
    return property.required ? schema : schema.nullable()
}

async function buildObjectSchemaFromProperties(properties: Record<string, PieceProperty>, operation: SchemaBuildOperation, resolvedInput: Record<string, unknown>): Promise<z.ZodTypeAny> {
    const entries = Object.entries(properties)
    const schemas = await Promise.all(entries.map(([key, value]) =>
        propertyToSchema(key, value, operation, resolvedInput),
    ))
    const schemaMap: Record<string, z.ZodTypeAny> = {}
    for (let i = 0; i < entries.length; i++) {
        schemaMap[entries[i][0]] = schemas[i]
    }
    return z.object(schemaMap).loose()
}

async function buildDynamicSchema(propertyName: string, operation: SchemaBuildOperation, resolvedInput: Record<string, unknown>): Promise<z.ZodTypeAny> {
    const response = await pieceHelper.executeProps({
        ...operation,
        propertyName,
        actionOrTriggerName: operation.actionName,
        input: resolvedInput,
        sampleData: {},
        searchValue: undefined,
    }) as unknown as ExecutePropsResult<PropertyType.DYNAMIC>
    return buildObjectSchemaFromProperties(response.options, operation, resolvedInput)
}

type PropertyDetail = {
    name: string
    type: PropertyType
    description?: string
    options?: DropdownOption<unknown>[]
    defaultValue?: unknown
}

async function buildPropertyDetail(propertyName: string, property: PieceProperty, operation: SchemaBuildOperation, input: Record<string, unknown>): Promise<PropertyDetail | null> {
    const baseDetail: PropertyDetail = {
        name: propertyName,
        type: property.type,
        description: property.description,
        defaultValue: property.defaultValue,
    }

    if (
        property.type === PropertyType.DROPDOWN ||
        property.type === PropertyType.MULTI_SELECT_DROPDOWN ||
        property.type === PropertyType.STATIC_DROPDOWN ||
        property.type === PropertyType.STATIC_MULTI_SELECT_DROPDOWN
    ) {
        const options = await loadOptions(propertyName, property, operation, input)
        return {
            ...baseDetail,
            options,
        }
    }

    return baseDetail
}

async function loadOptions(propertyName: string, property: PieceProperty, operation: SchemaBuildOperation, input: Record<string, unknown>): Promise<DropdownOption<unknown>[]> {
    if (property.type === PropertyType.STATIC_DROPDOWN || property.type === PropertyType.STATIC_MULTI_SELECT_DROPDOWN) {
        const staticProperty = property as { options: { options: DropdownOption<unknown>[] } }
        return staticProperty.options.options
    }
    
    const response = await pieceHelper.executeProps({
        ...operation,
        propertyName,
        actionOrTriggerName: operation.actionName,
        input,
        sampleData: {},
        searchValue: undefined,
    }) as unknown as ExecutePropsResult<PropertyType.DROPDOWN | PropertyType.MULTI_SELECT_DROPDOWN>
    const options = response.options
    return options.options
}

function buildExistingValuesSection(existingValues: Record<string, unknown>): string {
    return `
**ALREADY FILLED VALUES** (use for context and consistency):
${JSON.stringify(existingValues, null, 2)}
`
}

function buildPropertyDetailsSection(propertyDetails: PropertyDetail[]): string {
    const sections = propertyDetails.map(detail => {
        let content = `- Name: ${detail.name}\n  Type: ${detail.type}`
        if (detail.description) {
            content += `\n  Description: ${detail.description}`
        }
        if (detail.options && detail.options.length > 0) {
            content += `\n  Options: ${JSON.stringify(detail.options, null, 2)}`
        }
        return content
    }).join('\n\n')

    return `
**PROPERTY DETAILS**:
${sections}
`
}

type ConstructToolParams = {
    engineConstants: EngineConstants
    tools: AgentPieceTool[]
    model: LanguageModel
}