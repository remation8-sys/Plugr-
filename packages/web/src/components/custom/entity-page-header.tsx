import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Standard list-page header: prominent title, muted one-line description,
 * and right-aligned actions (e.g. the primary "New" button).
 */
const EntityPageHeader = ({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-stretch justify-between gap-3 md:flex-row md:items-center',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="break-words text-xl font-semibold tracking-tight md:truncate md:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

EntityPageHeader.displayName = 'EntityPageHeader';

export { EntityPageHeader };
