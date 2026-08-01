import { RefreshCw, WifiOff } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

type OfflinePageProps = {
  onContinue?: () => void;
  onRetry?: () => void;
};

function OfflinePage({ onContinue, onRetry }: OfflinePageProps) {
  const [stillOffline, setStillOffline] = useState(false);

  const handleRetry = () => {
    if (navigator.onLine) {
      if (onRetry) {
        onRetry();
      } else {
        window.location.reload();
      }
      return;
    }

    setStillOffline(true);
  };

  return (
    <main className="dark flex min-h-dvh items-center justify-center bg-background px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] text-foreground">
      <div className="w-full max-w-md text-center">
        <img
          alt="Plugr"
          className="mx-auto size-14 rounded-xl"
          decoding="async"
          height="56"
          loading="eager"
          src="/icons/icon-96.png"
          width="56"
        />

        <div className="mx-auto mt-8 flex size-14 items-center justify-center rounded-full bg-muted">
          <WifiOff
            aria-hidden="true"
            className="size-7 text-muted-foreground"
          />
        </div>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          You are offline
        </h1>
        <p className="mt-3 text-base leading-6 text-muted-foreground">
          Editing is paused so your automation cannot drift from the server.
          Reconnect to continue safely. Your saved work is unchanged.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button className="h-12 px-6" onClick={handleRetry}>
            <RefreshCw aria-hidden="true" className="size-4" />
            Try again
          </Button>
          {onContinue && (
            <Button
              className="h-12 px-6"
              onClick={onContinue}
              variant="outline"
            >
              Use cached app
            </Button>
          )}
        </div>

        <p
          aria-live="polite"
          className="mt-4 min-h-5 text-sm text-muted-foreground"
          role="status"
        >
          {stillOffline
            ? 'No connection yet. Check your network and retry.'
            : ''}
        </p>
      </div>
    </main>
  );
}

export default OfflinePage;
export { OfflinePage };
