import {
    ActivepiecesError,
    ErrorCode,
    isNil,
    ListTemplatesRequestQuery,
    SeekPage,
    Template,
} from '@activepieces/shared'

const TEMPLATES_SOURCE_URL = 'https://cloud.activepieces.com/api/v1/templates'
const communityTemplateListCache = new Map<string, CachedCommunityTemplateList>()

export const communityTemplates = {
    getOrThrow: async (id: string): Promise<Template> => {
        const url = `${TEMPLATES_SOURCE_URL}/${id}`
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        if (!response.ok) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'template',
                    entityId: id,
                    message: `Template ${id} not found`,
                },
            })
        }
        const template = await response.json()
        return template
    },
    getCategories: async (): Promise<string[]> => {
        const url = `${TEMPLATES_SOURCE_URL}/categories`
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        const categories = await response.json()
        return categories
    },
    list: async (request: ListTemplatesRequestQuery): Promise<SeekPage<Template>> => {
        const cacheKey = createCommunityTemplateCacheKey(request)
        const cachedPage = getCachedCommunityTemplateList(cacheKey)
        if (!isNil(cachedPage)) {
            return cachedPage
        }
        const queryString = convertToQueryString(request)
        const url = `${TEMPLATES_SOURCE_URL}?${queryString}`
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        const templates = await response.json()
        setCachedCommunityTemplateList(cacheKey, templates)
        return templates
    },
}

function createCommunityTemplateCacheKey(request: ListTemplatesRequestQuery): string {
    const normalizedEntries = Object.entries(request)
        .filter(([key, value]) => key !== 'cursor' && key !== 'limit' && !isNil(value))
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, value]) => [
            key,
            Array.isArray(value) ? [...value].sort() : value,
        ])
    return JSON.stringify(normalizedEntries)
}

function getCachedCommunityTemplateList(cacheKey: string): SeekPage<Template> | undefined {
    const cached = communityTemplateListCache.get(cacheKey)
    if (isNil(cached)) {
        return undefined
    }
    if (cached.expiresAt <= Date.now()) {
        communityTemplateListCache.delete(cacheKey)
        return undefined
    }
    communityTemplateListCache.delete(cacheKey)
    communityTemplateListCache.set(cacheKey, cached)
    return cached.page
}

function setCachedCommunityTemplateList(cacheKey: string, page: SeekPage<Template>): void {
    communityTemplateListCache.delete(cacheKey)
    communityTemplateListCache.set(cacheKey, {
        page,
        expiresAt: Date.now() + COMMUNITY_TEMPLATE_CACHE_TTL_MS,
    })
    while (communityTemplateListCache.size > COMMUNITY_TEMPLATE_CACHE_MAX_ENTRIES) {
        const oldestKey = communityTemplateListCache.keys().next().value
        if (isNil(oldestKey)) {
            return
        }
        communityTemplateListCache.delete(oldestKey)
    }
}

const COMMUNITY_TEMPLATE_CACHE_TTL_MS = 5 * 60 * 1000
const COMMUNITY_TEMPLATE_CACHE_MAX_ENTRIES = 10

type CachedCommunityTemplateList = {
    page: SeekPage<Template>
    expiresAt: number
}


function convertToQueryString(params: ListTemplatesRequestQuery): string {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach((val) => {
                if (!isNil(val)) {
                    searchParams.append(key, typeof val === 'string' ? val : JSON.stringify(val))
                }
            })
        }
        else if (!isNil(value)) {
            searchParams.set(key, value.toString())
        }
    })

    return searchParams.toString()
}
