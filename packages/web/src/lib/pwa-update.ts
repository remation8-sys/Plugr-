type ApplyPwaUpdate = () => Promise<void>;

let pendingUpdate: ApplyPwaUpdate | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setPendingPwaUpdate(update: ApplyPwaUpdate) {
  const trackedUpdate = async () => {
    await update();
    if (pendingUpdate === trackedUpdate) {
      pendingUpdate = null;
      clearPwaUpdateReminder();
      emitChange();
    }
  };

  pendingUpdate = trackedUpdate;
  clearPwaUpdateReminder();
  emitChange();
}

function getPendingPwaUpdate() {
  return pendingUpdate;
}

function hasPendingPwaUpdate() {
  return pendingUpdate !== null;
}

function subscribeToPwaUpdates(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function postponePwaUpdateReminder({
  delayMs,
  now = Date.now(),
}: {
  delayMs: number;
  now?: number;
}) {
  try {
    window.localStorage.setItem(PWA_UPDATE_REMINDER_KEY, String(now + delayMs));
  } catch {
    return;
  }
}

function getPwaUpdateReminderDelay({ now = Date.now() } = {}) {
  try {
    const storedValue = window.localStorage.getItem(PWA_UPDATE_REMINDER_KEY);
    const remindAt = Number(storedValue);
    if (!storedValue || !Number.isFinite(remindAt)) {
      return 0;
    }
    return Math.max(0, remindAt - now);
  } catch {
    return 0;
  }
}

function getPwaUpdatePromptSchedule({ now = Date.now() } = {}) {
  if (!hasPendingPwaUpdate()) {
    return {
      reminderDelay: null,
      shouldShowPrompt: false,
    };
  }

  const reminderDelay = getPwaUpdateReminderDelay({ now });
  if (reminderDelay > 0) {
    return {
      reminderDelay,
      shouldShowPrompt: false,
    };
  }

  return {
    reminderDelay: null,
    shouldShowPrompt: true,
  };
}

function clearPwaUpdateReminder() {
  try {
    window.localStorage.removeItem(PWA_UPDATE_REMINDER_KEY);
  } catch {
    return;
  }
}

const pwaUpdateStore = {
  getPendingPwaUpdate,
  getPwaUpdatePromptSchedule,
  getPwaUpdateReminderDelay,
  hasPendingPwaUpdate,
  postponePwaUpdateReminder,
  setPendingPwaUpdate,
  subscribeToPwaUpdates,
};

export { pwaUpdateStore };

const PWA_UPDATE_REMINDER_KEY = 'plugr.pwa-update.remind-at';
