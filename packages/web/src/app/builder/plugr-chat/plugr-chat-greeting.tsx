import { t } from 'i18next';
import { SendIcon } from 'lucide-react';

const SUGGESTIONS = [
  'Explain what this flow does',
  'Suggest improvements to this flow',
  'Help me finish setting it up',
];

/**
 * Empty-state greeting shown instead of the generic chat suggestions when the
 * chat is opened from the builder: Plugr acknowledges the flow it can see.
 */
const PlugrChatGreeting = ({
  flowName,
  stepCount,
  onSuggestionClick,
}: {
  flowName: string;
  stepCount: number;
  onSuggestionClick: (text: string) => void;
}) => {
  return (
    <div className="flex flex-col gap-5 px-6 pb-6 pt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <SendIcon className="size-5" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold">{t('I can see your flow')}</h2>
        <p className="text-sm text-muted-foreground">
          {stepCount === 1
            ? t(
                'You are working on "{name}" (1 step). Tell me what to change and I will edit it right here.',
                { name: flowName },
              )
            : t(
                'You are working on "{name}" ({count} steps). Tell me what to change and I will edit it right here.',
                { name: flowName, count: stepCount },
              )}
        </p>
      </div>
      <div className="flex flex-col items-start gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="rounded-full border px-3.5 py-1.5 text-sm transition-colors hover:bg-accent"
            onClick={() => onSuggestionClick(t(suggestion))}
          >
            {t(suggestion)}
          </button>
        ))}
      </div>
    </div>
  );
};

PlugrChatGreeting.displayName = 'PlugrChatGreeting';
export { PlugrChatGreeting };
