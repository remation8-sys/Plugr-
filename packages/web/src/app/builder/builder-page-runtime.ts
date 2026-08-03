import {
  FlowActionType,
  FlowTriggerType,
  flowStructureUtil,
} from '@activepieces/shared';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { piecesHooks } from '@/features/pieces';

import { useBuilderStateContext } from './builder-hooks';
import { builderLifecycleHooks } from './builder-lifecycle-hooks';

function useBuilderPageRuntime() {
  const [
    flowVersion,
    rightSidebar,
    selectedStepName,
    removeAllStepTestsListeners,
    stepDataPanelView,
    isStepDataPanelOpen,
    setStepDataPanelView,
    setStepDataPanelOpen,
    exitStepSettings,
  ] = useBuilderStateContext(
    useShallow((state) => [
      state.flowVersion,
      state.rightSidebar,
      state.selectedStep,
      state.removeAllStepTestsListeners,
      state.stepDataPanelView,
      state.isStepDataPanelOpen,
      state.setStepDataPanelView,
      state.setStepDataPanelOpen,
      state.exitStepSettings,
    ]),
  );
  const selectedStep = flowStructureUtil.getStep(
    selectedStepName ?? '',
    flowVersion.trigger,
  );

  useEffect(
    () => () => removeAllStepTestsListeners(),
    [removeAllStepTestsListeners],
  );
  builderLifecycleHooks.useShowBuilderIsSavingWarningBeforeLeaving();

  const { pieceModel, refetch: refetchPiece } =
    piecesHooks.usePieceModelForStepSettings({
      name: selectedStep?.settings.pieceName,
      version: selectedStep?.settings.pieceVersion,
      enabled:
        selectedStep?.type === FlowActionType.PIECE ||
        selectedStep?.type === FlowTriggerType.PIECE,
    });
  builderLifecycleHooks.useSetSocketListener(refetchPiece);
  builderLifecycleHooks.useListenToExistingRun();

  return {
    exitStepSettings,
    flowVersion,
    isStepDataPanelOpen,
    pieceModel,
    rightSidebar,
    selectedStep,
    selectedStepName,
    setStepDataPanelOpen,
    setStepDataPanelView,
    stepDataPanelView,
  };
}

export { useBuilderPageRuntime };
