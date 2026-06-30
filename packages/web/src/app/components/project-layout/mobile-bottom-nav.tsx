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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t border-border/40 bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map((tab) => {
        const isActive = location.pathname.includes(tab.matchSegment);
        const Icon = tab.icon;
        return (
          <button
            key={tab.to}
            aria-current={isActive ? 'page' : undefined}
            aria-label={tab.label}
            onClick={() => navigate(tab.to)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 touch-manipulation"
          >
            <div
              className={cn(
                'flex items-center justify-center w-12 h-7 rounded-full transition-colors duration-150',
                isActive ? 'bg-primary/10' : 'bg-transparent',
              )}
            >
              <Icon
                className={cn(
                  'size-6 transition-colors duration-150',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              />
            </div>
            <span
              className={cn(
                'text-[11px] font-medium leading-none transition-colors duration-150',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
