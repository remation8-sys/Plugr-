import { ApEdition, ApFlagId } from '@activepieces/shared';
import { MoreHorizontal, Search } from 'lucide-react';
import { ComponentType, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { McpSvg } from '@/assets/img/custom/mcp';
import { BotIcon } from '@/components/icons/bot';
import { FileHeartIcon } from '@/components/icons/file-heart';
import { FileJson2Icon } from '@/components/icons/file-json2';
import { FrameIcon } from '@/components/icons/frame';
import { KeyRoundIcon } from '@/components/icons/key-round';
import { LayoutGridIcon } from '@/components/icons/layout-grid';
import { LogInIcon } from '@/components/icons/log-in';
import { MousePointerClickIcon } from '@/components/icons/mouse-pointer-click';
import { PaletteIcon } from '@/components/icons/palette';
import { PuzzleIcon } from '@/components/icons/puzzle';
import { ReceiptIcon } from '@/components/icons/receipt';
import { ServerIcon } from '@/components/icons/server';
import { Settings2Icon } from '@/components/icons/settings2';
import { SquareDashedBottomCodeIcon } from '@/components/icons/square-dashed-bottom-code';
import { UnplugIcon } from '@/components/icons/unplug';
import { UsersIcon } from '@/components/icons/users';
import { WebhookIcon } from '@/components/icons/webhook';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { determineDefaultRoute } from '@/lib/route-utils';
import { cn } from '@/lib/utils';

import { useGlobalSearch } from './global-search/global-search-context';

function PlatformMobileHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const branding = flagsHooks.useWebsiteBranding();
  const { checkAccess } = useAuthorization();
  const { setOpen: setSearchOpen } = useGlobalSearch();

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b bg-background px-3 md:hidden">
      <Button
        type="button"
        variant="ghost"
        className="h-11 min-w-0 flex-1 justify-start gap-2 px-1.5"
        aria-label={t('Back to app')}
        onClick={() => navigate(determineDefaultRoute(checkAccess))}
      >
        <img
          src={branding.logos.logoIconUrl}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="size-7 shrink-0 object-contain"
          width="28"
          height="28"
          loading="eager"
          decoding="async"
        />
        <span className="truncate text-base font-semibold">
          {branding.websiteName}
        </span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 shrink-0"
        aria-label={t('Search')}
        onClick={() => setSearchOpen(true)}
      >
        <Search className="size-5" aria-hidden="true" />
      </Button>
    </header>
  );
}

function PlatformMobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const { primaryItems, groups } = usePlatformMobileNavigation();
  const isMoreActive = !primaryItems.some((item) =>
    location.pathname.includes(item.matchSegment),
  );

  return (
    <>
      <nav
        aria-label={t('Primary navigation')}
        data-mobile-bottom-nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] md:hidden"
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch">
          {primaryItems.map((item) => {
            const isActive = location.pathname.includes(item.matchSegment);
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-11 min-w-0 flex-1 touch-manipulation flex-col items-center justify-center gap-1 px-1 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary active:bg-muted',
                  isActive && 'text-primary hover:text-primary',
                )}
              >
                {isActive && <ActiveIndicator />}
                <span aria-hidden="true">
                  <Icon className="size-5" />
                </span>
                <span className="max-w-full truncate text-xs font-medium leading-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            aria-current={isMoreActive ? 'page' : undefined}
            aria-label={t('More administration pages')}
            className={cn(
              'relative flex min-h-11 min-w-0 flex-1 touch-manipulation flex-col items-center justify-center gap-1 px-1 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary active:bg-muted',
              isMoreActive && 'text-primary hover:text-primary',
            )}
            onClick={() => setMoreOpen(true)}
          >
            {isMoreActive && <ActiveIndicator />}
            <MoreHorizontal className="size-5" aria-hidden="true" />
            <span className="max-w-full truncate text-xs font-medium leading-none">
              {t('More')}
            </span>
          </button>
        </div>
      </nav>
      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="h-dvh w-screen max-w-none overflow-hidden rounded-none p-0 md:hidden">
          <DialogHeader className="border-b px-4 py-4 text-left">
            <DialogTitle>{t('Administration')}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-[env(safe-area-inset-bottom)]">
            {groups.map((group) => (
              <section key={group.label} className="py-3">
                <h2 className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </h2>
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const itemContent = (
                      <>
                        <span aria-hidden="true">
                          <Icon className="size-5" />
                        </span>
                        <span className="truncate">{item.label}</span>
                        {item.locked && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {t('Locked')}
                          </span>
                        )}
                      </>
                    );

                    return item.locked ? (
                      <div
                        key={item.to}
                        aria-disabled="true"
                        className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground opacity-70"
                      >
                        {itemContent}
                      </div>
                    ) : (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                          'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary active:bg-muted',
                          location.pathname.includes(item.to) &&
                            'bg-primary/10 text-primary',
                        )}
                        onClick={() => setMoreOpen(false)}
                      >
                        {itemContent}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ActiveIndicator() {
  return (
    <span
      className="absolute top-0 h-0.5 w-8 rounded-b-full bg-primary"
      aria-hidden="true"
    />
  );
}

function usePlatformMobileNavigation(): PlatformMobileNavigation {
  const { t } = useTranslation();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  const primaryItems: PlatformPrimaryItem[] = [
    {
      to: '/platform/projects',
      label: t('Projects'),
      icon: LayoutGridIcon,
      matchSegment: '/platform/projects',
    },
    {
      to: '/platform/users',
      label: t('Users'),
      icon: UsersIcon,
      matchSegment: '/platform/users',
    },
    {
      to: '/platform/connections',
      label: t('Connect'),
      icon: UnplugIcon,
      matchSegment: '/platform/connections',
    },
    {
      to: '/platform/setup/pieces',
      label: t('Plugs'),
      icon: PuzzleIcon,
      matchSegment: '/platform/setup/pieces',
    },
  ];

  const groups: PlatformNavigationGroup[] = [
    {
      label: t('General'),
      items: primaryItems.map((item) => ({
        to: item.to,
        label: item.label,
        icon: item.icon,
      })),
    },
    {
      label: t('Setup'),
      items: [
        { to: '/platform/setup/ai', label: t('AI Providers'), icon: BotIcon },
        { to: '/platform/setup/mcp', label: t('MCP Server'), icon: McpSvg },
        {
          to: '/platform/setup/branding',
          label: t('Branding'),
          icon: PaletteIcon,
          locked: !platform.plan.customAppearanceEnabled,
        },
        {
          to: '/platform/setup/connections',
          label: t('Global Connections'),
          icon: UnplugIcon,
          locked: !platform.plan.globalConnectionsEnabled,
        },
        {
          to: '/platform/setup/templates',
          label: t('Templates'),
          icon: LayoutGridIcon,
          locked: !platform.plan.manageTemplatesEnabled,
        },
        {
          to: '/platform/setup/billing',
          label: t('Billing'),
          icon: ReceiptIcon,
          locked: edition === ApEdition.COMMUNITY,
        },
        {
          to: '/platform/security/embed',
          label: t('Embedding'),
          icon: FrameIcon,
          locked: !platform.plan.embeddingEnabled,
        },
      ],
    },
    {
      label: t('Security'),
      items: [
        {
          to: '/platform/security/sso',
          label: t('Single Sign On'),
          icon: LogInIcon,
          locked: !platform.plan.ssoEnabled,
        },
        {
          to: '/platform/security/project-roles',
          label: t('Project Roles'),
          icon: Settings2Icon,
          locked: !platform.plan.projectRolesEnabled,
        },
        {
          to: '/platform/security/api-keys',
          label: t('API Keys'),
          icon: FileJson2Icon,
          locked: !platform.plan.apiKeysEnabled,
        },
        {
          to: '/platform/security/secret-managers',
          label: t('Secret Managers'),
          icon: KeyRoundIcon,
          locked: !platform.plan.secretManagersEnabled,
        },
        {
          to: '/platform/security/audit-logs',
          label: t('Audit Logs'),
          icon: SquareDashedBottomCodeIcon,
          locked: !platform.plan.auditLogEnabled,
        },
      ],
    },
    {
      label: t('Infrastructure'),
      items: [
        {
          to: '/platform/infrastructure/event-destinations',
          label: t('Event Streaming'),
          icon: WebhookIcon,
          locked: !platform.plan.eventStreamingEnabled,
        },
        {
          to: '/platform/infrastructure/workers',
          label: t('Workers'),
          icon: ServerIcon,
        },
        {
          to: '/platform/infrastructure/health',
          label: t('Health'),
          icon: FileHeartIcon,
        },
        {
          to: '/platform/infrastructure/triggers',
          label: t('Triggers'),
          icon: MousePointerClickIcon,
        },
      ],
    },
  ];

  return { primaryItems, groups };
}

type PlatformNavigationItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  locked?: boolean;
};

type PlatformPrimaryItem = PlatformNavigationItem & {
  matchSegment: string;
};

type PlatformNavigationGroup = {
  label: string;
  items: PlatformNavigationItem[];
};

type PlatformMobileNavigation = {
  primaryItems: PlatformPrimaryItem[];
  groups: PlatformNavigationGroup[];
};

export { PlatformMobileBottomNav, PlatformMobileHeader };
