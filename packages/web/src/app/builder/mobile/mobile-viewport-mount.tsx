import {
  createContext,
  ReactNode,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const MobileViewportMountContext =
  createContext<MobileViewportMountRegistry | null>(null);

function MobileViewportMountProvider({
  children,
  scrollRootRef,
}: MobileViewportMountProviderProps) {
  const callbacksRef = useRef(
    new Map<HTMLElement, MobileViewportVisibilityCallback>(),
  );
  const observerRef = useRef<IntersectionObserver | null>(null);
  const mountAllRef = useRef(false);

  const register = useCallback(
    ({ element, onVisibilityChange }: RegisterMobileViewportNodeParams) => {
      callbacksRef.current.set(element, onVisibilityChange);
      if (mountAllRef.current) {
        onVisibilityChange(true);
      } else {
        observerRef.current?.observe(element);
      }

      return () => {
        observerRef.current?.unobserve(element);
        callbacksRef.current.delete(element);
      };
    },
    [],
  );

  useEffect(() => {
    const scrollRoot = scrollRootRef.current;
    if (!scrollRoot || typeof IntersectionObserver === 'undefined') {
      mountAllRef.current = true;
      callbacksRef.current.forEach((callback) => callback(true));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target instanceof HTMLElement) {
            callbacksRef.current
              .get(entry.target)
              ?.call(null, entry.isIntersecting);
          }
        });
      },
      {
        root: scrollRoot,
        rootMargin: MOBILE_VIEWPORT_ROOT_MARGIN,
      },
    );
    observerRef.current = observer;
    callbacksRef.current.forEach((_callback, element) =>
      observer.observe(element),
    );

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [scrollRootRef]);

  const registry = useMemo(() => ({ register }), [register]);

  return (
    <MobileViewportMountContext.Provider value={registry}>
      {children}
    </MobileViewportMountContext.Provider>
  );
}

function MobileViewportMount({
  children,
  eager,
  estimatedHeight,
  id,
  pinned,
}: MobileViewportMountProps) {
  const registry = useContext(MobileViewportMountContext);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(eager);
  const [placeholderHeight, setPlaceholderHeight] = useState(
    Math.max(MOBILE_NODE_ESTIMATED_HEIGHT, estimatedHeight),
  );
  const shouldMount = eager || pinned || isNearViewport;

  useEffect(() => {
    const element = wrapperRef.current;
    if (eager || !element) {
      return;
    }
    if (!registry) {
      setIsNearViewport(true);
      return;
    }
    return registry.register({
      element,
      onVisibilityChange: setIsNearViewport,
    });
  }, [eager, registry]);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!shouldMount || !element) {
      return;
    }

    const updateHeight = () => {
      const nextHeight = Math.max(
        MOBILE_NODE_ESTIMATED_HEIGHT,
        Math.ceil(element.getBoundingClientRect().height),
      );
      setPlaceholderHeight((currentHeight) =>
        currentHeight === nextHeight ? currentHeight : nextHeight,
      );
    };
    updateHeight();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [shouldMount]);

  return (
    <div
      ref={wrapperRef}
      id={id}
      aria-hidden={shouldMount ? undefined : true}
      data-mobile-viewport-node
      data-mobile-viewport-placeholder={shouldMount ? undefined : ''}
      style={shouldMount ? undefined : { height: placeholderHeight }}
    >
      {shouldMount ? children : null}
    </div>
  );
}

const MOBILE_NODE_ESTIMATED_HEIGHT = 140;
const MOBILE_VIEWPORT_ROOT_MARGIN = '480px 0px';

type MobileViewportMountRegistry = {
  register: (params: RegisterMobileViewportNodeParams) => () => void;
};

type RegisterMobileViewportNodeParams = {
  element: HTMLElement;
  onVisibilityChange: MobileViewportVisibilityCallback;
};

type MobileViewportVisibilityCallback = (isVisible: boolean) => void;

type MobileViewportMountProviderProps = {
  children: ReactNode;
  scrollRootRef: RefObject<HTMLElement | null>;
};

type MobileViewportMountProps = {
  children: ReactNode;
  eager: boolean;
  estimatedHeight: number;
  id: string;
  pinned: boolean;
};

export { MobileViewportMount, MobileViewportMountProvider };
