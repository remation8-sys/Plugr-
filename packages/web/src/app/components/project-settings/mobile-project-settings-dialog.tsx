import {
  ApFlagId,
  Permission,
  PlatformRole,
  ProjectType,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Bell, GitBranch, Puzzle, Settings, Users } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ProjectAvatar } from '@/app/components/project-avatar';
import { McpSvg } from '@/assets/img/custom/mcp';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { projectCollectionUtils } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

import type { FormValues } from './general';

const GeneralSettings = lazy(async () => {
  const module = await import('./general');
  return { default: module.GeneralSettings };
});
const MembersSettings = lazy(async () => {
  const module = await import('./members');
  return { default: module.MembersSettings };
});
const AlertsSettings = lazy(async () => {
  const module = await import('./alerts');
  return { default: module.AlertsSettings };
});
const MobilePiecesSettings = lazy(async () => {
  const module = await import('./pieces/mobile-pieces-settings');
  return { default: module.MobilePiecesSettings };
});
const EnvironmentSettings = lazy(async () => {
  const module = await import('./environment');
  return { default: module.EnvironmentSettings };
});
const McpServerSettings = lazy(async () => {
  const module = await import('./mcp-server');
  return { default: module.McpServerSettings };
});

function MobileProjectSettingsDialog({
  open,
  onClose,
  initialTab = 'general',
}: MobileProjectSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<MobileSettingsTabId>(initialTab);
  const { checkAccess } = useAuthorization();
  const { project } = projectCollectionUtils.useCurrentProject();
  const { data: showAlerts } = flagsHooks.useFlag(ApFlagId.SHOW_ALERTS);
  const { data: showProjectMembers } = flagsHooks.useFlag(
    ApFlagId.SHOW_PROJECT_MEMBERS,
  );
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const form = useForm<FormValues>({
    defaultValues: {
      projectName: project.displayName,
      icon: project.icon,
      maxConcurrentJobs: project.maxConcurrentJobs,
    },
    disabled: !checkAccess(Permission.WRITE_PROJECT),
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    form.reset({
      projectName: project.displayName,
      icon: project.icon,
      maxConcurrentJobs: project.maxConcurrentJobs,
    });
    setActiveTab(initialTab);
  }, [
    form,
    initialTab,
    open,
    project.displayName,
    project.icon,
    project.maxConcurrentJobs,
  ]);

  const hasGeneralSettings =
    project.type === ProjectType.TEAM ||
    (platform.plan.embeddingEnabled && platformRole === PlatformRole.ADMIN);
  const tabs: MobileSettingsTab[] = [
    {
      id: 'general',
      label: t('General'),
      icon: Settings,
      enabled: hasGeneralSettings,
    },
    {
      id: 'members',
      label: t('Members'),
      icon: Users,
      enabled:
        project.type === ProjectType.TEAM &&
        checkAccess(Permission.READ_PROJECT_MEMBER) &&
        Boolean(showProjectMembers),
    },
    {
      id: 'alerts',
      label: t('Alert Emails'),
      icon: Bell,
      enabled: checkAccess(Permission.READ_ALERT) && Boolean(showAlerts),
    },
    {
      id: 'mcp',
      label: t('MCP Server'),
      icon: McpSvg,
      enabled: true,
    },
    {
      id: 'pieces',
      label: t('Plugs'),
      icon: Puzzle,
      enabled: true,
    },
    {
      id: 'environment',
      label: t('Environment'),
      icon: GitBranch,
      enabled: checkAccess(Permission.READ_PROJECT_RELEASE),
    },
  ];
  const enabledTabs = tabs.filter((tab) => tab.enabled);
  const activeLabel =
    enabledTabs.find((tab) => tab.id === activeTab)?.label ?? t('Plugs');
  const currentIconColor = form.watch('icon')?.color ?? project.icon.color;
  const hasUnsavedChanges = activeTab === 'general' && form.formState.isDirty;

  const handleSave = form.handleSubmit((values) => {
    projectCollectionUtils.update(project.id, {
      displayName: values.projectName,
      externalId: values.externalId,
      icon: values.icon,
      maxConcurrentJobs: values.maxConcurrentJobs,
    });
    toast.success(t('Your changes have been saved.'), { duration: 3000 });
    onClose();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="flex h-dvh max-h-dvh flex-col gap-0 overflow-hidden max-md:p-0">
        <div className="shrink-0 border-b bg-background px-4 pb-3 pr-14 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <DialogTitle>{t('Project settings')}</DialogTitle>
          <div
            aria-label={t('Project settings')}
            className="mt-3 flex gap-1 overflow-x-auto pb-1"
            role="tablist"
          >
            {enabledTabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  aria-selected={selected}
                  className={cn(
                    'h-11 shrink-0 gap-2 px-3',
                    selected && 'bg-accent text-accent-foreground',
                  )}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  type="button"
                  variant="ghost"
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-lg font-bold">{activeLabel}</h2>
            {hasUnsavedChanges && (
              <Badge className="text-muted-foreground" variant="ghost">
                {t('Unsaved changes')}
              </Badge>
            )}
          </div>
          {activeTab === 'general' && (
            <div className="mb-4">
              <ProjectAvatar
                displayName={project.displayName}
                iconColor={currentIconColor}
                projectType={project.type}
                showBackground
                size="md"
              />
            </div>
          )}
          <Suspense fallback={<MobileSettingsContentSkeleton />}>
            <MobileSettingsContent activeTab={activeTab} form={form} />
          </Suspense>
        </div>

        {activeTab === 'general' && (
          <div className="flex shrink-0 gap-3 border-t bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <Button className="h-11 flex-1" onClick={onClose} variant="outline">
              {t('Close')}
            </Button>
            <Button
              className="h-11 flex-1"
              disabled={!form.formState.isDirty}
              onClick={handleSave}
            >
              {t('Save Changes')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MobileSettingsContent({
  activeTab,
  form,
}: MobileSettingsContentProps) {
  switch (activeTab) {
    case 'general':
      return <GeneralSettings form={form} />;
    case 'members':
      return <MembersSettings />;
    case 'alerts':
      return <AlertsSettings />;
    case 'pieces':
      return <MobilePiecesSettings />;
    case 'environment':
      return <EnvironmentSettings />;
    case 'mcp':
      return <McpServerSettings />;
  }
}

function MobileSettingsContentSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label={t('Project settings')}
      className="space-y-3"
      role="status"
    >
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

export { MobileProjectSettingsDialog };

type MobileProjectSettingsDialogProps = {
  open: boolean;
  onClose: () => void;
  initialTab?: MobileSettingsTabId;
};

type MobileSettingsContentProps = {
  activeTab: MobileSettingsTabId;
  form: ReturnType<typeof useForm<FormValues>>;
};

type MobileSettingsTab = {
  id: MobileSettingsTabId;
  label: string;
  icon: React.ComponentType<{
    className?: string;
    'aria-hidden'?: React.AriaAttributes['aria-hidden'];
  }>;
  enabled: boolean;
};

type MobileSettingsTabId =
  | 'general'
  | 'members'
  | 'alerts'
  | 'pieces'
  | 'environment'
  | 'mcp';
