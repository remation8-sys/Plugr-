import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
    FlowActionType,
    flowStructureUtil,
    FlowTriggerType,
    PopulatedFlow,
    Project,
    ProjectType,
    Step,
} from '@activepieces/shared'

function loadPromptTemplate(filename: string): string {
    return readFileSync(path.resolve(`packages/server/api/src/assets/prompts/${filename}`), 'utf8')
}

const GUIDE_TOPICS = ['build_flow', 'one_time_task', 'error_handling', 'http_fallback'] as const

const PROMPT_TEMPLATES = {
    system: loadPromptTemplate('chat-system-prompt.md'),
    projectSelected: loadPromptTemplate('chat-project-context-selected.md'),
    noProject: loadPromptTemplate('chat-project-context-none.md'),
    builderFlowContext: loadPromptTemplate('chat-builder-flow-context.md'),
}

const GUIDES: Record<string, string> = Object.fromEntries(
    GUIDE_TOPICS.map((topic) => [topic, loadPromptTemplate(`guides/${topic}.md`)]),
)

function sanitizeProjectName(name: string): string {
    return name.replace(/[^a-zA-Z0-9 \-_.]/g, '').slice(0, 64)
}

function projectDisplayName(project: Project): string {
    return project.type === ProjectType.PERSONAL ? 'Personal Project' : project.displayName
}

function buildProjectListBlock({ projects, frontendUrl }: {
    projects: Project[]
    frontendUrl: string
}): string {
    if (projects.length === 0) return 'No projects available.'
    return projects.map((p) => {
        const url = `${frontendUrl}/projects/${p.id}`
        return `- **${sanitizeProjectName(projectDisplayName(p))}** (ID: ${p.id}) — [Open](${url})`
    }).join('\n')
}

function buildProjectContextBlock({ project, frontendUrl }: {
    project: Project | null
    frontendUrl: string
}): string {
    if (!project) {
        return PROMPT_TEMPLATES.noProject
    }
    return PROMPT_TEMPLATES.projectSelected
        .replaceAll('{{PROJECT_NAME}}', sanitizeProjectName(projectDisplayName(project)))
        .replaceAll('{{PROJECT_ID}}', project.id)
        .replaceAll('{{FRONTEND_URL}}', frontendUrl)
}

function buildAgentSystemPrompt({ projects, currentProjectId, frontendUrl }: {
    projects: Project[]
    currentProjectId: string | null
    frontendUrl: string
}): string {
    const currentProject = currentProjectId
        ? projects.find((p) => p.id === currentProjectId) ?? null
        : null

    return PROMPT_TEMPLATES.system
        .replace('{{PROJECT_LIST}}', buildProjectListBlock({ projects, frontendUrl }))
        .replace('{{PROJECT_CONTEXT}}', buildProjectContextBlock({ project: currentProject, frontendUrl }))
        .replaceAll('{{FRONTEND_URL}}', frontendUrl)
}

const MAX_CONTEXT_STEPS = 60

// Placeholder braces are stripped so user-controlled names cannot inject
// or collide with the {{...}} template replacements below.
function sanitizeDisplayText(text: string): string {
    return text.replace(/[{}\x00-\x1f\r\n]/g, '').slice(0, 120)
}

function describeStep(step: Step): string {
    switch (step.type) {
        case FlowTriggerType.EMPTY:
            return 'trigger not set up yet'
        case FlowTriggerType.PIECE:
            return `piece: ${step.settings.pieceName} (trigger: ${step.settings.triggerName})`
        case FlowActionType.PIECE:
            return `piece: ${step.settings.pieceName} (action: ${step.settings.actionName})`
        case FlowActionType.CODE:
            return 'code step'
        case FlowActionType.ROUTER:
            return 'router (conditional branches)'
        case FlowActionType.LOOP_ON_ITEMS:
            return 'loop on items'
    }
}

function buildFlowStepsBlock(flow: PopulatedFlow): string {
    const steps = flowStructureUtil.getAllSteps(flow.version.trigger)
    const lines = steps.slice(0, MAX_CONTEXT_STEPS).map((step, index) => {
        const role = index === 0 ? 'trigger' : 'step'
        return `${index + 1}. [${role}] ${sanitizeDisplayText(step.displayName)} (name: ${step.name}) — ${describeStep(step)}`
    })
    if (steps.length > MAX_CONTEXT_STEPS) {
        lines.push(`… and ${steps.length - MAX_CONTEXT_STEPS} more steps (use ap_flow_structure for the full list)`)
    }
    return lines.join('\n')
}

function buildBuilderFlowContext({ flow, frontendUrl }: {
    flow: PopulatedFlow
    frontendUrl: string
}): string {
    const status = flow.publishedVersionId
        ? `${flow.status} (published; the Builder shows the draft version)`
        : 'DISABLED (draft — never published)'
    return PROMPT_TEMPLATES.builderFlowContext
        .replaceAll('{{FLOW_NAME}}', sanitizeDisplayText(flow.version.displayName))
        .replaceAll('{{FLOW_ID}}', flow.id)
        .replaceAll('{{PROJECT_ID}}', flow.projectId)
        .replaceAll('{{FLOW_STATUS}}', status)
        .replaceAll('{{FLOW_URL}}', `${frontendUrl}/projects/${flow.projectId}/flows/${flow.id}`)
        .replaceAll('{{FLOW_STEPS}}', buildFlowStepsBlock(flow))
}

export const chatPrompt = {
    buildSystemPrompt: buildAgentSystemPrompt,
    buildBuilderFlowContext,
    guides: GUIDES,
    projectDisplayName,
}
