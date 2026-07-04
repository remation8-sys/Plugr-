/**
 * Detection for the Plugr native mobile app (the Expo WebView wrapper).
 *
 * The wrapper identifies itself two ways:
 * 1. Appends `PlugrApp/<version>` to the WebView user agent (primary signal,
 *    present on every launch).
 * 2. Loads the site with `?plugrNative=1` (fallback for UA-stripped webviews);
 *    we persist it because redirects drop the query string.
 *
 * Uses raw localStorage on purpose — ApStorage switches to sessionStorage in
 * embed mode and this flag must stay orthogonal to embedding.
 */

const NATIVE_APP_STORAGE_KEY = 'plugr_native_app';
const NATIVE_APP_UA_MARKER = 'PlugrApp';
const NATIVE_APP_QUERY_PARAM = 'plugrNative';

const hasUserAgentMarker = () =>
  typeof navigator !== 'undefined' &&
  navigator.userAgent.includes(NATIVE_APP_UA_MARKER);

const readStoredFlag = () => {
  try {
    return window.localStorage.getItem(NATIVE_APP_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

/** Call once before the router mounts so the query param is captured
 * before any redirect strips it. */
export const detectAndPersistNativeApp = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get(NATIVE_APP_QUERY_PARAM) === '1' || hasUserAgentMarker()) {
      window.localStorage.setItem(NATIVE_APP_STORAGE_KEY, '1');
    }
  } catch {
    // Storage unavailable — UA check in isNativeApp still works.
  }
};

export const isNativeApp = () => hasUserAgentMarker() || readStoredFlag();
