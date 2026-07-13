import { ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { BookOpen, ChevronRight, CircleHelp, History } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import { flagsHooks } from '@/hooks/flags-hooks';

export function SidebarHelpAndFeedback() {
  const { data: showCommunity } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_COMMUNITY,
  );
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="text-muted-foreground hover:text-foreground">
              <CircleHelp className="size-4" />
              {!isCollapsed && (
                <>
                  <span className="text-sm">{t('Help & Feedback')}</span>
                  <ChevronRight className="ml-auto size-3.5" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[220px] rounded-lg z-60"
            side="right"
            align="end"
            sideOffset={8}
          >
            <DropdownMenuItem asChild>
              <Link
                to="https://plugr.cloud"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full cursor-pointer"
              >
                <BookOpen className="size-4" />
                <span>{t('Documentation')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                to="https://github.com/activepieces/activepieces/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full cursor-pointer"
              >
                <History className="size-4" />
                <span>{t('Changelog')}</span>
              </Link>
            </DropdownMenuItem>
            {showCommunity && (
              <>
                <div className="flex text-xs text-muted-foreground items-center gap-2 px-2 py-1">
                  <span>{t('Need Help?')}</span>
                </div>
                <DropdownMenuItem asChild>
                  <Link
                    to="mailto:support@plugr.cloud"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 w-full cursor-pointer"
                  >
                    <CircleHelp className="size-4" />
                    <span>{t('Community Support')}</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
