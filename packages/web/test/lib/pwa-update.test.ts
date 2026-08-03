import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { pwaUpdateStore } from '@/lib/pwa-update';

describe('pwaUpdateStore', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        removeItem: (key: string) => values.delete(key),
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
  });

  afterEach(async () => {
    const pendingUpdate = pwaUpdateStore.getPendingPwaUpdate();
    if (pendingUpdate) {
      await pendingUpdate();
    }
    vi.unstubAllGlobals();
  });

  it('keeps an update pending until it has been applied', async () => {
    const applyUpdate = vi.fn(async () => undefined);
    const listener = vi.fn();
    const unsubscribe = pwaUpdateStore.subscribeToPwaUpdates(listener);

    pwaUpdateStore.setPendingPwaUpdate(applyUpdate);

    expect(pwaUpdateStore.hasPendingPwaUpdate()).toBe(true);
    await pwaUpdateStore.getPendingPwaUpdate()?.();
    expect(applyUpdate).toHaveBeenCalledOnce();
    expect(pwaUpdateStore.hasPendingPwaUpdate()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it('persists the reminder deadline across provider remounts', () => {
    pwaUpdateStore.postponePwaUpdateReminder({
      delayMs: 10_000,
      now: 5_000,
    });

    expect(pwaUpdateStore.getPwaUpdateReminderDelay({ now: 7_500 })).toBe(
      7_500,
    );
    expect(pwaUpdateStore.getPwaUpdateReminderDelay({ now: 15_001 })).toBe(0);
  });

  it('keeps Later authoritative while an update remains pending', () => {
    pwaUpdateStore.setPendingPwaUpdate(async () => undefined);

    expect(pwaUpdateStore.getPwaUpdatePromptSchedule({ now: 5_000 })).toEqual({
      reminderDelay: null,
      shouldShowPrompt: true,
    });

    pwaUpdateStore.postponePwaUpdateReminder({
      delayMs: 10_000,
      now: 5_000,
    });

    expect(pwaUpdateStore.getPwaUpdatePromptSchedule({ now: 7_500 })).toEqual({
      reminderDelay: 7_500,
      shouldShowPrompt: false,
    });
    expect(pwaUpdateStore.getPwaUpdatePromptSchedule({ now: 15_001 })).toEqual({
      reminderDelay: null,
      shouldShowPrompt: true,
    });
  });
});
