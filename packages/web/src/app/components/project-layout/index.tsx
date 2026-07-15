import { ApEdition, ApFlagId, isNil } from '@activepieces/shared';
import React, { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';

import { ChartLineIcon } from '@/components/icons/chart-line';
import { CompassIcon } from '@/components/icons/compass';
import { TrophyIcon } from '@/components/icons/trophy';
import { useEmbedding } from '@/components/providers/embed-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { PurchaseExtraFlowsDialog } from '@/features/billing';
import { PlugrAppAccessGuard } from '@/features/plugr-billing';
import { projectHooks } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

import { authenticationSession } from '../../../lib/authentication-session';
import {
  GlobalSearchProvider,
  useGlobalSearch,
} from '../global-search/global-search-context';
import { ProjectDashboardSidebar } from '../sidebar/dashboard';

import { MobileBottomNav } from './mobile-bottom-nav';
import { ProjectDashboardLayoutHeader } from './project-dashboard-layout-header';

export type ProjectDashboardLayoutHeaderTab = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  hasPermission: boolean;
  show: boolean;
  beta?: boolean;
};

const ProjectChangedRedirector = ({
  currentProjectId,
  children,
}: {
  currentProjectId: string;
  children: React.ReactNode;
}) => {
  projectHooks.useReloadPageIfProjectIdChanged(currentProjectId);
  return children;
};

export function ProjectDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const currentProjectId = authenticationSession.getProjectId();
  const { t } = useTranslation();
  const location = useLocation();
  const isPlatformPage = location.pathname.includes('/platform/');
  const isEmbedded = useEmbedding().embedState.isEmbedded;
  if (isNil(currentProjectId) || currentProjectId === '') {
    return <Navigate to="/sign-in" replace />;
  }

  const itemsWithoutHeader: ProjectDashboardLayoutHeaderTab[] = [
    {
      to: '/templates',
      label: t('Explore'),
      show: !isEmbedded,
      icon: CompassIcon,
      hasPermission: true,
    },
    {
      to: '/impact',
      label: t('Impact'),
      show: !isEmbedded,
      icon: ChartLineIcon,
      hasPermission: true,
    },
    {
      to: '/leaderboard',
      label: t('Leaderboard'),
      show: !isEmbedded,
      icon: TrophyIcon,
      hasPermission: true,
    },
    {
      to: '/chat',
      label: t('Plugr'),
      show: !isEmbedded,
      icon: CompassIcon,
      hasPermission: true,
    },
  ];

  const hideHeader =
    itemsWithoutHeader.some((item) => location.pathname.includes(item.to)) ||
    isPlatformPage;

  return (
    <ProjectChangedRedirector currentProjectId={currentProjectId}>
      <GlobalSearchProvider>
        <ProjectDashboardLayoutInner
          hideHeader={hideHeader}
          isEmbedded={isEmbedded}
          currentProjectId={currentProjectId}
        >
          {children}
        </ProjectDashboardLayoutInner>
        {edition === ApEdition.CLOUD && <PurchaseExtraFlowsDialog />}
      </GlobalSearchProvider>
    </ProjectChangedRedirector>
  );
}

function ProjectDashboardLayoutInner({
  hideHeader,
  isEmbedded,
  currentProjectId,
  children,
}: {
  hideHeader: boolean;
  isEmbedded: boolean;
  currentProjectId: string;
  children: React.ReactNode;
}) {
  const { open: searchOpen } = useGlobalSearch();
  const isMobile = useIsMobile();

  return (
    <PlugrAppAccessGuard>
      <SidebarProvider hoverMode={!searchOpen}>
        {!isEmbedded && !isMobile && <ProjectDashboardSidebar />}
        <SidebarInset className="flex flex-col h-full overflow-hidden bg-sidebar">
          <div
            className={cn(
              'flex-1 flex flex-col overflow-hidden',
              !isEmbedded && !isMobile && 'pr-3 pt-3 pb-3',
            )}
          >
            <div
              id="dashboard-content-container"
              className={cn(
                'relative flex flex-col h-full bg-background overflow-clip',
                isMobile && 'pt-[env(safe-area-inset-top)]',
                !isEmbedded && !isMobile && 'rounded-xl border shadow-sm',
              )}
            >
              {!hideHeader && (
                <ProjectDashboardLayoutHeader key={currentProjectId} />
              )}
              <div className={cn('flex-1 overflow-auto', isMobile && 'pb-28')}>
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
        {!isEmbedded && isMobile && <MobileBottomNav />}
      </SidebarProvider>
    </PlugrAppAccessGuard>
  );
}
