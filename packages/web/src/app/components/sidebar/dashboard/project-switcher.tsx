import {
  isNil,
  PlatformRole,
  PROJECT_COLOR_PALETTE,
  ProjectType,
  ProjectWithLimits,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronsUpDown, Plus, User } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { SearchInput } from '@/components/custom/search-input';
import { SettingsIcon } from '@/components/icons/settings';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import {
  getProjectName,
  NewProjectDialog,
  projectCollectionUtils,
} from '@/features/projects';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

import { recordAccess } from '../../global-search/access-history';
import { ProjectSettingsDialog } from '../../project-settings';

const SEARCH_THRESHOLD = 7;

function ProjectMark({
  project,
  className,
}: {
  project: ProjectWithLimits;
  className?: string;
}) {
  const projectName = getProjectName(project);
  if (!isNil(project.icon) && project.type === ProjectType.TEAM) {
    const palette = PROJECT_COLOR_PALETTE[project.icon.color];
    return (
      <Avatar
        className={cn(
          'size-[18px] shrink-0 text-sm font-bold flex items-center justify-center rounded-[4px]',
          className,
        )}
        style={{
          backgroundColor: palette.color,
          color: palette.textColor,
        }}
      >
        <span className="scale-75">{projectName.charAt(0).toUpperCase()}</span>
      </Avatar>
    );
  }
  return <User className={cn('size-4 shrink-0', className)} />;
}

export function ProjectSwitcher() {
  const { data: projects } = projectCollectionUtils.useAll();
  const { project: currentProject } =
    projectCollectionUtils.useCurrentProject();
  const { data: currentUser } = userHooks.useCurrentUser();
  const { state } = useSidebar();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isCollapsed = state === 'collapsed';
  const canCreateProject = currentUser?.platformRole === PlatformRole.ADMIN;
  const showSearch = projects.length > SEARCH_THRESHOLD;

  const displayProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return projects;
    }
    return projects.filter((project) =>
      getProjectName(project).toLowerCase().includes(query),
    );
  }, [projects, searchQuery]);

  const handleProjectSelect = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        const palette = project.icon
          ? PROJECT_COLOR_PALETTE[project.icon.color]
          : null;
        const name = getProjectName(project);
        recordAccess({
          id: `project-${projectId}`,
          type: 'project',
          label: name,
          href: `/projects/${projectId}/automations`,
          iconBgColor: palette?.color,
          iconTextColor: palette?.textColor,
          iconLetter: name.charAt(0).toUpperCase(),
        });
      }
      projectCollectionUtils.setCurrentProject(projectId);
      navigate(`/projects/${projectId}/automations`);
      setMenuOpen(false);
    },
    [navigate, projects],
  );

  if (isNil(currentProject)) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex items-center gap-1">
        <DropdownMenu
          open={menuOpen}
          onOpenChange={(open) => {
            setMenuOpen(open);
            if (!open) {
              setSearchQuery('');
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="h-10! flex-1 group-data-[collapsible=icon]:h-10!">
              <ProjectMark project={currentProject} />
              {!isCollapsed && (
                <>
                  <span className="truncate flex-1 text-left text-sm font-medium">
                    {getProjectName(currentProject)}
                  </span>
                  <ChevronsUpDown className="ml-auto size-3.5! shrink-0 text-muted-foreground" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 rounded-lg z-60"
            align="start"
            side="right"
            sideOffset={6}
          >
            <div className="px-2 py-1.5">
              <p className="text-xs text-muted-foreground">{t('Projects')}</p>
            </div>
            {showSearch && (
              <div className="px-2 pb-2">
                <SearchInput
                  placeholder={t('Search projects...')}
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="h-8"
                  autoFocus
                />
              </div>
            )}
            <ScrollArea viewPortClassName="max-h-[320px]">
              {displayProjects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  className="gap-2 p-2 cursor-pointer"
                >
                  <ProjectMark project={project} />
                  <span className="truncate flex-1">
                    {getProjectName(project)}
                  </span>
                  <Check
                    className={cn(
                      'ml-auto size-4 shrink-0',
                      currentProject.id === project.id
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                  />
                </DropdownMenuItem>
              ))}
              {displayProjects.length === 0 && (
                <div className="px-2 py-2 text-sm text-muted-foreground">
                  {t('No projects found.')}
                </div>
              )}
            </ScrollArea>
            {canCreateProject && (
              <>
                <DropdownMenuSeparator />
                <NewProjectDialog
                  onCreate={(project) => {
                    setMenuOpen(false);
                    navigate(`/projects/${project.id}/flows`);
                  }}
                >
                  <DropdownMenuItem
                    className="gap-2 p-2 cursor-pointer"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Plus className="size-4" />
                    {t('New Project')}
                  </DropdownMenuItem>
                </NewProjectDialog>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={t('Project settings')}
            onClick={() => setSettingsOpen(true)}
          >
            <SettingsIcon size={16} />
          </Button>
        )}
      </SidebarMenuItem>
      <ProjectSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialValues={{
          projectName: currentProject?.displayName,
        }}
      />
    </SidebarMenu>
  );
}
