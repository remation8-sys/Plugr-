import { afterEach, describe, expect, it, vi } from 'vitest';

import { browserLocation } from '@/lib/browser-location';

describe('browserLocation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('observes SPA navigation and restores the History methods', () => {
    const events = new EventTarget();
    const location = { pathname: '/flows/flow-id' };
    const history = {
      pushState: (
        _data: unknown,
        _unused: string,
        url?: string | URL | null,
      ) => {
        if (url) {
          location.pathname = url.toString();
        }
      },
      replaceState: (
        _data: unknown,
        _unused: string,
        url?: string | URL | null,
      ) => {
        if (url) {
          location.pathname = url.toString();
        }
      },
    };
    vi.stubGlobal('window', {
      addEventListener: events.addEventListener.bind(events),
      history,
      location,
      removeEventListener: events.removeEventListener.bind(events),
    });
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    const listener = vi.fn();

    const unsubscribe = browserLocation.subscribe(listener);
    window.history.pushState({}, '', '/automations');
    window.history.replaceState({}, '', '/runs');

    expect(listener).toHaveBeenNthCalledWith(1, '/automations');
    expect(listener).toHaveBeenNthCalledWith(2, '/runs');

    unsubscribe();
    expect(window.history.pushState).toBe(originalPushState);
    expect(window.history.replaceState).toBe(originalReplaceState);
  });
});
