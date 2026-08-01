import { Permission, supportUrl } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Boxes,
  Compass,
  LifeBuoy,
  LogOut,
  Rocket,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  UserCog,
  Variable,
  X,
} from 'lucide-react';
import { lazy, Suspense, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { UserAvatar } from '@/components/custom/user-avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { cleanUpWebPushSession } from '@/features/web-push';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

const AccountSettingsDialog = lazy(async () => {
  const module = await import('../account-settings');
  return { default: module.default };
});

function MobileMoreMenu({ open, onOpenChange }: MobileMoreMenuProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { checkAccess } = useAuthorization();
  const { data: user } = userHooks.useCurrentUser();
  const { data: projects } = projectCollectionUtils.useAll();
  const { project: currentProject } =
    projectCollectionUtils.useCurrentProject();
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);

  const menuItems = useMemo(
    () =>
      [
        {
          label: t('Explore templates'),
          description: t('Start from a proven automation'),
          icon: Compass,
          to: '/templates',
          enabled: true,
        },
        {
          label: t('Variables'),
          description: t('Reusable values for your flows'),
          icon: Variable,
          to: authenticationSession.appendProjectRoutePrefix('/variables'),
          enabled: checkAccess(Permission.READ_VARIABLE),
        },
        {
          label: t('MCP Server'),
          description: t('Connect AI tools to Plugr'),
          icon: Bot,
          to: authenticationSession.appendProjectRoutePrefix('/mcps'),
          enabled: true,
        },
        {
          label: t('Releases'),
          description: t('Review published project changes'),
          icon: Rocket,
          to: authenticationSession.appendProjectRoutePrefix('/releases'),
          enabled:
            currentProject.releasesEnabled === true &&
            checkAccess(Permission.READ_PROJECT_RELEASE),
        },
        {
          label: t('Impact'),
          description: t('See the work Plugr has handled'),
          icon: Sparkles,
          to: '/impact',
          enabled: true,
        },
        {
          label: t('Leaderboard'),
          description: t('See how your team is automating'),
          icon: Trophy,
          to: '/leaderboard',
          enabled: true,
        },
      ].filter((item) => item.enabled),
    [checkAccess, currentProject.releasesEnabled, t],
  );

  async function handleLogout() {
    await cleanUpWebPushSession();
    userHooks.invalidateCurrentUser(queryClient);
    authenticationSession.logOut();
  }

  function selectProject(projectId: string) {
    projectCollectionUtils.setCurrentProject(projectId);
    onOpenChange(false);
    navigate('/projects/' + projectId + '/automations');
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex h-dvh max-h-dvh w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 max-md:p-0 md:hidden"
          showCloseButton={false}
        >
          <div className="flex h-[calc(4rem+env(safe-area-inset-top))] shrink-0 items-center gap-3 border-b border-border px-4 pt-[env(safe-area-inset-top)]">
            <DialogTitle className="min-w-0 flex-1 text-lg font-semibold">
              {t('More')}
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 rounded-xl"
              aria-label={t('Close')}
              onClick={() => onOpenChange(false)}
            >
              <X aria-hidden="true" className="size-5" />
            </Button>
          </div>

          <div
            className="flex-1 overflow-y-auto px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4"
            data-mobile-scroll
          >
            {user && (
              <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={user.firstName + ' ' + user.lastName}
                    email={user.email}
                    imageUrl={user.imageUrl}
                    size={48}
                    disableTooltip
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 h-11 w-full justify-start rounded-xl"
                  onClick={() => {
                    onOpenChange(false);
                    setAccountSettingsOpen(true);
                  }}
                >
                  <UserCog aria-hidden="true" className="size-4" />
                  {t('Account settings')}
                </Button>
              </section>
            )}

            {projects.length > 0 && (
              <section className="mt-6">
                <SectionHeading
                  icon={Boxes}
                  label={t('Projects')}
                  detail={getProjectName(currentProject)}
                />
                <div className="mt-2 space-y-1">
                  {projects.map((project) => {
                    const isCurrent = project.id === currentProject.id;
                    return (
                      <button
                        type="button"
                        key={project.id}
                        className={cn(
                          'flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/30 active:bg-muted',
                          isCurrent && 'bg-primary/10 text-primary',
                        )}
                        onClick={() => selectProject(project.id)}
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-foreground">
                          {getProjectName(project).charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {getProjectName(project)}
                        </span>
                        {isCurrent && (
                          <span className="text-xs font-medium">
                            {t('Current')}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="mt-6">
              <SectionHeading icon={SlidersHorizontal} label={t('Workspace')} />
              <div className="mt-2 grid grid-cols-1 gap-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname.includes(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        'flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 outline-none transition-[border-color,background-color,transform] hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99] active:bg-muted',
                        active && 'border-primary/40 bg-primary/[0.04]',
                      )}
                      onClick={() => onOpenChange(false)}
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon aria-hidden="true" className="size-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-foreground">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="mt-6 space-y-2">
              <a
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/30"
                href={supportUrl}
                rel="noreferrer"
                target="_blank"
              >
                <LifeBuoy aria-hidden="true" className="size-5" />
                {t('Help and feedback')}
              </a>
              <button
                type="button"
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-destructive outline-none transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive/30"
                onClick={() => void handleLogout()}
              >
                <LogOut aria-hidden="true" className="size-5" />
                {t('Log out')}
              </button>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {accountSettingsOpen && (
        <Suspense fallback={<AccountSettingsSkeleton />}>
          <AccountSettingsDialog
            open={accountSettingsOpen}
            onClose={() => setAccountSettingsOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}

function SectionHeading({ icon: Icon, label, detail }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-2 px-1">
      <Icon aria-hidden className="size-4 text-muted-foreground" />
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </h2>
      {detail && (
        <span className="ml-auto max-w-40 truncate text-xs text-muted-foreground">
          {detail}
        </span>
      )}
    </div>
  );
}

function AccountSettingsSkeleton() {
  return (
    <div
      aria-label="Loading account settings"
      className="fixed inset-0 z-[100] space-y-4 bg-background p-4 pt-[max(1rem,env(safe-area-inset-top))]"
      role="status"
    >
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  );
}

type MobileMoreMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type SectionHeadingProps = {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  label: string;
  detail?: string;
};

export { MobileMoreMenu };
