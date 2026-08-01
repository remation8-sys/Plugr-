import { Permission } from '@activepieces/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { ConnectIcon } from '@/components/icons/connect';
import { HistoryIcon } from '@/components/icons/history';
import { SendIcon } from '@/components/icons/send';
import { WorkflowIcon } from '@/components/icons/workflow';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { MobileMoreMenu } from './mobile-more-menu';
import { MobileMoreNavButton } from './mobile-more-nav-button';

function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const tabs = useMobileNavTabs();
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreActive = MORE_ROUTE_SEGMENTS.some((segment) =>
    location.pathname.includes(segment),
  );

  return (
    <>
      <nav
        aria-label={t('Primary navigation')}
        data-mobile-bottom-nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] backdrop-blur supports-[backdrop-filter]:bg-background/85 md:hidden"
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch">
          {tabs.map((tab) => {
            const isActive = tab.matchSegments.some((segment) =>
              location.pathname.includes(segment),
            );
            const Icon = tab.icon;

            return (
              <Link
                key={tab.to}
                to={tab.to}
                aria-current={isActive ? 'page' : undefined}
                aria-label={tab.accessibleLabel}
                className={cn(
                  'relative flex min-h-11 min-w-0 flex-1 touch-manipulation flex-col items-center justify-center gap-1 px-1 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary active:bg-muted',
                  isActive && 'text-primary hover:text-primary',
                )}
              >
                {isActive && (
                  <span
                    className="absolute top-0 h-0.5 w-8 rounded-b-full bg-primary"
                    aria-hidden="true"
                  />
                )}
                <Icon className="size-5" aria-hidden="true" />
                <span className="max-w-full truncate text-xs font-medium leading-none">
                  {tab.label}
                </span>
              </Link>
            );
          })}
          <MobileMoreNavButton
            active={isMoreActive}
            onClick={() => setMoreOpen(true)}
          />
        </div>
      </nav>
      <MobileMoreMenu open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}

function useMobileNavTabs(): MobileNavTab[] {
  const { t } = useTranslation();
  const { checkAccess } = useAuthorization();
  const tabs: MobileNavTab[] = [
    {
      label: t('Flows'),
      accessibleLabel: t('Flows'),
      icon: WorkflowIcon,
      to: authenticationSession.appendProjectRoutePrefix('/automations'),
      matchSegments: ['/automations', '/flows', '/tables'],
      hasPermission:
        checkAccess(Permission.READ_FLOW) ||
        checkAccess(Permission.READ_TABLE) ||
        checkAccess(Permission.READ_FOLDER),
    },
    {
      label: t('Runs'),
      accessibleLabel: t('Runs'),
      icon: HistoryIcon,
      to: authenticationSession.appendProjectRoutePrefix('/runs'),
      matchSegments: ['/runs'],
      hasPermission: checkAccess(Permission.READ_RUN),
    },
    {
      label: t('AI'),
      accessibleLabel: t('AI'),
      icon: SendIcon,
      to: '/chat',
      matchSegments: ['/chat'],
      hasPermission: true,
    },
    {
      label: t('Connect'),
      accessibleLabel: t('Connect'),
      icon: ConnectIcon,
      to: authenticationSession.appendProjectRoutePrefix('/connections'),
      matchSegments: ['/connections'],
      hasPermission: checkAccess(Permission.READ_APP_CONNECTION),
    },
  ];

  return tabs.filter((tab) => tab.hasPermission);
}

const MORE_ROUTE_SEGMENTS = [
  '/templates',
  '/variables',
  '/mcps',
  '/releases',
  '/impact',
  '/leaderboard',
];

type MobileNavTab = {
  label: string;
  accessibleLabel: string;
  icon: React.ComponentType<{
    className?: string;
    'aria-hidden'?: React.AriaAttributes['aria-hidden'];
  }>;
  to: string;
  matchSegments: string[];
  hasPermission: boolean;
};

export { MobileBottomNav };
