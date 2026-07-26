import { PageLoadingSkeleton } from '@/components/custom/page-loading-skeleton';
import { cn } from '@/lib/utils';

type LoadingScreenProps = {
  brightSpinner?: boolean;
  mode?: 'fullscreen' | 'container';
  message?: string;
};
export const LoadingScreen = ({
  brightSpinner = false,
  mode = 'fullscreen',
  message,
}: LoadingScreenProps) => {
  return (
    <PageLoadingSkeleton
      className={cn(
        mode === 'fullscreen' ? 'min-h-dvh' : 'h-full min-h-[22rem]',
        brightSpinner && 'dark',
      )}
      label={message ?? 'Loading application'}
    />
  );
};
