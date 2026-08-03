import {
  FlowAction,
  FlowActionType,
  FlowTrigger,
  FlowTriggerType,
} from '@activepieces/shared';

function constructContainerKey({
  flowVersionId,
  step,
  hasPieceModelLoaded,
}: ConstructContainerKeyParams) {
  const stepName = step?.name;
  const triggerOrActionName =
    step?.type === FlowTriggerType.PIECE
      ? step.settings.triggerName
      : step?.settings.actionName;
  const pieceName =
    step?.type === FlowTriggerType.PIECE || step?.type === FlowActionType.PIECE
      ? step.settings.pieceName
      : undefined;
  const pieceVersion =
    step?.type === FlowTriggerType.PIECE || step?.type === FlowActionType.PIECE
      ? step.settings.pieceVersion
      : undefined;
  const isSkipped =
    step?.type !== FlowTriggerType.EMPTY &&
    step?.type !== FlowTriggerType.PIECE &&
    step?.skip;
  return `${flowVersionId}-${stepName ?? ''}-${triggerOrActionName ?? ''}-${
    pieceName ?? ''
  }-${pieceVersion ?? ''}-${'skipped-' + !!isSkipped}-${
    hasPieceModelLoaded ? 'loaded' : 'not-loaded'
  }`;
}

export const builderPageUtils = {
  constructContainerKey,
};

type ConstructContainerKeyParams = {
  flowVersionId: string;
  step?: FlowAction | FlowTrigger;
  hasPieceModelLoaded: boolean;
};
