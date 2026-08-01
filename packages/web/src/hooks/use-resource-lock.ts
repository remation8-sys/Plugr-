import {
  ResourceLockedEvent,
  ResourceUnlockedEvent,
  LockResourceResponse,
  WebsocketClientEvent,
  WebsocketServerEvent,
} from '@activepieces/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useSocket } from '@/components/providers/socket-provider';

const EDITOR_SESSION_ID = getOrCreateEditorSessionId();

function useResourceLock({
  resourceId,
  enabled = true,
}: UseResourceLockParams) {
  const socket = useSocket();
  const requestGeneration = useRef(0);
  const desiredResourceId = useRef<string | null>(enabled ? resourceId : null);
  const ownedResourceId = useRef<string | null>(null);
  desiredResourceId.current = enabled ? resourceId : null;
  const [lockState, setLockState] = useState<ResourceLockState>({
    resourceId,
    status: enabled ? 'acquiring' : 'disabled',
    lockedBy: null,
  });

  const acquireLock = useCallback(
    (showAcquiringState = false) => {
      if (!enabled) {
        return;
      }
      if (showAcquiringState) {
        setLockState({ resourceId, status: 'acquiring', lockedBy: null });
      }
      const generation = ++requestGeneration.current;
      socket.emit(
        WebsocketServerEvent.LOCK_RESOURCE,
        { resourceId, editorSessionId: EDITOR_SESSION_ID },
        (response: LockResourceResponse) => {
          const isStale =
            generation !== requestGeneration.current ||
            desiredResourceId.current !== resourceId;
          if (isStale) {
            if (response.acquired && desiredResourceId.current !== resourceId) {
              socket.emit(WebsocketServerEvent.UNLOCK_RESOURCE, {
                resourceId,
                editorSessionId: EDITOR_SESSION_ID,
              });
            }
            return;
          }
          if (response.acquired) {
            ownedResourceId.current = resourceId;
            setLockState({ resourceId, status: 'owned', lockedBy: null });
          } else if (response.lock) {
            ownedResourceId.current = null;
            setLockState({
              resourceId,
              status: 'locked',
              lockedBy: response.lock,
            });
          } else {
            ownedResourceId.current = null;
            setLockState({
              resourceId,
              status: 'acquiring',
              lockedBy: null,
            });
          }
        },
      );
    },
    [enabled, resourceId, socket],
  );

  useEffect(() => {
    if (!enabled) {
      requestGeneration.current += 1;
      ownedResourceId.current = null;
      setLockState({ resourceId, status: 'disabled', lockedBy: null });
      return;
    }

    const handleLocked = (event: ResourceLockedEvent) => {
      const isCurrentEditorSession =
        event.editorSessionId === EDITOR_SESSION_ID;
      if (event.resourceId === resourceId && !isCurrentEditorSession) {
        requestGeneration.current += 1;
        ownedResourceId.current = null;
        setLockState({
          resourceId,
          status: 'locked',
          lockedBy: {
            userId: event.userId,
            userDisplayName: event.userDisplayName,
          },
        });
      }
    };
    const handleUnlocked = (event: ResourceUnlockedEvent) => {
      if (event.resourceId === resourceId) {
        ownedResourceId.current = null;
        acquireLock(true);
      }
    };

    socket.on(WebsocketClientEvent.RESOURCE_LOCKED, handleLocked);
    socket.on(WebsocketClientEvent.RESOURCE_UNLOCKED, handleUnlocked);

    return () => {
      socket.off(WebsocketClientEvent.RESOURCE_LOCKED, handleLocked);
      socket.off(WebsocketClientEvent.RESOURCE_UNLOCKED, handleUnlocked);
    };
  }, [acquireLock, enabled, resourceId, socket]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    acquireLock(true);

    const heartbeat = setInterval(() => {
      acquireLock(false);
    }, 30_000);

    return () => {
      clearInterval(heartbeat);
      requestGeneration.current += 1;
      if (ownedResourceId.current === resourceId) {
        socket.emit(WebsocketServerEvent.UNLOCK_RESOURCE, {
          resourceId,
          editorSessionId: EDITOR_SESSION_ID,
        });
        ownedResourceId.current = null;
      }
      if (desiredResourceId.current === resourceId) {
        desiredResourceId.current = null;
      }
    };
  }, [acquireLock, enabled, resourceId, socket]);

  const takeOver = useCallback(() => {
    const generation = ++requestGeneration.current;
    socket.emit(
      WebsocketServerEvent.LOCK_RESOURCE,
      {
        resourceId,
        editorSessionId: EDITOR_SESSION_ID,
        force: true,
      },
      (response: LockResourceResponse) => {
        const isStale =
          generation !== requestGeneration.current ||
          desiredResourceId.current !== resourceId;
        if (isStale) {
          if (response.acquired && desiredResourceId.current !== resourceId) {
            socket.emit(WebsocketServerEvent.UNLOCK_RESOURCE, {
              resourceId,
              editorSessionId: EDITOR_SESSION_ID,
            });
          }
          return;
        }
        if (response.acquired) {
          ownedResourceId.current = null;
          window.location.reload();
        } else if (response.lock) {
          setLockState({
            resourceId,
            status: 'locked',
            lockedBy: response.lock,
          });
        }
      },
    );
  }, [resourceId, socket]);

  const currentLockState: ResourceLockState =
    lockState.resourceId === resourceId
      ? lockState
      : enabled
      ? { resourceId, status: 'acquiring', lockedBy: null }
      : { resourceId, status: 'disabled', lockedBy: null };

  return {
    lockedBy:
      currentLockState.status === 'locked' ? currentLockState.lockedBy : null,
    lockStatus: currentLockState.status,
    takeOver,
  };
}

export { useResourceLock };

type UseResourceLockParams = {
  resourceId: string;
  enabled?: boolean;
};

type ResourceLockState = {
  resourceId: string;
  status: 'acquiring' | 'owned' | 'locked' | 'disabled';
  lockedBy: LockOwner | null;
};

type LockOwner = {
  userId: string;
  userDisplayName: string;
};

function getOrCreateEditorSessionId(): string {
  const storageKey = 'ap.editor-session-id';
  const editorSessionId = createEditorSessionId();
  if (typeof window === 'undefined') {
    return editorSessionId;
  }

  try {
    const navigation = window.performance?.getEntriesByType?.('navigation')[0];
    const existing = window.sessionStorage.getItem(storageKey);
    if (isReloadNavigation(navigation) && existing) {
      return existing;
    }

    window.sessionStorage.setItem(storageKey, editorSessionId);
  } catch {
    return editorSessionId;
  }

  return editorSessionId;
}

function createEditorSessionId(): string {
  return typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function isReloadNavigation(navigation: PerformanceEntry | undefined): boolean {
  return (
    navigation !== undefined &&
    'type' in navigation &&
    navigation.type === 'reload'
  );
}
