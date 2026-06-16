import { ProjectWithLimits } from '@activepieces/shared';
import { t } from 'i18next';
import { Plus } from 'lucide-react';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { PlusIcon } from '@/components/icons/plus';
import { Button } from '@/components/ui/button';
import { SidebarMenuButton } from '@/components/ui/sidebar-shadcn';

import { NewProjectDialog } from './new-project-dialog';

function IconVariant({
  onCreate,
}: {
  onCreate?: (project: ProjectWithLimits) => void;
}) {
  return (
    <NewProjectDialog onCreate={onCreate}>
      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent">
        <Plus />
      </Button>
    </NewProjectDialog>
  );
}

function FullVariant() {
  return (
    <NewProjectDialog>
      <AnimatedIconButton icon={PlusIcon} iconSize={16} size="sm">
        {t('New Project')}
      </AnimatedIconButton>
    </NewProjectDialog>
  );
}

function SidebarMenuVariant({
  onCreate,
}: {
  onCreate?: (project: ProjectWithLimits) => void;
}) {
  return (
    <NewProjectDialog onCreate={onCreate}>
      <SidebarMenuButton className="text-muted-foreground gap-2">
        <Plus className="size-4" />
        <span>{t('Add team project')}</span>
      </SidebarMenuButton>
    </NewProjectDialog>
  );
}

export function CreateProjectButton({
  variant,
  onCreate,
}: {
  variant: 'icon' | 'full' | 'sidebar-menu';
  onCreate?: (project: ProjectWithLimits) => void;
}) {
  if (variant === 'icon') {
    return <IconVariant onCreate={onCreate} />;
  }
  if (variant === 'sidebar-menu') {
    return <SidebarMenuVariant onCreate={onCreate} />;
  }
  return <FullVariant />;
}
