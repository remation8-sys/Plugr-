import { PlatformRole, ProjectType } from '@activepieces/shared';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { SettingsIcon } from '@/components/icons/settings';
import { Button } from '@/components/ui/button';
import { projectCollectionUtils } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { determineDefaultRoute } from '@/lib/route-utils';

import { useGlobalSearch } from '../global-search/global-search-context';
import { ProjectSettingsDialog } from '../project-settings';

function MobileAppHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const branding = flagsHooks.useWebsiteBranding();
  const { project } = projectCollectionUtils.useCurrentProject();
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const { checkAccess } = useAuthorization();
  const { setOpen: setSearchOpen } = useGlobalSearch();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const settingsInitialTab =
    project.type === ProjectType.TEAM ||
    (platform.plan.embeddingEnabled && platformRole === PlatformRole.ADMIN)
      ? 'general'
      : 'pieces';

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 md:hidden">
        <Button
          type="button"
          variant="ghost"
          className="h-11 min-w-0 flex-1 justify-start gap-2 px-1.5"
          aria-label={t('Go to home')}
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
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label={t('Search')}
            onClick={() => setSearchOpen(true)}
          >
            <Search className="size-5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label={t('Project settings')}
            onClick={() => setSettingsOpen(true)}
          >
            <SettingsIcon className="size-5" size={20} aria-hidden="true" />
          </Button>
        </div>
      </header>
      <ProjectSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialTab={settingsInitialTab}
        initialValues={{
          projectName: project.displayName,
        }}
      />
    </>
  );
}

export { MobileAppHeader };
