const INSTALL_PROMPT_DISMISSED_KEY = 'plugr:pwa-install-dismissed';

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
): boolean {
  if (!storage) {
    return false;
  }

  try {
    const dismissalState = storage.getItem(INSTALL_PROMPT_DISMISSED_KEY);
    if (dismissalState === null) {
      return false;
    }
    if (dismissalState !== 'true') {
      storage.removeItem(INSTALL_PROMPT_DISMISSED_KEY);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function rememberInstallPromptDismissal(
  storage: PromptStorage | null = getBrowserStorage(),
): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(INSTALL_PROMPT_DISMISSED_KEY, 'true');
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
  clearInstallPromptDismissal,
  rememberInstallPromptDismissal,
  shouldSuppressInstallPrompt,
};
export type { PromptStorage };
