import { createPortal } from 'react-dom';

import { PageLoadingSkeleton } from '@/components/custom/page-loading-skeleton';

export function RouteLoadingBar() {
  const content = (
    <div className="relative h-full min-h-0 w-full">
      <div className="absolute left-0 right-0 top-0 z-50 h-0.5 overflow-hidden bg-primary/20">
        <div className="h-full w-1/4 animate-indeterminate-progress rounded-full bg-primary" />
      </div>
      <PageLoadingSkeleton className="h-full min-h-[22rem] pt-6" />
    </div>
  );

  const container = document.getElementById('dashboard-content-container');
  if (container) {
    return createPortal(content, container);
  }

  return <div className="min-h-dvh w-full">{content}</div>;
}
