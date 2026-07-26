import { flowStructureUtil, tryCatch } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronLeft, Plus, SendIcon, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { Button } from '@/components/ui/button';
import { flowsApi } from '@/features/flows';
import { hasPlugrAiAccess, PlugrLockedFeature } from '@/features/plugr-billing';
import { useIsMobile } from '@/hooks/use-mobile';
import { userHooks } from '@/hooks/user-hooks';

import { PlugrChatGreeting } from './plugr-chat-greeting';

/**
 * Plugr Chat inside the builder. Mobile renders a full-screen overlay,
 * desktop renders a fixed-width side panel (its parent lays it out next to
 * the canvas). The conversation id lives in the builder store so closing and
 * reopening the panel resumes the same conversation for this flow session.
 */
const PlugrChatPanel = () => {
  const isMobile = useIsMobile();
  const { data: user } = userHooks.useCurrentUser();
  const [
    isPlugrChatOpen,
    setPlugrChatOpen,
    plugrChatConversationId,
    setPlugrChatConversationId,
    applyPlugrChatFlowUpdate,
    flowId,
    flowProjectId,
    flowDisplayName,
    flowTrigger,
  ] = useBuilderStateContext((state) => [
    state.isPlugrChatOpen,
    state.setPlugrChatOpen,
    state.plugrChatConversationId,
    state.setPlugrChatConversationId,
    state.applyPlugrChatFlowUpdate,
    state.flow.id,
    state.flow.projectId,
    state.flowVersion.displayName,
    state.flowVersion.trigger,
  ]);
  // remounts AIChatBox to start a fresh conversation
  const [chatKey, setChatKey] = useState(0);

  const builderContext = useMemo(
    () => ({ flowId, projectId: flowProjectId }),
    [flowId, flowProjectId],
  );

  const stepCount = useMemo(
    () => flowStructureUtil.getAllSteps(flowTrigger).length,
    [flowTrigger],
  );

  // Plugr may have edited the flow server-side during its turn, so pull the
  // latest version into the canvas (guarded inside applyPlugrChatFlowUpdate).
  const handleAssistantTurnFinished = useCallback(() => {
    void tryCatch(() => flowsApi.get(flowId)).then(({ data }) => {
      if (data) {
        applyPlugrChatFlowUpdate(data);
      }
    });
  }, [flowId, applyPlugrChatFlowUpdate]);

  if (!isPlugrChatOpen) {
    return null;
  }

  const aiAccess = hasPlugrAiAccess(user);

  const handleNewChat = () => {
    setPlugrChatConversationId(null);
    setChatKey((k) => k + 1);
  };

  const body = aiAccess ? (
    <div className="flex-1 min-h-0 flex flex-col">
      <AIChatBox
        key={chatKey}
        incognito={false}
        conversationId={plugrChatConversationId}
        onConversationCreated={setPlugrChatConversationId}
        builderContext={builderContext}
        onAssistantTurnFinished={handleAssistantTurnFinished}
        renderEmptyState={(sendMessage) => (
          <PlugrChatGreeting
            flowName={flowDisplayName}
            stepCount={stepCount}
            onSuggestionClick={sendMessage}
          />
        )}
      />
    </div>
  ) : (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <PlugrLockedFeature
        title={t('Build with Plugr AI')}
        description={t(
          'Describe what you want in plain words and Plugr builds the automation for you. Available on the Builder, Pro, and Business plans.',
        )}
        ctaLabel={t('See plans')}
      />
    </div>
  );

  if (isMobile) {
    return (
      <div
        className="fixed inset-x-0 top-[var(--mobile-viewport-offset-top,0px)] z-50 flex h-[var(--mobile-viewport-height,100dvh)] flex-col bg-background pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] animate-in slide-in-from-bottom-4 fade-in duration-200"
        data-mobile-keyboard-viewport
      >
        <div className="flex items-center justify-between gap-2 border-b px-2 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => setPlugrChatOpen(false)}
          >
            <ChevronLeft className="size-4" />
            {t('Back to Builder')}
          </Button>
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <SendIcon className="size-4" />
            {t('Plugr')}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('New chat')}
            disabled={!aiAccess || !plugrChatConversationId}
            className={!aiAccess || !plugrChatConversationId ? 'invisible' : ''}
            onClick={handleNewChat}
          >
            <Plus className="size-4" />
          </Button>
        </div>
        {body}
      </div>
    );
  }

  return (
    <div className="flex h-full w-[380px] shrink-0 flex-col border-l bg-background animate-in slide-in-from-right-4 fade-in duration-200">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <SendIcon className="size-4" />
          {t('Plugr')}
        </div>
        <div className="flex items-center gap-1">
          {aiAccess && plugrChatConversationId && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('New chat')}
              onClick={handleNewChat}
            >
              <Plus className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('Close chat')}
            onClick={() => setPlugrChatOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
      {body}
    </div>
  );
};

PlugrChatPanel.displayName = 'PlugrChatPanel';
export { PlugrChatPanel };
