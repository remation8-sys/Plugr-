import { PrincipalType } from '@activepieces/shared'
import { FastifyReply, FastifyRequest } from 'fastify'
import { redisConnections } from '../../database/redis-connections'

type RateLimiterParams = {
    keyPrefix: string
    max: number
    windowSeconds: number
}

export async function checkRedisRateLimit(
    key: string,
    { keyPrefix, max, windowSeconds }: RateLimiterParams,
): Promise<{ limited: boolean }> {
    const redis = await redisConnections.useExisting()
    const redisKey = `${keyPrefix}:${key}`
    const current = await redis.incr(redisKey)
    if (current === 1) {
        await redis.expire(redisKey, windowSeconds)
    }
    return { limited: current > max }
}

function sendRateLimitExceeded(reply: FastifyReply, windowSeconds: number): void {
    reply
        .code(429)
        .header('Retry-After', String(windowSeconds))
        .send({
            statusCode: 429,
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
        })
}

const API_RATE_LIMITED_PRINCIPAL_TYPES: PrincipalType[] = [PrincipalType.USER, PrincipalType.SERVICE]

export function buildUserApiRateLimitHook(params: RateLimiterParams) {
    return async function userApiRateLimitHook(
        request: FastifyRequest,
        reply: FastifyReply,
    ): Promise<void> {
        const principal = request.principal
        if (!principal?.id || !API_RATE_LIMITED_PRINCIPAL_TYPES.includes(principal.type)) {
            return
        }
        const { limited } = await checkRedisRateLimit(principal.id, params)
        if (limited) {
            sendRateLimitExceeded(reply, params.windowSeconds)
        }
    }
}

export async function checkAndReplyRateLimit(
    key: string,
    params: RateLimiterParams,
    reply: FastifyReply,
): Promise<boolean> {
    const { limited } = await checkRedisRateLimit(key, params)
    if (limited) {
        sendRateLimitExceeded(reply, params.windowSeconds)
    }
    return limited
}
