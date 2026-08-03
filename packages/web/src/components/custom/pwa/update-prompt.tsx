import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type UpdatePromptProps = {
  avoidBottomNavigation: boolean;
  isEditingFlow: boolean;
  onLater: () => void;
  onUpdate: () => Promise<void>;
};

function UpdatePrompt({
  avoidBottomNavigation,
  isEditingFlow,
  onLater,
  onUpdate,
}: UpdatePromptProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateFailed, setUpdateFailed] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const applyUpdate = async () => {
    const builderSaveState = document
      .querySelector<HTMLElement>('[data-builder-save-state]')
      ?.getAttribute('data-builder-save-state');
    if (builderSaveState === 'saving') {
      setBlockedMessage(
        'Plugr is still saving. Try again when saving finishes.',
      );
      return;
    }
    if (
      window.location.pathname.includes('/flows/') &&
      builderSaveState !== 'saved'
    ) {
      setBlockedMessage(
        'Wait for the flow to finish saving, or leave the editor, before updating.',
      );
      return;
    }
    if (builderSaveState === 'error') {
      setBlockedMessage(
        'Reload the saved flow version from the editor before updating Plugr.',
      );
      return;
    }

    setIsUpdating(true);
    setUpdateFailed(false);
    setBlockedMessage(null);

    try {
      await onUpdate();
    } catch (error) {
      console.error('Unable to update Plugr', error);
      setIsUpdating(false);
      setUpdateFailed(true);
    }
  };

  return (
    <section
      aria-labelledby="pwa-update-title"
      className={cn(
        'fixed left-[max(1rem,env(safe-area-inset-left))] right-[max(1rem,env(safe-area-inset-right))] z-[75] rounded-2xl border border-primary/20 bg-card/95 p-4 text-card-foreground shadow-2xl backdrop-blur-xl',
        'md:inset-x-auto md:bottom-6 md:right-6 md:w-[420px]',
        avoidBottomNavigation
          ? 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))]'
          : 'bottom-[calc(1rem+env(safe-area-inset-bottom))]',
      )}
      role="region"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <RefreshCw aria-hidden="true" className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold" id="pwa-update-title">
            Plugr is ready to update
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {isEditingFlow
              ? 'Finish saving, then update here, or leave the editor. Plugr will remind you on the next screen.'
              : 'Reload once to use the newest version of Plugr.'}
          </p>
          <div aria-live="polite" role="status">
            {updateFailed && (
              <p className="mt-2 text-sm text-destructive">
                The update could not start. Check your connection and try again.
              </p>
            )}
            {blockedMessage && (
              <p className="mt-2 text-sm text-warning">{blockedMessage}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          className="h-11 w-20 shrink-0"
          disabled={isUpdating}
          onClick={onLater}
          variant="ghost"
        >
          Later
        </Button>
        <Button
          className="h-11 min-w-0 flex-1 text-xs sm:text-sm"
          disabled={isUpdating}
          onClick={() => void applyUpdate()}
        >
          <RefreshCw
            aria-hidden="true"
            className={cn('size-4', isUpdating && 'animate-spin')}
          />
          {isUpdating ? 'Updating…' : 'Reload and update'}
        </Button>
      </div>
    </section>
  );
}

export { UpdatePrompt };
