import { t } from 'i18next';
import { LoaderCircle, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';

function ResourceLockWidget({
  lockedBy,
  takeOver,
  resourceLabel,
}: ResourceLockWidgetProps) {
  return (
    <div className="absolute top-2 z-40 flex w-full justify-center px-2 md:top-3">
      <div className="z-40 flex min-h-12 w-full animate-fade flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-lg duration-300 md:min-h-11 md:flex-nowrap md:rounded-md md:bg-background/95 md:px-3.5 md:py-1.5 md:shadow-none md:backdrop-blur">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <Lock aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <span className="min-w-0 leading-5">
            {t('{name} is editing this {resource}. This view is read-only.', {
              name: lockedBy.userDisplayName,
              resource: resourceLabel,
            })}
          </span>
        </div>
        <Button
          className="h-11 shrink-0 md:h-8"
          variant="ghost"
          size="sm"
          onClick={takeOver}
        >
          {t('Take Over')}
        </Button>
      </div>
    </div>
  );
}

ResourceLockWidget.displayName = 'ResourceLockWidget';

function ResourceLockAcquiringWidget({
  resourceLabel,
}: {
  resourceLabel: string;
}) {
  return (
    <div className="absolute top-2 z-40 flex w-full justify-center px-2 md:top-3">
      <div className="z-40 flex min-h-12 w-full items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-lg md:min-h-11 md:rounded-md md:bg-background/95 md:px-3.5 md:py-1.5 md:shadow-none md:backdrop-blur">
        <LoaderCircle
          aria-hidden="true"
          className="size-5 shrink-0 animate-spin motion-reduce:animate-none"
        />
        <span>
          {t('Securing this {resource} for editing…', {
            resource: resourceLabel,
          })}
        </span>
      </div>
    </div>
  );
}

ResourceLockAcquiringWidget.displayName = 'ResourceLockAcquiringWidget';
export { ResourceLockAcquiringWidget, ResourceLockWidget };

type ResourceLockWidgetProps = {
  lockedBy: {
    userId: string;
    userDisplayName: string;
  };
  takeOver: () => void;
  resourceLabel: string;
};
