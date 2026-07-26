import { ProjectMemberWithUser, ProjectRole } from '@activepieces/shared';
import { t } from 'i18next';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/custom/item';
import { UserAvatar } from '@/components/custom/user-avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import { projectRoleQueries } from '@/features/platform-admin';

const USER_SKELETON_IDS = ['one', 'two', 'three', 'four', 'five'];

const ProjectRoleUsersSheet = ({
  projectRole,
  isOpen,
  onOpenChange,
}: ProjectRoleUsersSheetProps) => {
  const { data, isLoading } = projectRoleQueries.useProjectRoleMembers(
    projectRole?.id,
    isOpen && projectRole !== null,
  );

  const users = data?.data ?? [];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 md:w-[600px] md:max-w-[600px]">
        <SheetHeader className="px-4 py-4 md:px-6 border-b shrink-0">
          <SheetTitle className="text-base">
            {projectRole?.name} {t('Role')} {t('Users')}
          </SheetTitle>
          <SheetDescription>
            {t('View the users assigned to this role')}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div
              aria-busy="true"
              aria-label={t('Loading role users')}
              className="space-y-3 p-4 md:p-6"
              role="status"
            >
              {USER_SKELETON_IDS.map((id) => (
                <div className="flex items-center gap-3" key={id}>
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-56 max-w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <Users className="size-14" />
              <p className="text-sm font-medium">{t('No users found')}</p>
              <p className="text-xs">
                {t('Start by assigning users to this role')}
              </p>
            </div>
          ) : (
            <VirtualizedScrollArea
              items={users}
              estimateSize={() => 64}
              getItemKey={(index) => users[index].id}
              renderItem={(member) => renderUserItem(member)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

function renderUserItem(member: ProjectMemberWithUser) {
  const { user, project } = member;
  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <Item size="sm">
      <UserAvatar
        name={fullName}
        email={user.email}
        imageUrl={user.imageUrl}
        size={36}
        disableTooltip
      />
      <ItemContent>
        <ItemTitle>{fullName}</ItemTitle>
        <ItemDescription>
          {user.email}
          {' · '}
          <Link to={`/projects/${project.id}/settings/team`}>
            {project.displayName}
          </Link>
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}

type ProjectRoleUsersSheetProps = {
  projectRole: ProjectRole | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export { ProjectRoleUsersSheet };
