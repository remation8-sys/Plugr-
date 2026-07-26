import { ReactNode } from 'react';

import { ApSidebarToggle } from '@/components/custom/ap-sidebar-toggle';
import { useEmbedding } from '@/components/providers/embed-provider';
import { cn } from '@/lib/utils';

const PageHeader = ({
  title,
  description,
  leftContent,
  rightContent,
  showSidebarToggle = false,
  compactOnMobile = false,
  className = '',
}: PageHeaderProps) => {
  const { embedState } = useEmbedding();

  if (embedState.hidePageHeader) {
    return null;
  }

  return (
    <div
      className={cn(
        'sticky top-0 z-30 flex min-h-14 shrink-0 items-center justify-between border-b bg-background px-4',
        compactOnMobile
          ? 'h-14 flex-nowrap gap-1 py-0'
          : 'flex-wrap gap-3 py-3 md:h-14 md:flex-nowrap md:py-0',
        className,
      )}
    >
      <div
        className={cn(
          'flex min-w-0 grow items-center gap-1',
          !compactOnMobile && 'w-full md:w-auto',
        )}
      >
        {showSidebarToggle && (
          <span className="hidden md:inline-flex">
            <ApSidebarToggle />
          </span>
        )}
        <div className="min-w-0 grow">
          {typeof title === 'string' ? (
            <h1 className="break-words text-base font-semibold">{title}</h1>
          ) : (
            title
          )}
          {description && (
            <span className="block text-sm text-muted-foreground">
              {description}
            </span>
          )}
        </div>
        {leftContent}
      </div>
      {rightContent && (
        <div
          className={cn(
            'min-w-0',
            compactOnMobile ? 'shrink-0' : 'w-full md:w-auto',
          )}
        >
          {rightContent}
        </div>
      )}
    </div>
  );
};

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  showSidebarToggle?: boolean;
  compactOnMobile?: boolean;
  className?: string;
}

export { PageHeader };
