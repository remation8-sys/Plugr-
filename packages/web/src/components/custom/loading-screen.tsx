import { LoadingSpinner } from '@/components/custom/spinner';
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
    <div
      className={cn(
        'flex h-screen w-screen flex-col items-center justify-center gap-3',
        {
          'h-full w-full': mode === 'container',
        },
      )}
    >
      <LoadingSpinner
        className={cn({
          'stroke-background!': brightSpinner,
        })}
        isLarge={true}
      ></LoadingSpinner>
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
};
