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
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t bg-background pb-safe">
      {tabs.map((tab) => {
        const isActive = location.pathname.includes(tab.matchSegment);
        const Icon = tab.icon;
        return (
          <button
            key={tab.to}
            onClick={() => navigate(tab.to)}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 touch-manipulation',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon className="size-5" />
            <span className="text-[10px] font-medium leading-none">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
