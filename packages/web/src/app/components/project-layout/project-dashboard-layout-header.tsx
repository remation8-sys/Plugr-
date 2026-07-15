import { Permission } from '@activepieces/shared';
import { t } from 'i18next';
import { Table2 } from 'lucide-react';
import { ComponentType, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { McpSvg } from '@/assets/img/custom/mcp';
import { BoxIcon } from '@/components/icons/box';
import { ConnectIcon } from '@/components/icons/connect';
import { HistoryIcon } from '@/components/icons/history';
import { VariableIcon } from '@/components/icons/variable';
import { WorkflowIcon } from '@/components/icons/workflow';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { projectCollectionUtils } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { useIsMobile } from '@/hooks/use-mobile';
import { authenticationSession } from '@/lib/authentication-session';

import { ProjectDashboardPageHeader } from './project-dashboard-page-header';

import { ProjectDashboardLayoutHeaderTab } from '.';

type AnimatedIconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

const AnimatedTab = ({
  tab,
  isActive,
  onClick,
}: {
  tab: ProjectDashboardLayoutHeaderTab;
  isActive: boolean;
  onClick: () => void;
}) => {
  const iconRef = useRef<AnimatedIconHandle>(null);
  const IconComponent = tab.icon as React.ForwardRefExoticComponent<
    {
      className?: string;
      size?: number;
    } & React.RefAttributes<AnimatedIconHandle>
  >;

  return (
    <TabsTrigger
      value={tab.to}
      variant="outline"
      className="pb-3"
      onClick={onClick}
      data-state={isActive ? 'active' : 'inactive'}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
    >
      <IconComponent ref={iconRef} size={16} className="mr-2" />
      {tab.label}
      {tab.beta && (
        <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary">
          Beta
        </span>
      )}
    </TabsTrigger>
  );
};

type PageTitleInfo = {
  label: string;
  icon: ComponentType<{ className?: string; size?: number }>;
};

const getPageTitle = (
  pathname: string,
  search: string,
): PageTitleInfo | null => {
  if (pathname.includes('/automations')) {
    return search.includes('type=table')
      ? { label: t('Tables'), icon: Table2 }
      : { label: t('Flows'), icon: WorkflowIcon };
  }
  if (pathname.includes('/runs')) {
    return { label: t('Runs'), icon: HistoryIcon };
  }
  if (pathname.includes('/connections')) {
    return { label: t('Connections'), icon: ConnectIcon };
  }
  if (pathname.includes('/variables')) {
    return { label: t('Variables'), icon: VariableIcon };
  }
  if (pathname.includes('/releases')) {
    return { label: t('Releases'), icon: BoxIcon };
  }
  if (pathname.includes('/mcp')) {
    return { label: t('MCP Server'), icon: McpSvg };
  }
  return null;
};

const PageTitleContent = ({ title }: { title: PageTitleInfo }) => {
  const Icon = title.icon;
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground" />
      <span className="text-sm font-medium">{title.label}</span>
    </div>
  );
};

export const ProjectDashboardLayoutHeader = () => {
  const { project } = projectCollectionUtils.useCurrentProject();
  const { checkAccess } = useAuthorization();
  const { embedState } = useEmbedding();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isEmbedded = embedState.isEmbedded;

  // Desktop: navigation lives in the sidebar, the header only shows the
  // current page title. Mobile keeps the tab bar (its sidebar never renders).
  if (!isMobile) {
    const pageTitle = getPageTitle(location.pathname, location.search);
    return (
      <div className="flex flex-col">
        {!isEmbedded && (
          <ProjectDashboardPageHeader
            titleOverride={
              pageTitle ? <PageTitleContent title={pageTitle} /> : undefined
            }
          />
        )}
      </div>
    );
  }

  const primaryTabs: ProjectDashboardLayoutHeaderTab[] = [
    {
      to: authenticationSession.appendProjectRoutePrefix('/automations'),
      label: t('Automations'),
      icon: WorkflowIcon,
      hasPermission: checkAccess(Permission.READ_FLOW),
      show: true,
    },
  ];

  const secondaryTabs: ProjectDashboardLayoutHeaderTab[] = [
    {
      to: authenticationSession.appendProjectRoutePrefix('/runs'),
      label: t('Runs'),
      icon: HistoryIcon,
      hasPermission: checkAccess(Permission.READ_RUN),
      show: true,
    },
    {
      to: authenticationSession.appendProjectRoutePrefix('/connections'),
      label: t('Connections'),
      icon: ConnectIcon,
      hasPermission: checkAccess(Permission.READ_APP_CONNECTION),
      show: true,
    },
    {
      to: authenticationSession.appendProjectRoutePrefix('/variables'),
      label: t('Variables'),
      icon: VariableIcon,
      hasPermission: checkAccess(Permission.READ_VARIABLE),
      show: true,
    },
    {
      to: authenticationSession.appendProjectRoutePrefix('/releases'),
      icon: BoxIcon,
      label: t('Releases'),
      hasPermission:
        project.releasesEnabled &&
        checkAccess(Permission.READ_PROJECT_RELEASE) &&
        !isEmbedded,
      show: project.releasesEnabled,
    },
  ];

  const visiblePrimaryTabs = primaryTabs.filter(
    (tab) => tab.show && tab.hasPermission,
  );
  const visibleSecondaryTabs = secondaryTabs.filter(
    (tab) => tab.show && tab.hasPermission,
  );

  return (
    <div className="flex flex-col">
      {!isEmbedded && <ProjectDashboardPageHeader />}
      {!embedState.hideSideNav && (
        <Tabs className="px-3 pt-2 border-b overflow-x-auto scrollbar-none">
          <TabsList variant="outline" className="flex-nowrap">
            {visiblePrimaryTabs.map((tab) => (
              <AnimatedTab
                key={tab.to}
                tab={tab}
                isActive={location.pathname.includes(tab.to)}
                onClick={() => navigate(tab.to)}
              />
            ))}
            {visiblePrimaryTabs.length > 0 &&
              visibleSecondaryTabs.length > 0 && (
                <Separator
                  orientation="vertical"
                  className="mx-2 h-5 self-center mb-2"
                />
              )}
            {visibleSecondaryTabs.map((tab) => (
              <AnimatedTab
                key={tab.to}
                tab={tab}
                isActive={location.pathname.includes(tab.to)}
                onClick={() => navigate(tab.to)}
              />
            ))}
          </TabsList>
        </Tabs>
      )}
    </div>
  );
};

ProjectDashboardLayoutHeader.displayName = 'ProjectDashboardLayoutHeader';

export default ProjectDashboardLayoutHeader;
