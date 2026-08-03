import { lazy, Suspense } from 'react';

import { PageLoadingSkeleton } from '@/components/custom/page-loading-skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

const DesktopBuilderPage = lazy(() =>
  import('./desktop-builder-page').then((module) => ({
    default: module.DesktopBuilderPage,
  })),
);
const MobileBuilderPage = lazy(() =>
  import('./mobile/mobile-builder-page').then((module) => ({
    default: module.MobileBuilderPage,
  })),
);

function BuilderPage() {
  const isMobile = useIsMobile();
  return (
    <Suspense
      fallback={
        <PageLoadingSkeleton
          className="h-full"
          label="Loading flow"
          mode="builder"
        />
      }
    >
      {isMobile ? <MobileBuilderPage /> : <DesktopBuilderPage />}
    </Suspense>
  );
}

BuilderPage.displayName = 'BuilderPage';

export { BuilderPage };
