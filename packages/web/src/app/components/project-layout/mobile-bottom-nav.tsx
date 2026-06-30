import { t } from 'i18next';
import { Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { CompassIcon } from '@/components/icons/compass';
import { SendIcon } from '@/components/icons/send';
import { WorkflowIcon } from '@/components/icons/workflow';
import { cn } from '@/lib/utils';
import { authenticationSession } from '@/lib/authentication-session';

const useMobileNavTabs = () => {
  return [
    {
      label: t('Automations'),
      icon: WorkflowIcon,
      to: authenticationSession.appendProjectRoutePrefix('/automations'),
      matchSegment: '/automations',
    },
    {
      label: t('Plugr'),
      icon: SendIcon,
      to: '/chat',
      matchSegment: '/chat',
    },
    {
      label: t('Explore'),
      icon: CompassIcon,
      to: '/templates',
      matchSegment: '/templates',
    },
    {
      label: t('Settings'),
      icon: Settings,
      to: authenticationSession.appendProjectRoutePrefix('/settings'),
      matchSegment: '/settings',
    },
  ];
};

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const tabs = useMobileNavTabs();

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 pointer-events-none px-4"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.75rem)' }}
    >
      <nav className="pointer-events-auto mx-auto flex h-16 max-w-md items-stretch gap-1 rounded-[26px] border border-border bg-card/80 px-2 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        {tabs.map((tab) => {
          const isActive = location.pathname.includes(tab.matchSegment);
          const Icon = tab.icon;
          return (
            <button
              key={tab.to}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
              onClick={() => navigate(tab.to)}
              className="group flex flex-1 flex-col items-center justify-center gap-1 touch-manipulation active:scale-95 transition-transform duration-100"
            >
              <div
                className={cn(
                  'flex items-center justify-center w-11 h-8 rounded-full transition-all duration-200',
                  isActive
                    ? 'bg-primary/15 glow-primary'
                    : 'bg-transparent',
                )}
              >
                <Icon
                  className={cn(
                    'size-[22px] transition-colors duration-200',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground group-active:text-foreground',
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] font-semibold leading-none tracking-tight transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
