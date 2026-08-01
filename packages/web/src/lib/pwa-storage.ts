const INSTALL_PROMPT_DISMISSED_KEY = 'plugr:pwa-install-dismissed';
const INSTALL_PROMPT_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

type PromptStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function getBrowserStorage(): PromptStorage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function shouldSuppressInstallPrompt(
  storage: PromptStorage | null = getBrowserStorage(),
  now = Date.now(),
): boolean {
  if (!storage) {
    return false;
  }

  try {
    const dismissalState = storage.getItem(INSTALL_PROMPT_DISMISSED_KEY);
    if (dismissalState === null) {
      return false;
    }
    const dismissedAt = Number(dismissalState);
    if (!Number.isFinite(dismissedAt)) {
      storage.removeItem(INSTALL_PROMPT_DISMISSED_KEY);
      return false;
    }
    if (now - dismissedAt < INSTALL_PROMPT_COOLDOWN_MS) {
      return true;
    }
    storage.removeItem(INSTALL_PROMPT_DISMISSED_KEY);
    return false;
  } catch {
    return false;
  }
}

function rememberInstallPromptDismissal(
  storage: PromptStorage | null = getBrowserStorage(),
  now = Date.now(),
): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(INSTALL_PROMPT_DISMISSED_KEY, now.toString());
  } catch {
    // Storage can be unavailable in private browsing or restricted embeds.
  }
}

function clearInstallPromptDismissal(
  storage: PromptStorage | null = getBrowserStorage(),
): void {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(INSTALL_PROMPT_DISMISSED_KEY);
  } catch {
    // Storage can be unavailable in private browsing or restricted embeds.
  }
}

export {
  INSTALL_PROMPT_DISMISSED_KEY,
  INSTALL_PROMPT_COOLDOWN_MS,
  clearInstallPromptDismissal,
  rememberInstallPromptDismissal,
  shouldSuppressInstallPrompt,
};
export type { PromptStorage };
