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
        'flex flex-wrap items-center justify-between gap-x-4 gap-y-2',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
};

EntityPageHeader.displayName = 'EntityPageHeader';
export { EntityPageHeader };
