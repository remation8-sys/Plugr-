import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../../database/redis-connections'

const LOCK_TTL_SECONDS = 60
const KEY_PREFIX = 'lock:'
const RENEW_LOCK_SCRIPT = `
-- renew-lock
local current = redis.call('GET', KEYS[1])
if not current then
    return 0
end

local decoded, lock = pcall(cjson.decode, current)
if not decoded or type(lock) ~= 'table' then
    return 0
end

if lock.userId == ARGV[1] and lock.editorSessionId == ARGV[2] then
    redis.call('SET', KEYS[1], ARGV[3], 'EX', tonumber(ARGV[4]))
    return 1
end

return 0
`
const RELEASE_LOCK_SCRIPT = `
-- release-lock
local current = redis.call('GET', KEYS[1])
if not current then
    return 0
end

local decoded, lock = pcall(cjson.decode, current)
if not decoded or type(lock) ~= 'table' then
    return 0
end

if lock.userId == ARGV[1]
    and lock.editorSessionId == ARGV[2]
    and lock.connectionId == ARGV[3] then
    redis.call('DEL', KEYS[1])
    return 1
end

return 0
`

export const lockService = (log: FastifyBaseLogger) => ({
    async acquire({
        resourceId,
        userId,
        userDisplayName,
        editorSessionId,
        connectionId,
        force,
    }: AcquireParams): Promise<AcquireResult> {
        log.debug(
            { resourceId, userId, force },
            '[Lock] Attempting to acquire lock',
        )
        const redis = await redisConnections.useExisting()
        const key = KEY_PREFIX + resourceId
        const value = JSON.stringify({
            userId,
            userDisplayName,
            editorSessionId,
            connectionId,
        })

        if (force) {
            await redis.set(key, value, 'EX', LOCK_TTL_SECONDS)
            log.debug({ resourceId, userId }, '[Lock] Lock force-acquired')
            return { acquired: true, lock: null }
        }

        const setResult = await redis.set(key, value, 'EX', LOCK_TTL_SECONDS, 'NX')
        if (setResult !== null) {
            log.debug({ resourceId, userId }, '[Lock] Lock acquired')
            return { acquired: true, lock: null }
        }

        const renewResult = await redis.eval(
            RENEW_LOCK_SCRIPT,
            1,
            key,
            userId,
            editorSessionId,
            value,
            LOCK_TTL_SECONDS.toString(),
        )
        const renewed = Number(renewResult) === 1
        if (renewed) {
            log.debug(
                { resourceId, userId, editorSessionId },
                '[Lock] Lock renewed (same editor session)',
            )
            return { acquired: true, lock: null }
        }

        const existing = await redis.get(key)
        const lock: LockValue | null = existing ? JSON.parse(existing) : null
        log.debug(
            { resourceId, userId, lockedByUserId: lock?.userId },
            '[Lock] Lock already held by another user',
        )
        return { acquired: false, lock }
    },

    async release({
        resourceId,
        userId,
        editorSessionId,
        connectionId,
    }: ReleaseParams): Promise<boolean> {
        log.debug({ resourceId, userId }, '[Lock] Attempting to release lock')
        const redis = await redisConnections.useExisting()
        const key = KEY_PREFIX + resourceId
        const releaseResult = await redis.eval(
            RELEASE_LOCK_SCRIPT,
            1,
            key,
            userId,
            editorSessionId,
            connectionId,
        )
        const released = Number(releaseResult) === 1
        if (released) {
            log.debug({ resourceId, userId }, '[Lock] Lock released')
            return true
        }

        const existing = await redis.get(key)
        if (existing) {
            const lock: LockValue = JSON.parse(existing)
            log.debug(
                { resourceId, userId, lockedByUserId: lock.userId },
                '[Lock] Cannot release lock held by another user',
            )
        }
        else {
            log.debug({ resourceId, userId }, '[Lock] No lock found to release')
        }
        return false
    },

    async getLock({ resourceId }: GetLockParams): Promise<LockValue | null> {
        const redis = await redisConnections.useExisting()
        const existing = await redis.get(KEY_PREFIX + resourceId)
        const lock = existing ? JSON.parse(existing) : null
        log.debug({ resourceId, hasLock: !!lock }, '[Lock] Get lock')
        return lock
    },
})

type LockValue = {
    userId: string
    userDisplayName: string
    editorSessionId: string
    connectionId: string
}

type AcquireParams = {
    resourceId: string
    userId: string
    userDisplayName: string
    editorSessionId: string
    connectionId: string
    force?: boolean
}

type AcquireResult = {
    acquired: boolean
    lock: LockValue | null
}

type ReleaseParams = {
    resourceId: string
    userId: string
    editorSessionId: string
    connectionId: string
}

type GetLockParams = {
    resourceId: string
}
