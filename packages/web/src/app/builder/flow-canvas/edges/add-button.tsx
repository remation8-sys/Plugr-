import { isNil } from '@activepieces/shared';
import { DragMoveEvent, useDndMonitor, useDroppable } from '@dnd-kit/core';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasConsts } from '../utils/consts';
import { flowCanvasUtils } from '../utils/flow-canvas-utils';
import { ApButtonData } from '../utils/types';

import { PieceSelector } from '@/app/builder/pieces-selector';
import { cn } from '@/lib/utils';

const ApAddButton = React.memo((props: ApButtonData) => {
  const [isStepInsideDropZone, setIsStepInsideDropzone] = useState(false);
  const [activeDraggingStep, readonly, isPieceSelectorOpen, canvasOrientation] =
    useBuilderStateContext((state) => [
      state.activeDraggingStep,
      state.readonly,
      state.openedPieceSelectorStepNameOrAddButtonId === props.edgeId,
      state.canvasOrientation,
    ]);
  const isHorizontal = canvasOrientation === 'horizontal';

  const { setNodeRef } = useDroppable({
    id: props.edgeId,
    data: {
      accepts: flowCanvasConsts.DRAGGED_STEP_TAG,
      ...props,
    },
  });

  const showDropIndicator = !isNil(activeDraggingStep);

  useDndMonitor({
    onDragMove(event: DragMoveEvent) {
      setIsStepInsideDropzone(event.collisions?.[0]?.id === props.edgeId);
    },
    onDragEnd() {
      setIsStepInsideDropzone(false);
    },
    onDragCancel() {
      setIsStepInsideDropzone(false);
    },
  });

  return (
    <>
      {showDropIndicator && !readonly && (
        <div
          style={{
            width: flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width + 'px',
            height: flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height + 'px',
          }}
          className={cn(
            'relative flex items-center justify-center rounded-lg border border-primary/45 bg-primary/15 text-primary shadow-sm transition-all duration-150 motion-reduce:transition-none',
            {
              'scale-125 bg-primary/25 ring-4 ring-primary/15 shadow-add-button':
                isStepInsideDropZone,
            },
          )}
        >
          <Plus className="size-3 stroke-[3px]" />
          <div
            style={{
              width:
                flowCanvasConsts.STEP_NODE_SIZE[canvasOrientation].width + 'px',
              height:
                flowCanvasConsts.STEP_NODE_SIZE[canvasOrientation].height +
                'px',
              left: isHorizontal
                ? `${
                    -flowCanvasConsts.ORIENTATION_LAYOUT.horizontal
                      .spaceAlongBetweenSteps / 2
                  }px`
                : `${
                    -flowCanvasConsts.STEP_NODE_SIZE[canvasOrientation].width /
                    2
                  }px`,
              top: isHorizontal
                ? `${
                    -flowCanvasConsts.STEP_NODE_SIZE[canvasOrientation].height /
                    2
                  }px`
                : `${-flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS / 2}px`,
            }}
            className="absolute rounded-xl border border-primary/0 bg-primary/0"
            ref={setNodeRef}
          ></div>
        </div>
      )}
      {!showDropIndicator && !readonly && (
        <PieceSelector
          operation={flowCanvasUtils.createAddOperationFromAddButtonData(props)}
          id={props.edgeId}
        >
          <div
            style={{
              width: flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width + 'px',
              height: flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height + 'px',
            }}
          >
            <div
              style={{
                width: flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.width + 'px',
                height: flowCanvasConsts.AP_NODE_SIZE.ADD_BUTTON.height + 'px',
              }}
              className={cn('rounded-lg transition-all duration-150', {
                'shadow-add-button': isPieceSelectorOpen,
              })}
            >
              <button
                type="button"
                className={cn(
                  'group relative z-50 flex h-5 w-5 cursor-pointer touch-manipulation items-center justify-center overflow-visible rounded-lg border border-border bg-card transition-all duration-150 hover:scale-110 hover:border-primary/40 hover:bg-accent active:scale-95 active:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 motion-reduce:transition-none max-md:-translate-x-3 max-md:-translate-y-3 max-md:h-11 max-md:w-11',
                  {
                    'border-primary bg-primary text-primary-foreground':
                      isPieceSelectorOpen,
                  },
                )}
                aria-label={t('Add step')}
                data-testid="add-action-button"
              >
                {!isPieceSelectorOpen && (
                  <Plus className="size-3 stroke-[3px] text-muted-foreground transition-colors group-hover:text-foreground max-md:size-5" />
                )}
              </button>
            </div>
          </div>
        </PieceSelector>
      )}
    </>
  );
});

ApAddButton.displayName = 'ApAddButton';
export { ApAddButton };
