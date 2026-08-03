import { apId, TemplateType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterEach, vi } from 'vitest'
import { createMockTemplate } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('Community Templates', () => {
    it('should compact and paginate a cached upstream official template list', async () => {
        const templates = [
            createMockTemplate({ type: TemplateType.OFFICIAL, platformId: null }),
            createMockTemplate({ type: TemplateType.OFFICIAL, platformId: null }),
        ]
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({
                data: templates,
                next: null,
                previous: null,
            }), {
                status: StatusCodes.OK,
                headers: { 'Content-Type': 'application/json' },
            }),
        )
        const search = `ce-template-pagination-${apId()}`

        const firstResponse = await app?.inject({
            method: 'GET',
            url: '/api/v1/templates',
            query: {
                type: TemplateType.OFFICIAL,
                representation: 'summary',
                search,
                limit: 1,
            },
        })
        const firstPage = firstResponse?.json()

        expect(firstResponse?.statusCode).toBe(StatusCodes.OK)
        expect(firstPage.data).toHaveLength(1)
        expect(firstPage.data[0]).not.toHaveProperty('flows')
        expect(firstPage.data[0]).not.toHaveProperty('tables')
        expect(firstPage.next).toBe('community_1')

        const secondResponse = await app?.inject({
            method: 'GET',
            url: '/api/v1/templates',
            query: {
                type: TemplateType.OFFICIAL,
                representation: 'summary',
                search,
                limit: 1,
                cursor: firstPage.next,
            },
        })
        const secondPage = secondResponse?.json()

        expect(secondResponse?.statusCode).toBe(StatusCodes.OK)
        expect(secondPage.data).toHaveLength(1)
        expect(secondPage.data[0].id).toBe(templates[1].id)
        expect(secondPage.previous).toBe('community_0')
        expect(fetchMock).toHaveBeenCalledTimes(1)
        const upstreamUrl = fetchMock.mock.calls[0][0].toString()
        expect(upstreamUrl).not.toContain('limit=')
        expect(upstreamUrl).not.toContain('cursor=')
    })
})
