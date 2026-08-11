import { ApEdition, ApFlagId, isNil } from '@activepieces/shared';
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { MobilePullToRefresh } from '@/components/custom/mobile-pull-to-refresh';
import { useEmbedding } from '@/components/providers/embed-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { PurchaseExtraFlowsDialog } from '@/features/billing/components/active-flows-addon/purchase-active-flows-dialog';
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

import { MobileAppHeader } from './mobile-app-header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { ProjectDashboardLayoutHeader } from './project-dashboard-layout-header';

const pagesWithoutDesktopHeader = [
  '/templates',
  '/impact',
  '/leaderboard',
  '/chat',
];

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

function ProjectDashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const currentProjectId = authenticationSession.getProjectId();
  const location = useLocation();
  const isPlatformPage = location.pathname.includes('/platform/');
  const isEmbedded = useEmbedding().embedState.isEmbedded;

  if (isNil(currentProjectId) || currentProjectId === '') {
    return <Navigate to="/sign-in" replace />;
  }

  const hideDesktopHeader =
    pagesWithoutDesktopHeader.some((path) =>
      location.pathname.includes(path),
    ) || isPlatformPage;

  return (
    <ProjectChangedRedirector currentProjectId={currentProjectId}>
      <GlobalSearchProvider>
        <ProjectDashboardLayoutInner
          hideDesktopHeader={hideDesktopHeader}
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
  hideDesktopHeader,
  isEmbedded,
  currentProjectId,
  children,
}: {
  hideDesktopHeader: boolean;
  isEmbedded: boolean;
  currentProjectId: string;
  children: React.ReactNode;
}) {
  const { open: searchOpen } = useGlobalSearch();
  const isMobile = useIsMobile();

  return (
    <SidebarProvider hoverMode={!searchOpen}>
      {!isEmbedded && !isMobile && <ProjectDashboardSidebar />}
      <SidebarInset className="flex h-full flex-col overflow-hidden bg-sidebar">
        <div
          className={cn(
            'flex flex-1 flex-col overflow-hidden',
            !isEmbedded && !isMobile && 'pb-3 pr-3 pt-3',
          )}
        >
          <div
            id="dashboard-content-container"
            className={cn(
              'relative flex h-full flex-col overflow-clip bg-background',
              isMobile &&
                'pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]',
              !isEmbedded && !isMobile && 'rounded-xl border shadow-sm',
            )}
          >
            {!isEmbedded && isMobile && <MobileAppHeader />}
            {!isEmbedded && !isMobile && !hideDesktopHeader && (
              <ProjectDashboardLayoutHeader key={currentProjectId} />
            )}
            <MobilePullToRefresh
              className={cn(
                'min-h-0 flex-1 overflow-auto',
                !isEmbedded &&
                  isMobile &&
                  'pb-[calc(4rem+env(safe-area-inset-bottom))]',
              )}
            >
              {children}
            </MobilePullToRefresh>
          </div>
        </div>
      </SidebarInset>
      {!isEmbedded && isMobile && <MobileBottomNav />}
    </SidebarProvider>
  );
}

export { ProjectDashboardLayout };
