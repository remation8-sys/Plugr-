import { useEffect } from 'react';

import { MobileLaunchScreen } from '@/components/custom/pwa/mobile-launch-screen';
import { mobileHaptics } from '@/lib/mobile-haptics';

const MOBILE_BREAKPOINT = 768;
const KEYBOARD_THRESHOLD = 120;
const FOCUSABLE_INPUT_SELECTOR =
  'input:not([type="hidden"]), textarea, select, [contenteditable="true"]';
const TAPPABLE_SELECTOR =
  'button, a[href], [role="button"], [role="tab"], [role="menuitem"], input[type="button"], input[type="submit"]';

function MobileExperienceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const visualViewport = window.visualViewport;
    const mobileMediaQuery = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
    );
    let animationFrameId: number | null = null;
    let lastViewportMetrics: MobileViewportMetrics | null = null;
    let mobileMetricsApplied = false;

    function applyViewportMetrics() {
      animationFrameId = null;
      if (!mobileMediaQuery.matches) {
        if (mobileMetricsApplied) {
          clearViewportMetrics(root);
          mobileMetricsApplied = false;
          lastViewportMetrics = null;
        }
        return;
      }

      const viewportHeight = Math.round(
        visualViewport?.height ?? window.innerHeight,
      );
      const viewportOffsetTop = Math.round(visualViewport?.offsetTop ?? 0);
      const keyboardHeight = Math.max(
        0,
        window.innerHeight - viewportHeight - viewportOffsetTop,
      );
      const keyboardOpen = keyboardHeight > KEYBOARD_THRESHOLD;
      const nextMetrics = {
        keyboardHeight,
        keyboardOpen,
        viewportHeight,
        viewportOffsetTop,
      };

      if (areViewportMetricsEqual(lastViewportMetrics, nextMetrics)) {
        return;
      }

      root.style.setProperty('--mobile-keyboard-height', `${keyboardHeight}px`);
      root.style.setProperty('--mobile-viewport-height', `${viewportHeight}px`);
      root.style.setProperty(
        '--mobile-viewport-offset-top',
        `${viewportOffsetTop}px`,
      );
      root.toggleAttribute('data-mobile-keyboard-open', keyboardOpen);
      mobileMetricsApplied = true;
      lastViewportMetrics = nextMetrics;
    }

    function scheduleViewportMetricsUpdate() {
      if (animationFrameId !== null) {
        return;
      }
      animationFrameId = window.requestAnimationFrame(applyViewportMetrics);
    }

    function handleDocumentClick(event: MouseEvent) {
      if (!mobileMediaQuery.matches || !(event.target instanceof Element)) {
        return;
      }

      const interactiveElement = event.target.closest(TAPPABLE_SELECTOR);
      if (
        !interactiveElement ||
        interactiveElement.hasAttribute('disabled') ||
        interactiveElement.getAttribute('aria-disabled') === 'true'
      ) {
        return;
      }

      mobileHaptics.tap();
    }

    function handleFocusIn(event: FocusEvent) {
      if (
        !mobileMediaQuery.matches ||
        !(event.target instanceof HTMLElement) ||
        !event.target.matches(FOCUSABLE_INPUT_SELECTOR)
      ) {
        return;
      }

      const focusedElement = event.target;
      window.setTimeout(() => {
        const viewportTop = visualViewport?.offsetTop ?? 0;
        const viewportBottom =
          viewportTop + (visualViewport?.height ?? window.innerHeight);
        const rect = focusedElement.getBoundingClientRect();
        const isObscured =
          rect.top < viewportTop + 16 || rect.bottom > viewportBottom - 16;

        if (isObscured) {
          focusedElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        }
      }, 250);
    }

    applyViewportMetrics();
    window.addEventListener('resize', scheduleViewportMetricsUpdate);
    mobileMediaQuery.addEventListener('change', scheduleViewportMetricsUpdate);
    visualViewport?.addEventListener('resize', scheduleViewportMetricsUpdate);
    visualViewport?.addEventListener('scroll', scheduleViewportMetricsUpdate);
    document.addEventListener('click', handleDocumentClick, true);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      window.removeEventListener('resize', scheduleViewportMetricsUpdate);
      mobileMediaQuery.removeEventListener(
        'change',
        scheduleViewportMetricsUpdate,
      );
      visualViewport?.removeEventListener(
        'resize',
        scheduleViewportMetricsUpdate,
      );
      visualViewport?.removeEventListener(
        'scroll',
        scheduleViewportMetricsUpdate,
      );
      document.removeEventListener('click', handleDocumentClick, true);
      document.removeEventListener('focusin', handleFocusIn);
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      clearViewportMetrics(root);
    };
  }, []);

  return (
    <>
      {children}
      <MobileLaunchScreen />
    </>
  );
}

function areViewportMetricsEqual(
  current: MobileViewportMetrics | null,
  next: MobileViewportMetrics,
) {
  return (
    current?.keyboardHeight === next.keyboardHeight &&
    current.keyboardOpen === next.keyboardOpen &&
    current.viewportHeight === next.viewportHeight &&
    current.viewportOffsetTop === next.viewportOffsetTop
  );
}

function clearViewportMetrics(root: HTMLElement) {
  root.removeAttribute('data-mobile-keyboard-open');
  root.style.removeProperty('--mobile-keyboard-height');
  root.style.removeProperty('--mobile-viewport-height');
  root.style.removeProperty('--mobile-viewport-offset-top');
}

export { MobileExperienceProvider };

type MobileViewportMetrics = {
  keyboardHeight: number;
  keyboardOpen: boolean;
  viewportHeight: number;
  viewportOffsetTop: number;
};
