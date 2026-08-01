import { cn } from '@/lib/utils';

const LargeWidgetWrapper = ({
  children,
  containerClassName,
}: {
  children: React.ReactNode;
  containerClassName?: string;
}) => {
  return (
    <div className="absolute top-2 z-40 flex w-full justify-center px-2 md:top-3">
      <div
        className={cn(
          'z-40 flex min-h-12 w-full animate-fade flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background/95 px-3 py-2 text-sm shadow-lg backdrop-blur duration-300 md:min-h-11 md:flex-nowrap md:rounded-md md:px-3.5 md:py-1.5 md:shadow-none',
          containerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
};
LargeWidgetWrapper.displayName = 'LargeWidgetWrapper';
export default LargeWidgetWrapper;
