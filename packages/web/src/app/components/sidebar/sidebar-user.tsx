import { isNil } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronsUpDown, LogOut, Moon, Sun, UserCogIcon } from 'lucide-react';
import { useState } from 'react';

import { UserAvatar } from '@/components/custom/user-avatar';
import { useEmbedding } from '@/components/providers/embed-provider';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import { useTheme } from '@/components/providers/theme-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import { Switch } from '@/components/ui/switch';
import { getPlugrTierLabel } from '@/features/plugr-billing';
import { cleanUpWebPushSession } from '@/features/web-push';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import AccountSettingsDialog from '../account-settings';
import { HelpAndFeedback } from '../help-and-feedback';

export function SidebarUser() {
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const { embedState } = useEmbedding();
  const { data: user } = userHooks.useCurrentUser();
  const queryClient = useQueryClient();
  const { reset } = useTelemetry();
  const { state } = useSidebar();
  const { theme, setTheme } = useTheme();
  const isCollapsed = state === 'collapsed';
  const isDarkMode = theme === 'dark';
  if (!user || embedState.isEmbedded) {
    return null;
  }

  const handleLogout = async () => {
    await cleanUpWebPushSession();
    userHooks.invalidateCurrentUser(queryClient);
    authenticationSession.logOut();
    reset();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu modal>
          <DropdownMenuTrigger asChild className="w-full">
            <SidebarMenuButton className="h-12! pl-2! group-data-[collapsible=icon]:h-10! group-data-[collapsible=icon]:pl-2!">
              <div className="size-[24px] shrink-0 overflow-hidden flex items-center justify-center rounded-full">
                <UserAvatar
                  className={cn('size-full object-cover', {
                    'scale-150': isNil(user.imageUrl),
                  })}
                  name={user.firstName + ' ' + user.lastName}
                  email={user.email}
                  imageUrl={user.imageUrl}
                  size={24}
                  disableTooltip={true}
                />
              </div>

              {!isCollapsed && (
                <>
                  <div className="grid min-w-0 flex-1 leading-tight">
                    <span className="truncate text-sm font-medium">
                      {user.firstName + ' ' + user.lastName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 shrink-0" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg z-999"
            side="top"
            align="start"
            sideOffset={10}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="size-8 shrink-0 overflow-hidden rounded-full">
                  <UserAvatar
                    className="size-full object-cover"
                    name={user.firstName + ' ' + user.lastName}
                    email={user.email}
                    imageUrl={user.imageUrl}
                    size={32}
                    disableTooltip={true}
                  />
                </div>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user.firstName + ' ' + user.lastName}
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                  <TierBadge tier={user.subscriptionTier} />
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
              >
                {isDarkMode ? (
                  <Moon className="w-4 h-4 mr-2" />
                ) : (
                  <Sun className="w-4 h-4 mr-2" />
                )}
                {t('Dark Mode')}
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? 'dark' : 'light')
                  }
                  onClick={(e) => e.stopPropagation()}
                  className="ml-auto"
                />
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setAccountSettingsOpen(true)}>
                <UserCogIcon className="w-4 h-4 mr-2" />
                {t('Account Settings')}
              </DropdownMenuItem>

              <HelpAndFeedback />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void handleLogout()}>
              <LogOut className="w-4 h-4 mr-2" />
              {t('Log out')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <AccountSettingsDialog
        open={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
      />
    </SidebarMenu>
  );
}

function TierBadge({
  tier,
  compact = false,
}: {
  tier: Parameters<typeof getPlugrTierLabel>[0];
  compact?: boolean;
}) {
  const isBusiness = tier === 'business';
  const isTrial = tier === 'trial';
  return (
    <span
      className={cn(
        'w-fit rounded px-1.5 py-0.5 text-xs font-medium leading-none',
        compact && 'mt-0.5',
        isTrial && 'bg-muted text-muted-foreground',
        !isTrial && !isBusiness && 'bg-primary/10 text-primary',
        isBusiness &&
          'border border-primary/40 bg-primary/10 text-primary shadow-[0_0_10px_rgba(34,211,238,0.28)]',
      )}
    >
      {getPlugrTierLabel(tier)}
    </span>
  );
}
