const listeners = new Set<(pathname: string) => void>();
let removeLocationObserver: (() => void) | null = null;

function getPathname() {
  return window.location.pathname;
}

function subscribe(listener: (pathname: string) => void) {
  if (!removeLocationObserver) {
    removeLocationObserver = installLocationObserver();
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && removeLocationObserver) {
      removeLocationObserver();
      removeLocationObserver = null;
    }
  };
}

function installLocationObserver() {
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  function emitLocationChange() {
    const pathname = getPathname();
    listeners.forEach((listener) => listener(pathname));
  }

  function patchedPushState(
    data: unknown,
    unused: string,
    url?: string | URL | null,
  ) {
    originalPushState.call(window.history, data, unused, url);
    emitLocationChange();
  }

  function patchedReplaceState(
    data: unknown,
    unused: string,
    url?: string | URL | null,
  ) {
    originalReplaceState.call(window.history, data, unused, url);
    emitLocationChange();
  }

  window.history.pushState = patchedPushState;
  window.history.replaceState = patchedReplaceState;
  window.addEventListener('popstate', emitLocationChange);

  return () => {
    if (window.history.pushState === patchedPushState) {
      window.history.pushState = originalPushState;
    }
    if (window.history.replaceState === patchedReplaceState) {
      window.history.replaceState = originalReplaceState;
    }
    window.removeEventListener('popstate', emitLocationChange);
  };
}

const browserLocation = {
  getPathname,
  subscribe,
};

export { browserLocation };
