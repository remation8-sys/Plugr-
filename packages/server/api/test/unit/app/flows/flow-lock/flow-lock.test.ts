import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockRedisStore: Record<string, { value: string, ttl: number }> = {}

type MockLockValue = {
    userId: string
    editorSessionId: string
    connectionId: string
}

vi.mock('../../../../../src/app/database/redis-connections', () => ({
    redisConnections: {
        useExisting: vi.fn().mockResolvedValue({
            get: vi.fn(async (key: string) => mockRedisStore[key]?.value ?? null),
            set: vi.fn(
                async (
                    key: string,
                    value: string,
                    _ex: string,
                    ttl: number,
                    nx?: string,
                ) => {
                    if (nx === 'NX' && mockRedisStore[key]) {
                        return null
                    }
                    mockRedisStore[key] = { value, ttl }
                    return 'OK'
                },
            ),
            del: vi.fn(async (key: string) => {
                Reflect.deleteProperty(mockRedisStore, key)
            }),
            eval: vi.fn(
                async (
                    script: string,
                    _keyCount: number,
                    key: string,
                    ...args: string[]
                ) => {
                    const stored = mockRedisStore[key]
                    if (!stored) {
                        return 0
                    }
                    const lock: MockLockValue = JSON.parse(stored.value)

                    if (script.includes('-- renew-lock')) {
                        const [userId, editorSessionId, value, ttl] = args
                        const isOwner =
                            lock.userId === userId &&
                            lock.editorSessionId === editorSessionId
                        if (!isOwner) {
                            return 0
                        }
                        mockRedisStore[key] = { value, ttl: Number(ttl) }
                        return 1
                    }

                    if (script.includes('-- release-lock')) {
                        const [userId, editorSessionId, connectionId] = args
                        const isOwner =
                            lock.userId === userId &&
                            lock.editorSessionId === editorSessionId &&
                            lock.connectionId === connectionId
                        if (!isOwner) {
                            return 0
                        }
                        Reflect.deleteProperty(mockRedisStore, key)
                        return 1
                    }

                    throw new Error('Unexpected Redis script')
                },
            ),
        }),
    },
}))

import { lockService } from '../../../../../src/app/core/collaborative/lock/lock.service'

const mockLog = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
} as unknown as Parameters<typeof lockService>[0]

const service = lockService(mockLog)

type AcquireParams = Parameters<typeof service.acquire>[0]
type ReleaseParams = Parameters<typeof service.release>[0]

const callAcquire = (
    params: Omit<AcquireParams, 'editorSessionId' | 'connectionId'>,
): ReturnType<typeof service.acquire> =>
    service.acquire({
        ...params,
        editorSessionId: params.userId + '-session',
        connectionId: params.userId + '-connection',
    })

const callRelease = (
    params: Omit<ReleaseParams, 'editorSessionId' | 'connectionId'>,
): ReturnType<typeof service.release> =>
    service.release({
        ...params,
        editorSessionId: params.userId + '-session',
        connectionId: params.userId + '-connection',
    })

describe('LockService', () => {
    const resourceId = 'test-flow-id'

    beforeEach(() => {
        for (const key of Object.keys(mockRedisStore)) {
            Reflect.deleteProperty(mockRedisStore, key)
        }
    })

    it('acquires lock when no existing lock', async () => {
        const result = await callAcquire({
            resourceId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        expect(result.acquired).toBe(true)
        expect(result.lock).toBeNull()
    })

    it('denies lock when locked by different user', async () => {
        await callAcquire({
            resourceId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        const result = await callAcquire({
            resourceId,
            userId: 'user2',
            userDisplayName: 'User 2',
        })
        expect(result.acquired).toBe(false)
        expect(result.lock).toMatchObject({
            userId: 'user1',
            userDisplayName: 'User 1',
        })
    })

    it('allows the same editor session to refresh its lock', async () => {
        await callAcquire({
            resourceId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        const result = await callAcquire({
            resourceId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        expect(result.acquired).toBe(true)
    })

    it('denies another editor session owned by the same user', async () => {
        await service.acquire({
            resourceId,
            userId: 'user1',
            userDisplayName: 'User 1',
            editorSessionId: 'desktop-session',
            connectionId: 'desktop-socket',
        })
        const result = await service.acquire({
            resourceId,
            userId: 'user1',
            userDisplayName: 'User 1',
            editorSessionId: 'mobile-session',
            connectionId: 'mobile-socket',
        })

        expect(result.acquired).toBe(false)
        expect(result.lock).toMatchObject({
            userId: 'user1',
            editorSessionId: 'desktop-session',
        })
    })

    it('allows force takeover', async () => {
        await callAcquire({
            resourceId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        const result = await callAcquire({
            resourceId,
            userId: 'user2',
            userDisplayName: 'User 2',
            force: true,
        })
        expect(result.acquired).toBe(true)
    })

    it('releases lock', async () => {
        await callAcquire({
            resourceId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        const released = await callRelease({ resourceId, userId: 'user1' })
        expect(released).toBe(true)
        const lock = await service.getLock({ resourceId })
        expect(lock).toBeNull()
    })

    it('does not let a stale socket release a reconnected session', async () => {
        const owner = {
            resourceId,
            userId: 'user1',
            userDisplayName: 'User 1',
            editorSessionId: 'editor-session',
        }
        await service.acquire({ ...owner, connectionId: 'old-socket' })
        await service.acquire({ ...owner, connectionId: 'new-socket' })

        const released = await service.release({
            resourceId,
            userId: 'user1',
            editorSessionId: 'editor-session',
            connectionId: 'old-socket',
        })

        expect(released).toBe(false)
        expect(await service.getLock({ resourceId })).toMatchObject({
            connectionId: 'new-socket',
        })
    })

    it('does not let the previous owner release a force-taken-over lock', async () => {
        await service.acquire({
            resourceId,
            userId: 'user1',
            userDisplayName: 'User 1',
            editorSessionId: 'first-session',
            connectionId: 'first-socket',
        })
        await service.acquire({
            resourceId,
            userId: 'user2',
            userDisplayName: 'User 2',
            editorSessionId: 'second-session',
            connectionId: 'second-socket',
            force: true,
        })

        const released = await service.release({
            resourceId,
            userId: 'user1',
            editorSessionId: 'first-session',
            connectionId: 'first-socket',
        })

        expect(released).toBe(false)
        expect(await service.getLock({ resourceId })).toMatchObject({
            userId: 'user2',
            editorSessionId: 'second-session',
        })
    })

    it('does not release lock held by another user', async () => {
        await callAcquire({
            resourceId,
            userId: 'user1',
            userDisplayName: 'User 1',
        })
        const released = await callRelease({ resourceId, userId: 'user2' })
        expect(released).toBe(false)
        const lock = await service.getLock({ resourceId })
        expect(lock).not.toBeNull()
    })

    it('returns null when no lock exists', async () => {
        const lock = await service.getLock({ resourceId: 'nonexistent' })
        expect(lock).toBeNull()
    })
})
