type ApplyPwaUpdate = () => Promise<void>;

let pendingUpdate: ApplyPwaUpdate | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setPendingPwaUpdate(update: ApplyPwaUpdate) {
  pendingUpdate = update;
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

export {
  getPendingPwaUpdate,
  hasPendingPwaUpdate,
  setPendingPwaUpdate,
  subscribeToPwaUpdates,
};
