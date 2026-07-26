import {
  isNil,
  Permission,
  TemplateTelemetryEventType,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Table2 } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useState } from 'react';

import { recordAccess } from '../../global-search/access-history';
import { GlobalSearchCommand } from '../../global-search/global-search-command';
import { STATIC_PAGES } from '../../global-search/static-pages';
import { ApSidebarItem, SidebarItemType } from '../ap-sidebar-item';
import { AppSidebarHeader } from '../sidebar-header';
import { SidebarHelpAndFeedback } from '../sidebar-help';
import SidebarUsageLimits from '../sidebar-usage-limits';
import { SidebarUser } from '../sidebar-user';

import { ProjectSwitcher } from './project-switcher';

import { McpSvg } from '@/assets/img/custom/mcp';
import { BoxIcon } from '@/components/icons/box';
import { ChartLineIcon } from '@/components/icons/chart-line';
import { CompassIcon } from '@/components/icons/compass';
import { ConnectIcon } from '@/components/icons/connect';
import { HistoryIcon } from '@/components/icons/history';
import { SendIcon } from '@/components/icons/send';
import { ShieldIcon } from '@/components/icons/shield';
import { TrophyIcon } from '@/components/icons/trophy';
import { VariableIcon } from '@/components/icons/variable';
import { WorkflowIcon } from '@/components/icons/workflow';
import { useEmbedding } from '@/components/providers/embed-provider';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import { canUsePlugr, hasMinimumPlugrTier } from '@/features/plugr-billing';
import { projectCollectionUtils } from '@/features/projects';
import { templatesTelemetryApi } from '@/features/templates';
import {
  useAuthorization,
  useIsPlatformAdmin,
} from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';



// McpSvg is a plain function component; ApSidebarItem passes a ref to icons.
const McpIcon = forwardRef<SVGSVGElement, { className?: string }>(
  ({ className }, _ref) => <McpSvg className={className} />,
);
McpIcon.displayName = 'McpIcon';

export function ProjectDashboardSidebar({
  className,
}: { className?: string } = {}) {
  const { embedState } = useEmbedding();
  const { state } = useSidebar();
  const { data: currentUser } = userHooks.useCurrentUser();
  const { project } = projectCollectionUtils.useCurrentProject();
  const { checkAccess } = useAuthorization();
  const plugrLocked = currentUser ? !canUsePlugr(currentUser) : false;
  const analyticsLocked = currentUser
    ? !hasMinimumPlugrTier(currentUser, 'pro')
    : false;

  const handleExploreClick = useCallback(() => {
    templatesTelemetryApi.sendEvent({
      eventType: TemplateTelemetryEventType.EXPLORE_VIEW,
      userId: currentUser?.id,
    });
  }, [currentUser?.id]);

  const recordStaticPageAccess = (href: string, id?: string) => {
    const page = STATIC_PAGES.find(
      (p) => p.href === href && (isNil(id) || p.id === id),
    );
    if (page)
      recordAccess({
        id: page.id,
        type: 'page',
        label: page.label,
        href: page.href,
      });
  };

  const automationsPath =
    authenticationSession.appendProjectRoutePrefix('/automations');

  const productItems: SidebarItemType[] = [
    {
      type: 'link',
      to: '/chat',
      label: t('Plugr'),
      // Plugr AI is shown to all signed-in users (gated/locked by subscription via
      // `locked: plugrLocked` + the route guard), not by Activepieces' chatEnabled flag.
      show: !!currentUser,
      icon: SendIcon,
      hasPermission: true,
      isSubItem: false,
      badge: plugrLocked ? undefined : t('Beta'),
      locked: plugrLocked,
      lockedTooltip: t('Available on Starter plan'),
    },
    {
      type: 'link',
      to: automationsPath,
      label: t('Flows'),
      show: true,
      icon: WorkflowIcon,
      hasPermission: checkAccess(Permission.READ_FLOW),
      isSubItem: false,
      isActive: (loc) =>
        loc.includes('/automations') && !loc.includes('type=table'),
    },
    {
      type: 'link',
      to: `${automationsPath}?type=table`,
      label: t('Tables'),
      show: !embedState.hideTables,
      icon: Table2,
      hasPermission: checkAccess(Permission.READ_TABLE),
      isSubItem: false,
      isActive: (loc) =>
        loc.includes('/automations') && loc.includes('type=table'),
    },
    {
      type: 'link',
      to: authenticationSession.appendProjectRoutePrefix('/mcps'),
      label: t('MCP'),
      show: true,
      icon: McpIcon,
      hasPermission: true,
      isSubItem: false,
    },
  ];

  const miscItems: SidebarItemType[] = [
    {
      type: 'link',
      to: authenticationSession.appendProjectRoutePrefix('/runs'),
      label: t('Runs'),
      show: true,
      icon: HistoryIcon,
      hasPermission: checkAccess(Permission.READ_RUN),
      isSubItem: false,
    },
    {
      type: 'link',
      to: authenticationSession.appendProjectRoutePrefix('/connections'),
      label: t('Connections'),
      show: true,
      icon: ConnectIcon,
      hasPermission: checkAccess(Permission.READ_APP_CONNECTION),
      isSubItem: false,
    },
    {
      type: 'link',
      to: authenticationSession.appendProjectRoutePrefix('/variables'),
      label: t('Variables'),
      show: true,
      icon: VariableIcon,
      hasPermission: checkAccess(Permission.READ_VARIABLE),
      isSubItem: false,
    },
    {
      type: 'link',
      to: authenticationSession.appendProjectRoutePrefix('/releases'),
      label: t('Releases'),
      show: project?.releasesEnabled === true,
      icon: BoxIcon,
      hasPermission: checkAccess(Permission.READ_PROJECT_RELEASE),
      isSubItem: false,
    },
  ];

  const discoverItems: SidebarItemType[] = [
    {
      type: 'link',
      to: '/templates',
      label: t('Explore'),
      show: true,
      icon: CompassIcon,
      hasPermission: true,
      isSubItem: false,
      onClick: () => {
        handleExploreClick();
        recordStaticPageAccess('/templates');
      },
    },
    {
      type: 'link',
      to: '/impact',
      label: t('Impact'),
      icon: ChartLineIcon,
      show: true,
      hasPermission: true,
      isSubItem: false,
      locked: analyticsLocked,
      lockedTooltip: t('Available on Pro plan'),
      onClick: () => recordStaticPageAccess('/impact'),
    },
    {
      type: 'link',
      to: '/leaderboard',
      label: t('Leaderboard'),
      icon: TrophyIcon,
      show: true,
      hasPermission: true,
      isSubItem: false,
      locked: analyticsLocked,
      lockedTooltip: t('Available on Pro plan'),
      onClick: () => recordStaticPageAccess('/leaderboard'),
    },
  ];

  const visible = (items: SidebarItemType[]) =>
    items.filter(
      (item) =>
        item.show !== false &&
        (isNil(item.hasPermission) || item.hasPermission),
    );

  const sections = [
    { label: t('Products'), items: visible(productItems) },
    { label: t('Misc'), items: visible(miscItems) },
    { label: t('Discover'), items: visible(discoverItems) },
  ].filter((section) => section.items.length > 0);

  return (
    !embedState.hideSideNav && (
      <Sidebar
        collapsible="icon"
        id={SIDEBAR_ID}
        className={cn('max-h-[100vh]', className)}
      >
        <AppSidebarHeader />

        <SidebarContent className="overflow-x-hidden">
          <SidebarGroup className="pb-0">
            <ProjectSwitcher />
            <div className="mt-1 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <GlobalSearchCommand />
            </div>
          </SidebarGroup>

          {sections.map((section) => (
            <SidebarGroup key={section.label} className="py-1">
              <SidebarGroupLabel className="text-xs uppercase tracking-wide text-muted-foreground">
                {section.label}
              </SidebarGroupLabel>
              <SidebarMenu>
                {section.items.map((item) => (
                  <ApSidebarItem key={item.label} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter>
          <SidebarHelpAndFeedback />
          {state === 'expanded' && <DelayedSidebarUsageLimits />}
          <SidebarPlatformAdminLink />
          <SidebarUser />
        </SidebarFooter>
      </Sidebar>
    )
  );
}

function DelayedSidebarUsageLimits() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 250);
    return () => clearTimeout(timer);
  }, []);

  return show ? (
    <div>
      <SidebarUsageLimits />
    </div>
  ) : null;
}

function SidebarPlatformAdminLink() {
  const showPlatformAdmin = useIsPlatformAdmin();
  const { embedState } = useEmbedding();

  if (embedState.isEmbedded || !showPlatformAdmin) {
    return null;
  }

  return (
    <SidebarMenu>
      <ApSidebarItem
        type="link"
        to="/platform/projects"
        label={t('Platform Admin')}
        icon={ShieldIcon}
        isSubItem={false}
        show={true}
        hasPermission={true}
        onClick={() => {
          const page = STATIC_PAGES.find(
            (p) =>
              p.href === '/platform/projects' && p.id === 'page-platform-admin',
          );
          if (page)
            recordAccess({
              id: page.id,
              type: 'page',
              label: page.label,
              href: page.href,
            });
        }}
      />
    </SidebarMenu>
  );
}

export const SIDEBAR_ID = 'project-sidebar';
