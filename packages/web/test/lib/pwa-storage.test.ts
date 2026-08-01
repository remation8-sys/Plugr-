import { describe, expect, it } from 'vitest';

import {
  INSTALL_PROMPT_DISMISSED_KEY,
  INSTALL_PROMPT_COOLDOWN_MS,
  clearInstallPromptDismissal,
  rememberInstallPromptDismissal,
  shouldSuppressInstallPrompt,
} from '@/lib/pwa-storage';

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe('PWA install prompt storage', () => {
  it('shows the prompt when it has not been dismissed', () => {
    expect(shouldSuppressInstallPrompt(createStorage())).toBe(false);
  });

  it('suppresses the prompt during the cooldown', () => {
    const storage = createStorage();
    const now = 2_000_000_000_000;
    rememberInstallPromptDismissal(storage, now);

    expect(shouldSuppressInstallPrompt(storage, now + 1_000)).toBe(true);
    expect(storage.getItem(INSTALL_PROMPT_DISMISSED_KEY)).toBe(now.toString());
  });

  it('shows the prompt again after the cooldown', () => {
    const storage = createStorage();
    const now = 2_000_000_000_000;
    rememberInstallPromptDismissal(storage, now);

    expect(
      shouldSuppressInstallPrompt(
        storage,
        now + INSTALL_PROMPT_COOLDOWN_MS + 1,
      ),
    ).toBe(false);
    expect(storage.getItem(INSTALL_PROMPT_DISMISSED_KEY)).toBeNull();
  });

  it('allows the prompt after the dismissal is explicitly reset', () => {
    const storage = createStorage();
    rememberInstallPromptDismissal(storage);
    clearInstallPromptDismissal(storage);

    expect(shouldSuppressInstallPrompt(storage)).toBe(false);
  });

  it('clears malformed dismissal state', () => {
    const storage = createStorage();
    storage.setItem(INSTALL_PROMPT_DISMISSED_KEY, 'not-a-boolean');

    expect(shouldSuppressInstallPrompt(storage)).toBe(false);
    expect(storage.getItem(INSTALL_PROMPT_DISMISSED_KEY)).toBeNull();
  });
});
