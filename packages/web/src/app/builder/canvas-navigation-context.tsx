import { createContext, ReactNode, useContext } from 'react';

const CanvasNavigationContext = createContext<CanvasNavigationContextValue>({
  focusStep: () => undefined,
});

function CanvasNavigationProvider({
  children,
  focusStep,
}: CanvasNavigationProviderProps) {
  return (
    <CanvasNavigationContext.Provider value={{ focusStep }}>
      {children}
    </CanvasNavigationContext.Provider>
  );
}

function useCanvasNavigation() {
  return useContext(CanvasNavigationContext);
}

export { CanvasNavigationProvider, useCanvasNavigation };

type CanvasNavigationContextValue = {
  focusStep: (stepName: string) => void;
};

type CanvasNavigationProviderProps = CanvasNavigationContextValue & {
  children: ReactNode;
};
