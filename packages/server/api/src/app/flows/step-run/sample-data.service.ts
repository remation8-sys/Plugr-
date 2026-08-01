import {
    apId,
    DATA_TYPE_KEY_IN_FILE_METADATA,
    File,
    FileCompression,
    FileType,
    FlowAction,
    FlowId,
    flowStructureUtil,
    FlowTrigger,
    FlowVersion,
    FlowVersionId,
    isNil,
    ProjectId,
    SampleDataDataType,
    SampleDataFileType,
    SampleDataSettings,
    SaveSampleDataResponse,
    Step,
    stringifyNullOrUndefined,
    tryCatch,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { fileCompressor } from '../../file/file-compressor'
import { fileRepo, fileService } from '../../file/file.service'
import { flowVersionService } from '../flow-version/flow-version.service'

const SAMPLE_DATA_FILE_QUERY_BATCH_SIZE = 500

const sampleDataService = (log: FastifyBaseLogger) => ({
    async saveSampleDataFileIdsInStep(params: SaveSampleDataParams): Promise<SampleDataSettings> {
        const flowVersion = await flowVersionService(log).getOneOrThrow(params.flowVersionId)
        const step = flowStructureUtil.getStepOrThrow(params.stepName, flowVersion.trigger)
        const sampleDataFile = await saveSampleData({ ...params, log })
        const clonedStep: Step = JSON.parse(JSON.stringify(step))
        return {
            sampleDataFileId: params.type === SampleDataFileType.OUTPUT ? sampleDataFile.id : clonedStep.settings.sampleData?.sampleDataFileId,
            sampleDataInputFileId: params.type === SampleDataFileType.INPUT ? sampleDataFile.id : clonedStep.settings.sampleData?.sampleDataInputFileId,
            lastTestDate: dayjs().toISOString(),
        }
    },
    async getOrReturnEmpty(params: GetSampleDataParams): Promise<unknown> {
        const step = flowStructureUtil.getStepOrThrow(params.stepName, params.flowVersion.trigger)
        const fileType = params.type === SampleDataFileType.INPUT ? FileType.SAMPLE_DATA_INPUT : FileType.SAMPLE_DATA
        const fileId = params.type === SampleDataFileType.OUTPUT ? step.settings.sampleData?.sampleDataFileId : step.settings.sampleData?.sampleDataInputFileId
        if (isNil(fileId)) {
            return {}
        }
        if (!isNil(fileId)) {
            const response = await fileService(log).getDataOrUndefined({
                projectId: params.projectId,
                fileId,
                type: fileType,
            })

            if (isNil(response)) {
                return undefined
            }
            if (response.metadata?.[DATA_TYPE_KEY_IN_FILE_METADATA] === SampleDataDataType.STRING) {
                return response.data.toString('utf-8')
            }
            const decodedData = new TextDecoder('utf-8').decode(response.data)
            return JSON.parse(decodedData)
        }
        return undefined

    },
    async deleteForStep(params: DeleteSampleDataForStepParams): Promise<void> {
        await fileRepo().createQueryBuilder().delete().where({
            id: params.fileId,
            projectId: params.projectId,
            type: params.fileType,
        }).andWhere('metadata->>\'flowVersionId\' = :flowVersionId', { flowVersionId: params.flowVersionId }).execute()
    },
    async deleteForFlow(params: DeleteSampleDataParams): Promise<void> {
        await fileRepo().createQueryBuilder().delete().where({
            projectId: params.projectId,
            type: params.fileType,
        }).andWhere('metadata->>\'flowId\' = :flowId', { flowId: params.flowId }).execute()
    },
    async getSampleDataForFlow(params: GetSampleDataForFlowParams): Promise<Record<string, unknown>> {
        const sampleData = await getSampleDataForFlowByTypes({
            log,
            projectId: params.projectId,
            flowVersion: params.flowVersion,
            types: [params.type],
        })
        return sampleData[params.type]
    },
    async getAllSampleDataForFlow(params: GetAllSampleDataForFlowParams): Promise<AllFlowSampleData> {
        const sampleData = await getSampleDataForFlowByTypes({
            log,
            projectId: params.projectId,
            flowVersion: params.flowVersion,
            types: [SampleDataFileType.INPUT, SampleDataFileType.OUTPUT],
        })
        return {
            input: sampleData[SampleDataFileType.INPUT],
            output: sampleData[SampleDataFileType.OUTPUT],
        }
    },
})

async function getSampleDataForFlowByTypes({
    log,
    projectId,
    flowVersion,
    types,
}: GetSampleDataForFlowByTypesParams): Promise<SampleDataByFileType> {
    const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)
    const fileReferences = steps.flatMap((step) =>
        types.map((type) => ({
            fileId: getSampleDataFileId({ step, type }),
            fileType: getSampleDataStorageType(type),
        })),
    )
    const fileIds = [...new Set(fileReferences.flatMap(({ fileId }) => isNil(fileId) ? [] : [fileId]))]
    const fileTypes = [...new Set(fileReferences.map(({ fileType }) => fileType))]
    const files = await getSampleDataFiles({
        log,
        projectId,
        fileIds,
        fileTypes,
    })
    const decodedFiles = new Map<string, unknown>()
    await Promise.all(files.map(async (file) => {
        decodedFiles.set(
            getSampleDataFileKey({ fileId: file.id, fileType: file.type }),
            await decodeSampleDataFile({ file, log }),
        )
    }))
    return {
        [SampleDataFileType.INPUT]: buildSampleDataRecord({
            steps,
            type: SampleDataFileType.INPUT,
            decodedFiles,
        }),
        [SampleDataFileType.OUTPUT]: buildSampleDataRecord({
            steps,
            type: SampleDataFileType.OUTPUT,
            decodedFiles,
        }),
    }
}

async function getSampleDataFiles({
    log,
    projectId,
    fileIds,
    fileTypes,
}: GetSampleDataFilesParams): Promise<File[]> {
    if (fileIds.length === 0) {
        return []
    }
    const fileIdBatches = Array.from(
        { length: Math.ceil(fileIds.length / SAMPLE_DATA_FILE_QUERY_BATCH_SIZE) },
        (_, index) => fileIds.slice(
            index * SAMPLE_DATA_FILE_QUERY_BATCH_SIZE,
            (index + 1) * SAMPLE_DATA_FILE_QUERY_BATCH_SIZE,
        ),
    )
    const { data: fileBatches, error } = await tryCatch(() => Promise.all(
        fileIdBatches.map((fileIdBatch) => fileRepo().find({
            where: {
                id: In(fileIdBatch),
                projectId,
                type: In(fileTypes),
            },
        })),
    ))
    if (error) {
        log.error({ error }, '[SampleDataService#getSampleDataForFlow] error')
        return []
    }
    return fileBatches.flat()
}

async function decodeSampleDataFile({ file, log }: DecodeSampleDataFileParams): Promise<unknown> {
    const { data, error } = await tryCatch(async () => {
        const decompressedData = await fileCompressor.decompress({
            data: file.data,
            compression: file.compression,
        })
        if (file.metadata?.[DATA_TYPE_KEY_IN_FILE_METADATA] === SampleDataDataType.STRING) {
            return decompressedData.toString('utf-8')
        }
        const decodedData = new TextDecoder('utf-8').decode(decompressedData)
        return JSON.parse(decodedData)
    })
    if (error) {
        log.error({ error }, '[SampleDataService#getSampleDataForFlow] error')
        return undefined
    }
    return data
}

function buildSampleDataRecord({ steps, type, decodedFiles }: BuildSampleDataRecordParams): Record<string, unknown> {
    const fileType = getSampleDataStorageType(type)
    return Object.fromEntries(steps.map((step) => {
        const fileId = getSampleDataFileId({ step, type })
        if (isNil(fileId)) {
            return [step.name, {}]
        }
        return [step.name, decodedFiles.get(getSampleDataFileKey({ fileId, fileType }))]
    }))
}

function getSampleDataFileId({ step, type }: GetSampleDataFileIdParams): string | undefined {
    return type === SampleDataFileType.OUTPUT
        ? step.settings.sampleData?.sampleDataFileId
        : step.settings.sampleData?.sampleDataInputFileId
}

function getSampleDataStorageType(type: SampleDataFileType): FileType {
    return type === SampleDataFileType.INPUT
        ? FileType.SAMPLE_DATA_INPUT
        : FileType.SAMPLE_DATA
}

function getSampleDataFileKey({ fileId, fileType }: GetSampleDataFileKeyParams): string {
    return `${fileType}:${fileId}`
}

async function saveSampleData({
    projectId,
    flowVersionId,
    stepName,
    payload,
    type,
    log,
}: SaveSampleDataWithLogParams): Promise<SaveSampleDataResponse> {
    const flowVersion = await flowVersionService(log).getOneOrThrow(flowVersionId)
    const step = flowStructureUtil.getStepOrThrow(stepName, flowVersion.trigger)
    const fileType = type === SampleDataFileType.INPUT ? FileType.SAMPLE_DATA_INPUT : FileType.SAMPLE_DATA
    const fileId = await useExistingOrCreateNewSampleId({
        projectId,
        flowVersion,
        step,
        fileType,
        log,
    })
    const payloadWithStringifiedNullOrUndefined = isNil(payload) ? stringifyNullOrUndefined(payload) : payload
    const data = typeof payloadWithStringifiedNullOrUndefined === 'string' ? Buffer.from(payloadWithStringifiedNullOrUndefined) : Buffer.from(JSON.stringify(payloadWithStringifiedNullOrUndefined))
    return fileService(log).save({
        projectId,
        fileId,
        data,
        size: data.length,
        type: fileType,
        compression: FileCompression.NONE,
        metadata: {
            flowId: flowVersion.flowId,
            flowVersionId,
            stepName,
            [DATA_TYPE_KEY_IN_FILE_METADATA]: typeof payloadWithStringifiedNullOrUndefined === 'string' ? SampleDataDataType.STRING : SampleDataDataType.JSON,
        },
    })
}

async function useExistingOrCreateNewSampleId({
    projectId,
    flowVersion,
    step,
    fileType,
    log,
}: UseExistingOrCreateNewSampleIdParams): Promise<string> {
    const sampleDataId = fileType === FileType.SAMPLE_DATA ? step.settings.sampleData?.sampleDataFileId : step.settings.sampleData?.sampleDataInputFileId
    if (isNil(sampleDataId)) {
        return apId()
    }
    const file = await fileService(log).getFile({
        projectId,
        fileId: sampleDataId,
        type: fileType,
    })
    const isNewVersion = file?.metadata?.flowVersionId !== flowVersion.id
    if (isNewVersion || isNil(file)) {
        return apId()
    }
    return file.id
}


type DeleteSampleDataForStepParams = {
    projectId: ProjectId
    fileId: string
    fileType: FileType
    flowVersionId: FlowVersionId
    flowId: FlowId
}

type DeleteSampleDataParams = {
    projectId: ProjectId
    flowId: FlowId
    fileType: FileType
}

type GetSampleDataParams = {
    projectId: ProjectId
    type: SampleDataFileType
    stepName: string
    flowVersion: FlowVersion
}

type GetAllSampleDataForFlowParams = {
    projectId: ProjectId
    flowVersion: FlowVersion
}

type GetSampleDataForFlowParams = GetAllSampleDataForFlowParams & {
    type: SampleDataFileType
}

type AllFlowSampleData = {
    input: Record<string, unknown>
    output: Record<string, unknown>
}

type SampleDataByFileType = Record<SampleDataFileType, Record<string, unknown>>

type GetSampleDataForFlowByTypesParams = GetAllSampleDataForFlowParams & {
    log: FastifyBaseLogger
    types: SampleDataFileType[]
}

type GetSampleDataFilesParams = {
    log: FastifyBaseLogger
    projectId: ProjectId
    fileIds: string[]
    fileTypes: FileType[]
}

type DecodeSampleDataFileParams = {
    file: File
    log: FastifyBaseLogger
}

type BuildSampleDataRecordParams = {
    steps: Step[]
    type: SampleDataFileType
    decodedFiles: Map<string, unknown>
}

type GetSampleDataFileIdParams = {
    step: Step
    type: SampleDataFileType
}

type GetSampleDataFileKeyParams = {
    fileId: string
    fileType: FileType
}

type SaveSampleDataParams = {
    projectId: ProjectId
    flowVersionId: FlowVersionId
    stepName: string
    payload: unknown
    type: SampleDataFileType
}

type SaveSampleDataWithLogParams = SaveSampleDataParams & {
    log: FastifyBaseLogger
}

type UseExistingOrCreateNewSampleIdParams = {
    projectId: ProjectId
    flowVersion: FlowVersion
    step: FlowAction | FlowTrigger
    fileType: FileType
    log: FastifyBaseLogger
}

export { sampleDataService, saveSampleData }
