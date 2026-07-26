import { Download, Share, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type InstallPromptProps = {
  mode: 'native' | 'ios';
  avoidBottomNavigation: boolean;
  onDismiss: () => void;
  onInstall: () => void;
};

function InstallPrompt({
  mode,
  avoidBottomNavigation,
  onDismiss,
  onInstall,
}: InstallPromptProps) {
  const isIos = mode === 'ios';
  const title = isIos ? 'Add Plugr to your Home Screen' : 'Install Plugr';
  const description = isIos
    ? 'Add Plugr to your home screen for the best experience. In Safari, tap Share, then choose Add to Home Screen.'
    : 'Add Plugr to your home screen for the best experience.';

  return (
    <section
      aria-labelledby="pwa-install-title"
      className={cn(
        'fixed left-[max(1rem,env(safe-area-inset-left))] right-[max(1rem,env(safe-area-inset-right))] z-[70] rounded-lg border bg-card p-4 text-card-foreground shadow-lg',
        'md:inset-x-auto md:right-6 md:bottom-6 md:w-[420px]',
        avoidBottomNavigation
          ? 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))]'
          : 'bottom-[calc(1rem+env(safe-area-inset-bottom))]',
      )}
      role="region"
    >
      <Button
        aria-label="Dismiss install prompt"
        className="absolute right-2 top-2 size-11"
        onClick={onDismiss}
        size="icon"
        variant="ghost"
      >
        <X aria-hidden="true" className="size-5" />
      </Button>

      <div className="flex items-start gap-3 pr-10">
        <img
          alt=""
          className="size-12 shrink-0 rounded-lg"
          height="48"
          src="/icons/icon-96.png"
          width="48"
          loading="eager"
          decoding="async"
        />
        <div className="min-w-0">
          <h2 className="text-base font-semibold" id="pwa-install-title">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button className="h-11" onClick={onDismiss} variant="ghost">
          Not now
        </Button>
        <Button className="h-11" onClick={onInstall}>
          {isIos ? (
            <Share aria-hidden="true" className="size-4" />
          ) : (
            <Download aria-hidden="true" className="size-4" />
          )}
          {isIos ? 'Got it' : 'Install'}
        </Button>
      </div>
    </section>
  );
}

export { InstallPrompt };
