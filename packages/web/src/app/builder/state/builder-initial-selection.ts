import { FlowVersion, flowStructureUtil } from '@activepieces/shared';

import { NEW_FLOW_QUERY_PARAM } from '@/lib/route-utils';

function determineInitiallySelectedStep({
  failedStepNameInRun,
  flowVersion,
}: DetermineInitiallySelectedStepParams): string | null {
  const firstInvalidStep = flowStructureUtil
    .getAllSteps(flowVersion.trigger)
    .find((step) => !step.valid);
  const isNewFlow = window.location.search.includes(NEW_FLOW_QUERY_PARAM);
  if (failedStepNameInRun) {
    return failedStepNameInRun;
  }
  if (isNewFlow) {
    return null;
  }
  return firstInvalidStep?.name ?? 'trigger';
}

export const builderInitialSelection = {
  determineInitiallySelectedStep,
};

type DetermineInitiallySelectedStepParams = {
  failedStepNameInRun: string | null;
  flowVersion: FlowVersion;
};
