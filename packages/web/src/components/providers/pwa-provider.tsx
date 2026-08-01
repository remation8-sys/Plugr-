import { WifiOff } from 'lucide-react';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { InstallPrompt } from '@/components/custom/pwa/install-prompt';
import { OfflinePage } from '@/components/custom/pwa/offline-page';
import { UpdatePrompt } from '@/components/custom/pwa/update-prompt';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { authenticationSession } from '@/lib/authentication-session';
import { isNativeApp } from '@/lib/native-app';
import {
  rememberInstallPromptDismissal,
  shouldSuppressInstallPrompt,
} from '@/lib/pwa-storage';
import {
  getPendingPwaUpdate,
  hasPendingPwaUpdate,
  subscribeToPwaUpdates,
} from '@/lib/pwa-update';

const INSTALL_PROMPT_DELAY_MS = 30_000;
const UPDATE_REMINDER_DELAY_MS = 10 * 60 * 1000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandaloneDisplayMode() {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  );
}

function isMobileInstallContext() {
  return window.matchMedia('(max-width: 767px)').matches;
}

function isIosBrowser() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function OfflineNotice({ onOpen }: { onOpen: () => void }) {
  return (
    <div
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-[65] mx-auto flex max-w-lg items-center gap-3 rounded-lg border bg-card p-3 text-card-foreground shadow-lg"
      role="status"
    >
      <WifiOff aria-hidden="true" className="size-5 shrink-0 text-warning" />
      <p className="min-w-0 flex-1 text-sm">
        You are offline. Showing cached data where available.
      </p>
      <Button className="h-11 shrink-0" onClick={onOpen} variant="outline">
        Details
      </Button>
    </div>
  );
}

function OfflineBootstrapProvider({ children }: { children: ReactNode }) {
  const isOnline = useOnlineStatus();
  const startedOffline = useRef(!navigator.onLine).current;
  const isOfflineRoute = window.location.pathname === '/offline';

  if (isOfflineRoute || (startedOffline && !isOnline)) {
    return (
      <OfflinePage
        onRetry={() =>
          isOfflineRoute
            ? window.location.assign('/')
            : window.location.reload()
        }
      />
    );
  }

  return children;
}

function PwaProvider({ children }: { children: ReactNode }) {
  const { embedState } = useEmbedding();
  const isOnline = useOnlineStatus();
  const promptEligibleAt = useRef(Date.now() + INSTALL_PROMPT_DELAY_MS);
  const [hasBeenOnline, setHasBeenOnline] = useState(() => navigator.onLine);
  const [showRecovery, setShowRecovery] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(() =>
    hasPendingPwaUpdate(),
  );

  const installPromptsAllowed =
    !embedState.isEmbedded &&
    !isNativeApp() &&
    !isStandaloneDisplayMode() &&
    isMobileInstallContext() &&
    !shouldSuppressInstallPrompt();
  const iosInstallCandidate = installPromptsAllowed && isIosBrowser();
  const isMobileExperience = isMobileInstallContext();

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      rememberInstallPromptDismissal();
      setInstallPrompt(null);
      setShowInstallPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(
    () =>
      subscribeToPwaUpdates(() => {
        setShowUpdatePrompt(hasPendingPwaUpdate());
      }),
    [],
  );

  useEffect(() => {
    if (
      !isOnline ||
      !installPromptsAllowed ||
      (!installPrompt && !iosInstallCandidate)
    ) {
      setShowInstallPrompt(false);
      return;
    }

    const remainingDelay = Math.max(0, promptEligibleAt.current - Date.now());
    const timer = window.setTimeout(() => {
      setShowInstallPrompt(true);
    }, remainingDelay);

    return () => window.clearTimeout(timer);
  }, [installPrompt, installPromptsAllowed, iosInstallCandidate, isOnline]);

  useEffect(() => {
    if (isOnline) {
      setHasBeenOnline(true);
      setShowRecovery(false);
    }
  }, [isOnline]);

  const dismissInstallPrompt = useCallback(() => {
    rememberInstallPromptDismissal();
    setShowInstallPrompt(false);
  }, []);

  const installApp = useCallback(async () => {
    if (iosInstallCandidate) {
      dismissInstallPrompt();
      return;
    }
    if (!installPrompt) {
      return;
    }

    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      rememberInstallPromptDismissal();
      setInstallPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Unable to open the Plugr install prompt', error);
    }
  }, [dismissInstallPrompt, installPrompt, iosInstallCandidate]);

  const updateApp = useCallback(async () => {
    const pendingUpdate = getPendingPwaUpdate();
    if (pendingUpdate) {
      await pendingUpdate();
    }
  }, []);

  const remindAboutUpdateLater = useCallback(() => {
    setShowUpdatePrompt(false);
    window.setTimeout(() => {
      if (hasPendingPwaUpdate()) {
        setShowUpdatePrompt(true);
      }
    }, UPDATE_REMINDER_DELAY_MS);
  }, []);

  if ((!hasBeenOnline && !isOnline) || showRecovery) {
    return (
      <OfflinePage
        onContinue={showRecovery ? () => setShowRecovery(false) : undefined}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <>
      {children}
      {!isOnline && isMobileExperience && (
        <div className="fixed inset-0 z-[90] bg-background">
          <OfflinePage onRetry={() => window.location.reload()} />
        </div>
      )}
      {!isOnline && !isMobileExperience && (
        <OfflineNotice onOpen={() => setShowRecovery(true)} />
      )}
      {showInstallPrompt && !showUpdatePrompt && isOnline && (
        <InstallPrompt
          avoidBottomNavigation={authenticationSession.isLoggedIn()}
          mode={iosInstallCandidate ? 'ios' : 'native'}
          onDismiss={dismissInstallPrompt}
          onInstall={() => void installApp()}
        />
      )}
      {showUpdatePrompt && isOnline && isMobileExperience && (
        <UpdatePrompt
          avoidBottomNavigation={authenticationSession.isLoggedIn()}
          isEditingFlow={window.location.pathname.includes('/flows/')}
          onLater={remindAboutUpdateLater}
          onUpdate={updateApp}
        />
      )}
    </>
  );
}

export { INSTALL_PROMPT_DELAY_MS, OfflineBootstrapProvider, PwaProvider };
