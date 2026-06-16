import {
    apId,
    DefaultProjectRole,
    PlatformId,
    ProjectId,
    UserId,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import {
    projectMemberRepo,
    projectRoleService,
} from '../project-role/project-role.service'

export async function upsertProjectOwnerMember({
    platformId,
    projectId,
    userId,
}: UpsertProjectOwnerMemberParams): Promise<void> {
    const existingProjectMember = await projectMemberRepo().findOneBy({
        projectId,
        userId,
        platformId,
    })
    const projectRole = await projectRoleService.getOneOrThrow({
        name: DefaultProjectRole.ADMIN,
        platformId,
    })

    await projectMemberRepo().upsert(
        {
            id: existingProjectMember?.id ?? apId(),
            updated: dayjs().toISOString(),
            userId,
            platformId,
            projectId,
            projectRoleId: projectRole.id,
        },
        ['projectId', 'userId', 'platformId'],
    )
}

type UpsertProjectOwnerMemberParams = {
    platformId: PlatformId
    projectId: ProjectId
    userId: UserId
}
