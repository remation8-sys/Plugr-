// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { telemetryProviderUtils } from '@/components/providers/telemetry-provider';

describe('telemetryProviderUtils', () => {
  afterEach(() => {
    vi.useRealTimers();
    delete window.requestIdleCallback;
    delete window.cancelIdleCallback;
  });

  it('waits three seconds before requesting idle time', () => {
    vi.useFakeTimers();
    const initialize = vi.fn();
    const requestIdleCallback = vi.fn(() => 23);
    window.requestIdleCallback = requestIdleCallback;
    window.cancelIdleCallback = vi.fn();

    telemetryProviderUtils.scheduleTelemetryInitialization({ initialize });
    vi.advanceTimersByTime(2_999);

    expect(requestIdleCallback).not.toHaveBeenCalled();
    expect(initialize).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(requestIdleCallback).toHaveBeenCalledOnce();
    expect(initialize).not.toHaveBeenCalled();
  });

  it('cancels the deferred idle request before loading telemetry', () => {
    vi.useFakeTimers();
    const initialize = vi.fn();
    window.requestIdleCallback = vi.fn(() => 29);
    window.cancelIdleCallback = vi.fn();

    const cancel = telemetryProviderUtils.scheduleTelemetryInitialization({
      initialize,
    });
    vi.advanceTimersByTime(3_000);
    cancel();

    expect(window.cancelIdleCallback).toHaveBeenCalledWith(29);
    expect(initialize).not.toHaveBeenCalled();
  });

  it('uses the four-second total fallback when idle callbacks are unavailable', () => {
    vi.useFakeTimers();
    const initialize = vi.fn();

    telemetryProviderUtils.scheduleTelemetryInitialization({ initialize });
    vi.advanceTimersByTime(3_999);
    expect(initialize).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(initialize).toHaveBeenCalledOnce();
  });
});
