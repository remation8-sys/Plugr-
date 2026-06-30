import { ApEdition, ApFlagId, isNil } from '@activepieces/shared';
import { Zap } from 'lucide-react';
import React, { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { ChartLineIcon } from '@/components/icons/chart-line';
import { CompassIcon } from '@/components/icons/compass';
import { TrophyIcon } from '@/components/icons/trophy';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { PurchaseExtraFlowsDialog } from '@/features/billing';
import {
  getTrialDaysRemaining,
  PlugrAppAccessGuard,
} from '@/features/plugr-billing';
import { projectHooks } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

import { authenticationSession } from '../../../lib/authentication-session';
import {
  GlobalSearchProvider,
  useGlobalSearch,
} from '../global-search/global-search-context';
import { ProjectDashboardSidebar } from '../sidebar/dashboard';
import { useIsMobile } from '@/hooks/use-mobile';

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

function TrialBanner() {
  const { data: user } = userHooks.useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  if (!user || location.pathname.startsWith('/pricing')) {
    return null;
  }
  if (user.subscriptionStatus !== 'trial' || !user.trialEndsAt) {
    return null;
  }
  const daysRemaining = getTrialDaysRemaining(user);
  if (daysRemaining === null) {
    return null;
  }
  return (
    <div className="flex items-center justify-between gap-3 border-b bg-muted/35 px-4 py-2 text-sm">
      <div className="flex min-w-0 items-center gap-2">
        <Zap className="size-4 text-primary" />
        <span className="truncate font-medium">
          {daysRemaining === 1
            ? '1 day left in your free trial'
            : `${daysRemaining} days left in your free trial`}
        </span>
      </div>
      <Button size="xs" onClick={() => navigate('/pricing')}>
        Upgrade
      </Button>
    </div>
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
              !isEmbedded && !isMobile && 'pr-2 pt-3 pb-3',
            )}
          >
            <div
              id="dashboard-content-container"
              className={cn(
                'relative flex flex-col h-full bg-background overflow-clip',
                !isEmbedded &&
                  !isMobile &&
                  'rounded-xl shadow-[2px_0px_4px_-2px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)] border',
              )}
            >
              {!hideHeader && (
                <ProjectDashboardLayoutHeader key={currentProjectId} />
              )}
              <TrialBanner />
              <div className={cn('flex-1 overflow-auto', isMobile && 'pb-16')}>
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
