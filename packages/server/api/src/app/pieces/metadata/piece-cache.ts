import { ApEnvironment, isNil, PieceType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { pubsub } from '../../helper/pubsub'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { PieceMetadataEntity, PieceMetadataSchema } from './piece-metadata-entity'
import { loadDevPiecesIfEnabled } from './utils'

const repo = repoFactory(PieceMetadataEntity)
const environment = system.get<ApEnvironment>(AppSystemProp.ENVIRONMENT)
const isTestingEnvironment = environment === ApEnvironment.TESTING

let cachedRegistry: PieceRegistryEntry[] | null = null
const cachedFullPieces = new Map<string, PieceMetadataSchema[]>()
let registryGeneration = 0

export const pieceCache = (log: FastifyBaseLogger) => {
    return {
        async setup(): Promise<void> {
            log.info('[pieceCache] Registry cache initialized')
            if (!isTestingEnvironment) {
                await pubsub.subscribe(PIECE_REGISTRY_INVALIDATION_CHANNEL, () => {
                    cachedRegistry = null
                    cachedFullPieces.clear()
                    registryGeneration++
                    log.debug('[pieceCache] Registry invalidated via pubsub')
                })
            }
        },

        async loadRegistry(): Promise<PieceRegistryEntry[]> {
            const persistedRegistry = await loadPersistedRegistry()
            const devPieces = (await loadDevPiecesIfEnabled(log)).map(toRegistryEntry)
            return [...persistedRegistry, ...devPieces]
        },

        // Full piece rows (including complete action/trigger prop schemas) are
        // expensive to pull from Postgres - two round trips for ~700 rows every
        // call. Cache them the same way the registry is cached, keyed by release
        // since that's the only thing that changes which rows are "latest".
        async loadFullPieces(currentRelease: string, fetchFn: () => Promise<PieceMetadataSchema[]>): Promise<PieceMetadataSchema[]> {
            return loadPersistedFullPieces(currentRelease, fetchFn)
        },

        async invalidate(): Promise<void> {
            cachedRegistry = null
            cachedFullPieces.clear()
            registryGeneration++
            if (!isTestingEnvironment) {
                await pubsub.publish(PIECE_REGISTRY_INVALIDATION_CHANNEL, '1')
            }
        },
    }
}

async function loadPersistedRegistry(): Promise<PieceRegistryEntry[]> {
    if (isTestingEnvironment) {
        return fetchRegistryFromDB()
    }
    if (!isNil(cachedRegistry)) {
        return cachedRegistry
    }
    const startGeneration = registryGeneration
    const result = await fetchRegistryFromDB()
    if (registryGeneration !== startGeneration) {
        return loadPersistedRegistry()
    }
    cachedRegistry = result
    return result
}

function toRegistryEntry(piece: PieceMetadataSchema): PieceRegistryEntry {
    return {
        name: piece.name,
        version: piece.version,
        minimumSupportedRelease: piece.minimumSupportedRelease,
        maximumSupportedRelease: piece.maximumSupportedRelease,
        platformId: piece.platformId,
        pieceType: piece.pieceType,
    }
}

async function loadPersistedFullPieces(currentRelease: string, fetchFn: () => Promise<PieceMetadataSchema[]>): Promise<PieceMetadataSchema[]> {
    if (isTestingEnvironment) {
        return fetchFn()
    }
    const cached = cachedFullPieces.get(currentRelease)
    if (!isNil(cached)) {
        return cached
    }
    const startGeneration = registryGeneration
    const result = await fetchFn()
    if (registryGeneration !== startGeneration) {
        return loadPersistedFullPieces(currentRelease, fetchFn)
    }
    cachedFullPieces.set(currentRelease, result)
    return result
}

async function fetchRegistryFromDB(): Promise<PieceRegistryEntry[]> {
    return repo()
        .createQueryBuilder('pm')
        .select(['pm."name"', 'pm."version"', 'pm."platformId"', 'pm."pieceType"', 'pm."minimumSupportedRelease"', 'pm."maximumSupportedRelease"'])
        .getRawMany<PieceRegistryEntry>()
}

export const PIECE_REGISTRY_INVALIDATION_CHANNEL = 'piece-registry-invalidation'

export type PieceRegistryEntry = {
    platformId?: string
    pieceType: PieceType
    name: string
    version: string
    minimumSupportedRelease?: string
    maximumSupportedRelease?: string
}
