import {
  ApFlagId,
  isNil,
  TelemetryEvent,
  UserWithMetaInformation,
} from '@activepieces/shared';
import type { AnalyticsBrowser } from '@segment/analytics-next';
import type { PostHog, PostHogConfig } from 'posthog-js';
import React, { useRef } from 'react';
import { useDeepCompareEffect } from 'react-use';

import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';

interface TelemetryProviderProps {
  children: React.ReactNode;
}

const TelemetryProvider = ({ children }: TelemetryProviderProps) => {
  const { data: currentUser } = userHooks.useCurrentUser();
  const analyticsRef = useRef<AnalyticsBrowser | null>(null);
  const posthogRef = useRef<PostHog | null>(null);
  const initializationGeneration = useRef(0);
  const initializedUserEmail = useRef<string | null>(null);
  const pendingEvents = useRef<TelemetryEvent[]>([]);

  const user = currentUser ?? null;
  const { data: telemetryEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.TELEMETRY_ENABLED,
  );
  const { data: flagCurrentVersion } = flagsHooks.useFlag<string>(
    ApFlagId.CURRENT_VERSION,
  );
  const { data: flagEnvironment } = flagsHooks.useFlag<string>(
    ApFlagId.ENVIRONMENT,
  );
  const telemetryEnabledRef = useRef(telemetryEnabled === true);
  telemetryEnabledRef.current = telemetryEnabled === true;

  useDeepCompareEffect(() => {
    if (
      isNil(user) ||
      !telemetryEnabled ||
      user.email === initializedUserEmail.current
    ) {
      return;
    }

    if (!isNil(initializedUserEmail.current)) {
      resetTelemetryClients();
    }

    const generation = initializationGeneration.current + 1;
    initializationGeneration.current = generation;
    const cancelInitialization = scheduleTelemetryInitialization({
      initialize: () => {
        void initTelemetry({ generation, user }).catch((error: unknown) => {
          if (generation === initializationGeneration.current) {
            console.error('Unable to initialize telemetry', error);
          }
        });
      },
    });

    return () => {
      cancelInitialization();
      if (
        initializationGeneration.current === generation &&
        initializedUserEmail.current !== user.email
      ) {
        initializationGeneration.current += 1;
      }
    };
  }, [flagCurrentVersion, flagEnvironment, telemetryEnabled, user]);

  async function initTelemetry({
    generation,
    user: userToInitialize,
  }: {
    generation: number;
    user: UserWithMetaInformation;
  }) {
    const [{ AnalyticsBrowser }, { default: posthog }] = await Promise.all([
      import('@segment/analytics-next'),
      import('posthog-js'),
    ]);

    if (
      generation !== initializationGeneration.current ||
      !telemetryEnabledRef.current
    ) {
      return;
    }

    console.log('Telemetry enabled');
    const newAnalytics = AnalyticsBrowser.load({
      writeKey: 'Znobm6clOFLZNdMFpZ1ncf6VDmlCVSmj',
    });

    newAnalytics.addSourceMiddleware(({ payload, next }) => {
      const path = payload?.obj?.properties?.['path'];
      const ignoredPaths = ['/embed'];
      if (ignoredPaths.includes(path)) {
        return;
      }
      next(payload);
    });

    const currentVersion = flagCurrentVersion || '0.0.0';
    const environment = flagEnvironment || '0.0.0';

    newAnalytics.identify(userToInitialize.id, {
      email: userToInitialize.email,
      firstName: userToInitialize.firstName,
      lastName: userToInitialize.lastName,
      activepiecesVersion: currentVersion,
      activepiecesEnvironment: environment,
      ui: 'react',
    });

    void newAnalytics
      .ready(() => {
        if (
          generation !== initializationGeneration.current ||
          !telemetryEnabledRef.current
        ) {
          void newAnalytics.reset();
          return;
        }

        posthog.init('phc_7F92HoXJPeGnTKmYv0eOw62FurPMRW9Aqr0TPrDzvHh', {
          autocapture: false,
          capture_pageview: false,
          segment: window.analytics,
          loaded: () => newAnalytics.page(),
        });

        posthog.identify(userToInitialize.id, {
          email: userToInitialize.email,
          firstName: userToInitialize.firstName,
          lastName: userToInitialize.lastName,
          activepiecesVersion: currentVersion,
          activepiecesEnvironment: environment,
        });
        posthogRef.current = posthog;
      })
      .catch((error: unknown) => {
        console.error('Unable to finish telemetry initialization', error);
      });

    analyticsRef.current = newAnalytics;
    initializedUserEmail.current = userToInitialize.email;
    const eventsToFlush = pendingEvents.current;
    pendingEvents.current = [];
    eventsToFlush.forEach((event) => {
      newAnalytics.track(event.name, event.payload);
    });
  }

  const reset = () => {
    initializationGeneration.current += 1;
    pendingEvents.current = [];
    resetTelemetryClients();
    console.log('Telemetry removed');
  };

  const capture = (event: TelemetryEvent) => {
    if (!telemetryEnabled) {
      return;
    }

    if (analyticsRef.current) {
      analyticsRef.current.track(event.name, event.payload);
      return;
    }

    pendingEvents.current = [...pendingEvents.current, event].slice(
      -MAX_PENDING_EVENTS,
    );
  };

  function resetTelemetryClients() {
    void analyticsRef.current?.reset();
    posthogRef.current?.reset();
    analyticsRef.current = null;
    posthogRef.current = null;
    initializedUserEmail.current = null;
  }

  return (
    <TelemetryContext.Provider value={{ capture, reset }}>
      {children}
    </TelemetryContext.Provider>
  );
};

interface TelemetryContextType {
  capture: (event: TelemetryEvent) => void;
  reset: () => void;
}

const TelemetryContext = React.createContext<TelemetryContextType>({
  capture: () => {},
  reset: () => {},
});

export const useTelemetry = () => React.useContext(TelemetryContext);

export default TelemetryProvider;

function scheduleTelemetryInitialization({
  initialize,
}: {
  initialize: () => void;
}) {
  let cancelled = false;
  let started = false;
  let minimumDelayTimerId: number | null = null;
  let fallbackTimerId: number | null = null;
  let idleCallbackId: number | null = null;

  function start() {
    if (cancelled || started) {
      return;
    }

    started = true;
    if (idleCallbackId !== null) {
      getCancelIdleCallback()?.(idleCallbackId);
      idleCallbackId = null;
    }
    if (minimumDelayTimerId !== null) {
      window.clearTimeout(minimumDelayTimerId);
      minimumDelayTimerId = null;
    }
    if (fallbackTimerId !== null) {
      window.clearTimeout(fallbackTimerId);
      fallbackTimerId = null;
    }

    initialize();
  }

  minimumDelayTimerId = window.setTimeout(() => {
    minimumDelayTimerId = null;
    if (cancelled) {
      return;
    }

    const requestIdleCallback = getRequestIdleCallback();
    if (requestIdleCallback) {
      idleCallbackId = requestIdleCallback(start, {
        timeout: TELEMETRY_IDLE_TIMEOUT_MS,
      });
      return;
    }

    fallbackTimerId = window.setTimeout(start, TELEMETRY_FALLBACK_DELAY_MS);
  }, TELEMETRY_MINIMUM_DELAY_MS);

  return () => {
    cancelled = true;
    if (idleCallbackId !== null) {
      getCancelIdleCallback()?.(idleCallbackId);
    }
    if (minimumDelayTimerId !== null) {
      window.clearTimeout(minimumDelayTimerId);
    }
    if (fallbackTimerId !== null) {
      window.clearTimeout(fallbackTimerId);
    }
  };
}

function getRequestIdleCallback():
  | typeof window.requestIdleCallback
  | undefined {
  return window.requestIdleCallback;
}

function getCancelIdleCallback(): typeof window.cancelIdleCallback | undefined {
  return window.cancelIdleCallback;
}

const MAX_PENDING_EVENTS = 50;
const TELEMETRY_MINIMUM_DELAY_MS = 3_000;
const TELEMETRY_FALLBACK_DELAY_MS = 1_000;
const TELEMETRY_IDLE_TIMEOUT_MS = 4_000;

declare global {
  interface Window {
    analytics?: PostHogConfig['segment'];
  }
}

const telemetryProviderUtils = {
  scheduleTelemetryInitialization,
};

export { telemetryProviderUtils };
