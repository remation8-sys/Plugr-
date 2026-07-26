import { t } from 'i18next';
import { Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

export function EmptyState({
  onSuggestionClick,
  incognito,
  showFlowCards,
  hasInput,
}: {
  onSuggestionClick: (text: string) => void;
  incognito: boolean;
  showFlowCards: boolean;
  hasInput: boolean;
}) {
  const { data: currentUser } = userHooks.useCurrentUser();
  const firstName = currentUser?.firstName ?? '';
  const isMobile = useIsMobile();

  return (
    <div className="relative pt-10 pb-6 md:pt-8">
      {isMobile && (
        <div
          aria-hidden
          className="bg-hero-glow pointer-events-none absolute inset-x-0 top-0 h-80"
        />
      )}
      <div className="relative mx-auto max-w-3xl px-4 md:px-6">
        <Greeting firstName={firstName} incognito={incognito} />
      </div>
      {!incognito && (
        <div
          className={cn(
            'grid transition-all duration-300 ease-out',
            hasInput
              ? 'grid-rows-[0fr] opacity-0'
              : 'grid-rows-[1fr] opacity-100',
          )}
        >
          <div className="overflow-hidden">
            {showFlowCards && (
              <FlowCards onSuggestionClick={onSuggestionClick} />
            )}
            <div className="mx-auto max-w-3xl px-4 md:px-6">
              <Separator className="my-6" />
              <TextSuggestions onSuggestionClick={onSuggestionClick} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SetupRequiredState() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-20 flex-1 min-w-0">
      <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-muted">
        <Settings className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">
          {t('Set up an AI provider to get started')}
        </h2>
        <p className="text-muted-foreground text-sm max-w-md">
          {t(
            'AI Chat requires an AI provider. Add your provider in the AI settings to start chatting.',
          )}
        </p>
      </div>
      <Button onClick={() => navigate('/platform/setup/ai')} className="gap-2">
        <Settings className="h-4 w-4" />
        {t('Go to AI Settings')}
      </Button>
    </div>
  );
}

export function MessageSkeletons() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 py-4">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-48 rounded-2xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

function Greeting({
  firstName,
  incognito,
}: {
  firstName: string;
  incognito: boolean;
}) {
  return (
    <motion.div
      className="flex flex-col items-start gap-3.5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-balance font-sentient text-3xl font-bold leading-tight md:text-4xl">
        {incognito ? (
          t('Private Chat')
        ) : firstName ? (
          <>
            {t('What should I automate')}
            <br />
            {t('next, {name}?', { name: firstName })} ⚡
          </>
        ) : (
          <>{t('What should I automate next?')} ⚡</>
        )}
      </h1>
      {!incognito && (
        <p className="text-base text-muted-foreground">
          {t("I'm Plugr. Tell me what to automate and I'll handle everything.")}
        </p>
      )}
    </motion.div>
  );
}

function FlowCards({
  onSuggestionClick,
}: {
  onSuggestionClick: (text: string) => void;
}) {
  return (
    <div className="mx-auto mt-6 grid max-w-3xl grid-cols-1 gap-4 px-4 md:grid-cols-3 md:px-6">
      {FLOW_CARDS.map((card, i) => (
        <motion.button
          key={card.title}
          type="button"
          className={cn(
            'group w-full cursor-pointer text-left',
            card.wide && 'md:col-span-2',
          )}
          onClick={() => onSuggestionClick(card.description)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl md:h-[245px] md:aspect-auto">
            <img
              src={card.bgImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              width="928"
              height="696"
              loading="lazy"
              decoding="async"
            />
            <img
              src={card.image}
              alt={card.title}
              loading="lazy"
              className="absolute inset-0 m-auto w-[79%] h-[69%] object-contain transition-transform duration-300 ease-out group-hover:scale-105"
              width="671"
              height="594"
              decoding="async"
            />
          </div>
          <h3 className="mt-3 text-sm font-semibold group-hover:text-primary transition-colors">
            {t(card.title)}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {t(card.description)}
          </p>
        </motion.button>
      ))}
    </div>
  );
}

function TextSuggestions({
  onSuggestionClick,
}: {
  onSuggestionClick: (text: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {TEXT_SUGGESTIONS.map((suggestion, i) => (
        <motion.button
          key={suggestion.title}
          type="button"
          className="flex items-center gap-4 rounded-xl p-2 text-left hover:bg-accent transition-colors cursor-pointer"
          onClick={() => onSuggestionClick(suggestion.description)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
        >
          <div className="w-24 h-16 shrink-0 rounded-xl bg-muted flex items-center justify-center p-2.5">
            <img
              src={suggestion.icon}
              alt=""
              loading="lazy"
              className={cn(
                'max-w-full max-h-full object-contain',
                suggestion.darkIcon && 'dark:hidden',
              )}
              width="54"
              height="41"
              decoding="async"
            />
            {suggestion.darkIcon && (
              <img
                src={suggestion.darkIcon}
                alt=""
                loading="lazy"
                className="max-w-full max-h-full object-contain hidden dark:block"
                width="54"
                height="41"
                decoding="async"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium">{t(suggestion.title)}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {t(suggestion.description)}
            </p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

const FLOW_CARDS: FlowCardData[] = [
  {
    title: 'Clean Up My Inbox',
    description:
      'Find junk and promo emails and clear them out of my inbox automatically',
    image: '/chat-suggestions/card-cleanup-spam.svg',
    bgImage: '/chat-suggestions/card-background-1.svg',
  },
  {
    title: 'Capture and Follow Up Leads',
    description:
      'Save new leads from my forms and send them a personalised follow-up automatically',
    image: '/chat-suggestions/card-lead-enrichment.svg',
    bgImage: '/chat-suggestions/card-background-2.svg',
  },
  {
    title: 'Triage Support Tickets',
    description:
      'Sort incoming support messages and send each to the right person automatically',
    image: '/chat-suggestions/card-triage-support.svg',
    bgImage: '/chat-suggestions/card-background-3.svg',
    wide: true,
  },
];

const TEXT_SUGGESTIONS: TextSuggestionData[] = [
  {
    icon: '/chat-suggestions/icon-route-emails.svg',
    title: 'Route Incoming Emails',
    description:
      'Classify every incoming email by topic and route it to the right person automatically.',
  },
  {
    icon: '/chat-suggestions/icon-sync-contacts.svg',
    title: 'Sync Contacts to CRM',
    description:
      'Sync new contacts from a spreadsheet into my CRM automatically.',
  },
  {
    icon: '/chat-suggestions/icon-plan-crm.svg',
    title: 'Plan Daily Tasks',
    description:
      "Check my deals, find today's top priorities, and build a clear task list for the day.",
  },
  {
    icon: '/chat-suggestions/icon-summarize-emails.svg',
    darkIcon: '/chat-suggestions/icon-summarize-emails-dark.svg',
    title: 'Summarize Daily Emails',
    description:
      "Scan my inbox, find the emails I haven't replied to yet, and flag them for me.",
  },
  {
    icon: '/chat-suggestions/icon-slack-bot.svg',
    title: 'Build a Slack Bot',
    description:
      "Answer my team's questions on Slack using our internal knowledge base.",
  },
  {
    icon: '/chat-suggestions/icon-screen-candidates.svg',
    darkIcon: '/chat-suggestions/icon-screen-candidates-dark.svg',
    title: 'Screen Job Candidates',
    description:
      'Score candidates from a spreadsheet based on their info and write the scores back.',
  },
  {
    icon: '/chat-suggestions/icon-lead-enrichment.svg',
    title: 'Lead Enrichment',
    description:
      'Enrich my leads with full person and company info automatically.',
  },
  {
    icon: '/chat-suggestions/icon-cleanup-spam.svg',
    darkIcon: '/chat-suggestions/icon-cleanup-spam-dark.svg',
    title: 'Cleanup Spam Emails',
    description:
      'Find promotional emails from the last week and move them to spam automatically.',
  },
  {
    icon: '/chat-suggestions/icon-triage-support.svg',
    title: 'Triage Support Tickets',
    description:
      'Read open support tickets, classify by type and urgency, and tag them for the team.',
  },
];

type FlowCardData = {
  title: string;
  description: string;
  image: string;
  bgImage: string;
  wide?: boolean;
};

type TextSuggestionData = {
  icon: string;
  darkIcon?: string;
  title: string;
  description: string;
};
