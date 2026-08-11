import { ApEdition, ApFlagId } from '@activepieces/shared';

import { useEmbedding } from '@/components/providers/embed-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { PurchaseExtraFlowsDialog } from '@/features/billing/components/active-flows-addon/purchase-active-flows-dialog';
import { flagsHooks } from '@/hooks/flags-hooks';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

import {
  GlobalSearchProvider,
  useGlobalSearch,
} from '../global-search/global-search-context';
import { MobileBottomNav } from '../project-layout/mobile-bottom-nav';
import { ProjectDashboardSidebar } from '../sidebar/dashboard';

function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <GlobalSearchProvider>
      <BuilderLayoutInner>{children}</BuilderLayoutInner>
    </GlobalSearchProvider>
  );
}

function BuilderLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { embedState } = useEmbedding();
  const { open: searchOpen } = useGlobalSearch();
  const isMobile = useIsMobile();
  const showMobileNavigation = !embedState.isEmbedded && isMobile;

  return (
    <SidebarProvider hoverMode={!searchOpen} defaultOpen={false}>
      {!embedState.isEmbedded && !isMobile && <ProjectDashboardSidebar />}
      <SidebarInset
        className={cn(
          'flex h-full flex-col overflow-hidden bg-sidebar',
          showMobileNavigation &&
            'pb-[calc(4rem+env(safe-area-inset-bottom))] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]',
        )}
      >
        <div
          className={cn(
            'flex flex-1 flex-col overflow-hidden',
            !embedState.isEmbedded && !isMobile && 'p-1.5',
          )}
        >
          <div
            className={cn(
              'flex h-full flex-col overflow-hidden bg-background',
              embedState.isEmbedded && 'border-l',
              !embedState.isEmbedded &&
                !isMobile &&
                'rounded-xl border shadow-[2px_0px_4px_-2px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)]',
            )}
          >
            {children}
          </div>
        </div>
        {edition === ApEdition.CLOUD && <PurchaseExtraFlowsDialog />}
      </SidebarInset>
      {showMobileNavigation && <MobileBottomNav />}
    </SidebarProvider>
  );
}

export { BuilderLayout };
