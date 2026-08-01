import { useEffect, useState } from 'react';

const MOBILE_LAUNCH_SEEN_KEY = 'plugr.mobile-launch.seen';
const MOBILE_LAUNCH_DURATION_MS = 760;

function MobileLaunchScreen() {
  const [visible, setVisible] = useState(shouldShowLaunchScreen);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const timer = window.setTimeout(
      () => setVisible(false),
      MOBILE_LAUNCH_DURATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div
      aria-label="Opening Plugr"
      className="mobile-launch-screen"
      role="status"
    >
      <div className="mobile-launch-screen__glow" aria-hidden="true" />
      <div className="mobile-launch-screen__content">
        <div className="mobile-launch-screen__mark">
          <span className="mobile-launch-screen__orbit" aria-hidden="true" />
          <img
            alt=""
            aria-hidden="true"
            className="mobile-launch-screen__logo"
            decoding="sync"
            height="80"
            loading="eager"
            src="/icons/icon-192.png"
            width="80"
          />
        </div>
        <div className="mobile-launch-screen__signal" aria-hidden="true">
          <span />
        </div>
        <p>Connect. Automate. Move.</p>
      </div>
    </div>
  );
}

function shouldShowLaunchScreen() {
  if (!isStandaloneMobile()) {
    return false;
  }
  try {
    if (window.sessionStorage.getItem(MOBILE_LAUNCH_SEEN_KEY)) {
      return false;
    }
    window.sessionStorage.setItem(MOBILE_LAUNCH_SEEN_KEY, 'true');
  } catch {
    return true;
  }
  return true;
}

function isStandaloneMobile() {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true;
  return standalone && window.matchMedia('(max-width: 767px)').matches;
}

export { MOBILE_LAUNCH_DURATION_MS, MobileLaunchScreen };
