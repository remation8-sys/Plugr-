import { ApEdition, ApFlagId } from '@activepieces/shared';
import React from 'react';
import { Navigate } from 'react-router-dom';

import { MobilePullToRefresh } from '@/components/custom/mobile-pull-to-refresh';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { PurchaseExtraFlowsDialog } from '@/features/billing/components/active-flows-addon/purchase-active-flows-dialog';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

import { AllowOnlyLoggedInUserOnlyGuard } from './allow-logged-in-user-only-guard';
import { GlobalSearchProvider } from './global-search/global-search-context';
import {
  PlatformMobileBottomNav,
  PlatformMobileHeader,
} from './platform-mobile-navigation';
import { PlatformSidebar } from './sidebar/platform';

function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const showPlatformAdminDashboard = useIsPlatformAdmin();

  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      <GlobalSearchProvider>
        {showPlatformAdminDashboard ? (
          <PlatformLayoutInner>{children}</PlatformLayoutInner>
        ) : (
          <Navigate to="/" />
        )}
        {edition === ApEdition.CLOUD && <PurchaseExtraFlowsDialog />}
      </GlobalSearchProvider>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}

function PlatformLayoutInner({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider open={!isMobile}>
      {!isMobile && <PlatformSidebar />}
      <SidebarInset className="flex h-full flex-col overflow-hidden bg-sidebar">
        <div
          className={cn(
            'flex flex-1 flex-col overflow-hidden',
            isMobile
              ? 'pb-[calc(4rem+env(safe-area-inset-bottom))] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]'
              : 'pb-3 pl-2 pr-2 pt-3',
          )}
        >
          <div
            id="dashboard-content-container"
            className={cn(
              'relative flex h-full flex-col overflow-clip bg-background',
              !isMobile &&
                'rounded-xl border shadow-[2px_0px_4px_-2px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)]',
            )}
          >
            {isMobile && <PlatformMobileHeader />}
            <MobilePullToRefresh className="flex min-h-0 flex-1 flex-col overflow-auto">
              {children}
            </MobilePullToRefresh>
          </div>
        </div>
      </SidebarInset>
      {isMobile && <PlatformMobileBottomNav />}
    </SidebarProvider>
  );
}

export { PlatformLayout };
