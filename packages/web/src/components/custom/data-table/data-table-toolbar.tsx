import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

type DataTableToolbarProps = {
  children?: React.ReactNode;
};

const DataTableToolbar = (params: DataTableToolbarProps) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between overflow-hidden py-3',
        DASHBOARD_CONTENT_PADDING_X,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {params.children}
      </div>
    </div>
  );
};
DataTableToolbar.displayName = 'DataTableToolbar';

export { DataTableToolbar };
