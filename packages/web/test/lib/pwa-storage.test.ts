import { describe, expect, it } from 'vitest';

import {
  INSTALL_PROMPT_DISMISSED_KEY,
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

  it('keeps the prompt dismissed across future visits', () => {
    const storage = createStorage();
    rememberInstallPromptDismissal(storage);

    expect(shouldSuppressInstallPrompt(storage)).toBe(true);
    expect(storage.getItem(INSTALL_PROMPT_DISMISSED_KEY)).toBe('true');
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
