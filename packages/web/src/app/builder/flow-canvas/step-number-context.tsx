import { createContext, useContext } from 'react';

type CanvasStepDerivedData = {
  stepNumberByName: ReadonlyMap<string, number>;
  skippedStepNames: ReadonlySet<string>;
};

const EMPTY_DATA: CanvasStepDerivedData = {
  stepNumberByName: new Map(),
  skippedStepNames: new Set(),
};

const StepDerivedDataContext = createContext<CanvasStepDerivedData>(EMPTY_DATA);

export const StepDerivedDataProvider = StepDerivedDataContext.Provider;

// Both values only change identity when the flow's structure or skip flags
// change (same cadence as the canvas graph itself), not on every content
// edit - so reading from here instead of subscribing to the whole
// flowVersion avoids re-rendering every step node on the canvas whenever
// any OTHER step is edited.
export const useStepNumber = (stepName: string): number => {
  const { stepNumberByName } = useContext(StepDerivedDataContext);
  return stepNumberByName.get(stepName) ?? 0;
};

export const useIsStepSkipped = (stepName: string): boolean => {
  const { skippedStepNames } = useContext(StepDerivedDataContext);
  return skippedStepNames.has(stepName);
};
