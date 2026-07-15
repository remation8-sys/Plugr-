import { isNil } from '@activepieces/shared';
import { DragMoveEvent, useDndMonitor, useDroppable } from '@dnd-kit/core';
import { Handle, Position } from '@xyflow/react';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import React, { useId, useState } from 'react';

import { PieceSelector } from '@/app/builder/pieces-selector';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasConsts } from '../utils/consts';
import { flowCanvasUtils } from '../utils/flow-canvas-utils';
import { ApBigAddButtonNode } from '../utils/types';

const ApBigAddButtonCanvasNode = React.memo(
  ({ data, id }: Omit<ApBigAddButtonNode, 'position'>) => {
    const [isIsStepInsideDropzone, setIsStepInsideDropzone] = useState(false);
    const [
      readonly,
      activeDraggingStep,
      isPieceSelectorOpened,
      canvasOrientation,
    ] = useBuilderStateContext((state) => [
      state.readonly,
      state.activeDraggingStep,
      state.openedPieceSelectorStepNameOrAddButtonId === id,
      state.canvasOrientation,
    ]);
    const isHorizontal = canvasOrientation === 'horizontal';
    const draggableId = useId();
    const { setNodeRef } = useDroppable({
      id: draggableId,
      data: {
        accepts: flowCanvasConsts.DRAGGED_STEP_TAG,
        ...data,
      },
    });
    const isShowingDropIndicator = !isNil(activeDraggingStep);
    useDndMonitor({
      onDragMove(event: DragMoveEvent) {
        setIsStepInsideDropzone(event.over?.id === draggableId);
      },
      onDragEnd() {
        setIsStepInsideDropzone(false);
      },
      onDragCancel() {
        setIsStepInsideDropzone(false);
      },
    });
    const stepNodeSize = flowCanvasConsts.STEP_NODE_SIZE[canvasOrientation];
    return (
      <>
        {
          <div
            style={{
              height: `${stepNodeSize.height}px`,
              width: `${stepNodeSize.width}px`,
            }}
            className="flex items-center justify-center"
          >
            {!readonly && (
              <div className="bg-builder-background">
                <div
                  style={{
                    height: `${flowCanvasConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.height}px`,
                    width: `${flowCanvasConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.width}px`,
                  }}
                  className="relative flex cursor-auto items-center justify-center border-none"
                >
                  <div
                    style={{
                      height: `${flowCanvasConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.height}px`,
                      width: `${flowCanvasConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.width}px`,
                    }}
                    id={id}
                    className={cn(
                      'relative rounded-lg border border-border bg-card transition-all duration-150 motion-reduce:transition-none',
                      {
                        'border-primary/45 bg-primary/15 text-primary ring-4 ring-primary/10':
                          isShowingDropIndicator || isPieceSelectorOpened,
                        'scale-105 shadow-add-button':
                          isIsStepInsideDropzone || isPieceSelectorOpened,
                      },
                    )}
                  >
                    {!isShowingDropIndicator && (
                      <PieceSelector
                        operation={flowCanvasUtils.createAddOperationFromAddButtonData(
                          data,
                        )}
                        id={id}
                      >
                        <span>
                          <Button
                            variant="transparent"
                            aria-label={t('Add step')}
                            className="flex h-full w-full items-center rounded-lg border border-border bg-card text-foreground transition-all duration-150 hover:scale-105 hover:border-primary/40 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary/25 motion-reduce:transition-none"
                          >
                            <Plus
                              className={cn('size-6 text-foreground', {
                                'opacity-0':
                                  isShowingDropIndicator ||
                                  isPieceSelectorOpened,
                              })}
                            />
                          </Button>
                        </span>
                      </PieceSelector>
                    )}
                    {isShowingDropIndicator && (
                      <div className="flex h-full w-full items-center justify-center">
                        <Plus className="size-5 stroke-[3px] text-primary" />
                      </div>
                    )}
                  </div>
                  {isShowingDropIndicator && (
                    <div
                      style={{
                        height: `${stepNodeSize.height}px`,
                        width: `${stepNodeSize.width}px`,
                        top: `-${
                          stepNodeSize.height / 2 -
                          flowCanvasConsts.AP_NODE_SIZE.BIG_ADD_BUTTON.width / 2
                        }px`,
                      }}
                      className="absolute rounded-xl"
                      ref={setNodeRef}
                    >
                      {' '}
                    </div>
                  )}
                </div>
              </div>
            )}
            {readonly && (
              <div
                style={{
                  height: `${stepNodeSize.height}px`,
                  width: `${stepNodeSize.width}px`,
                }}
                className="relative flex cursor-auto items-center justify-center"
              >
                <svg
                  height={stepNodeSize.height}
                  width={stepNodeSize.width}
                  className="overflow-visible border-transparent"
                  style={{
                    stroke: 'var(--xy-edge-stroke, var(--xy-edge-stroke))',
                  }}
                  shapeRendering="auto"
                >
                  <g>
                    <path
                      d={
                        isHorizontal
                          ? `M -10 ${stepNodeSize.height / 2} h ${
                              stepNodeSize.width + 14
                            }`
                          : `M ${stepNodeSize.width / 2} -10 v ${
                              stepNodeSize.height + 14
                            }`
                      }
                      fill="transparent"
                      strokeWidth="1.5"
                    />
                  </g>
                </svg>
              </div>
            )}
          </div>
        }

        <Handle
          type="source"
          position={isHorizontal ? Position.Right : Position.Bottom}
          style={flowCanvasConsts.HANDLE_STYLING}
        />
        <Handle
          type="target"
          position={isHorizontal ? Position.Left : Position.Top}
          style={flowCanvasConsts.HANDLE_STYLING}
        />
      </>
    );
  },
);

ApBigAddButtonCanvasNode.displayName = 'ApBigAddButtonCanvasNode';
export { ApBigAddButtonCanvasNode };
