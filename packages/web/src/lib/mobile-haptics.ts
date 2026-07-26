type HapticFeedback = 'tap' | 'success' | 'error' | 'refresh' | 'longPress';

const HAPTIC_PATTERNS: Record<HapticFeedback, number | number[]> = {
  tap: 8,
  success: [12, 35, 18],
  error: [20, 35, 20, 35, 30],
  refresh: [10, 25, 14],
  longPress: [12, 30, 12],
};

function isHapticFeedbackAvailable() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches &&
    typeof navigator.vibrate === 'function'
  );
}

function trigger(feedback: HapticFeedback) {
  if (!isHapticFeedbackAvailable()) {
    return;
  }

  navigator.vibrate(HAPTIC_PATTERNS[feedback]);
}

const mobileHaptics = {
  tap: () => trigger('tap'),
  success: () => trigger('success'),
  error: () => trigger('error'),
  refresh: () => trigger('refresh'),
  longPress: () => trigger('longPress'),
};

export { mobileHaptics };
