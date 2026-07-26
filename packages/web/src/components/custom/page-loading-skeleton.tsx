import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function PageLoadingSkeleton({
  className,
  label = 'Loading content',
  mode = 'page',
}: PageLoadingSkeletonProps) {
  if (mode === 'builder') {
    return (
      <div
        aria-busy="true"
        aria-label={label}
        className={cn('h-full min-h-0 w-full bg-background p-4', className)}
        role="status"
      >
        <span className="sr-only">{label}</span>
        <div className="flex h-full min-h-[22rem] flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-9 w-40 max-w-[55%]" />
            <Skeleton className="h-11 w-28" />
          </div>
          <Skeleton className="min-h-0 flex-1 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      aria-busy="true"
      aria-label={label}
      className={cn('w-full bg-background p-4 sm:p-6', className)}
      role="status"
    >
      <span className="sr-only">{label}</span>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-56 max-w-[70%]" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              className="space-y-4 rounded-lg border border-border p-4"
              key={index}
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { PageLoadingSkeleton };

type PageLoadingSkeletonProps = {
  className?: string;
  label?: string;
  mode?: 'builder' | 'page';
};
