import { t } from 'i18next';
import { SendIcon } from 'lucide-react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Floating entry point to Plugr Chat while building a flow. Rendered inside
 * the canvas area (which is `position: relative`) so it stays anchored to the
 * canvas even when side panels open. Hidden while readonly (run/version view)
 * because the chat edits the draft version.
 */
const PlugrChatWidget = () => {
  const isMobile = useIsMobile();
  const [isPlugrChatOpen, setPlugrChatOpen, readonly] = useBuilderStateContext(
    (state) => [state.isPlugrChatOpen, state.setPlugrChatOpen, state.readonly],
  );

  if (readonly || isPlugrChatOpen) {
    return null;
  }

  if (isMobile) {
    return (
      <Button
        size="icon"
        aria-label={t('Ask Plugr')}
        onClick={() => setPlugrChatOpen(true)}
        className="absolute bottom-4 right-4 z-40 size-14 rounded-full shadow-lg animate-in fade-in zoom-in-95 duration-200"
      >
        <SendIcon className="size-6" />
      </Button>
    );
  }

  return (
    <Button
      aria-label={t('Ask Plugr')}
      onClick={() => setPlugrChatOpen(true)}
      className="absolute bottom-6 right-6 z-40 h-11 gap-2 rounded-full px-4 shadow-lg animate-in fade-in zoom-in-95 duration-200"
    >
      <SendIcon className="size-4" />
      {t('Ask Plugr')}
    </Button>
  );
};

PlugrChatWidget.displayName = 'PlugrChatWidget';
export { PlugrChatWidget };
