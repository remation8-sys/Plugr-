import { FlowAction, FlowTrigger } from '@activepieces/shared';
import { t } from 'i18next';
import { useState } from 'react';

import { SIDEBAR_ID } from '@/app/components/sidebar/dashboard';
import { stepsHooks } from '@/features/pieces';

import {
  useCursorPosition,
  useCursorPositionEffect,
} from '../../../state/cursor-position-context';
import { flowCanvasConsts } from '../../utils/consts';

const StepDragOverlay = ({ step }: { step: FlowAction | FlowTrigger }) => {
  const { cursorPosition } = useCursorPosition();
  const [overlayPosition, setOverlayPosition] =
    useState<typeof cursorPosition>(cursorPosition);
  const sidebar = document.getElementById(SIDEBAR_ID);
  const sidebarWidth = sidebar?.clientWidth ?? 0;
  const left = `${
    overlayPosition.x -
    flowCanvasConsts.STEP_DRAG_OVERLAY_WIDTH / 2 -
    sidebarWidth
  }px`;
  const top = `${
    overlayPosition.y - flowCanvasConsts.STEP_DRAG_OVERLAY_HEIGHT - 20
  }px`;
  const { stepMetadata } = stepsHooks.useStepMetadata({
    step,
  });
  useCursorPositionEffect((position) => {
    setOverlayPosition(position);
  });
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 z-50 flex cursor-grabbing items-center justify-center rounded-xl border border-primary/30 bg-background/95 p-3 shadow-2xl ring-4 ring-primary/10 backdrop-blur motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
      style={{
        left,
        top,
        height: `${flowCanvasConsts.STEP_DRAG_OVERLAY_HEIGHT}px`,
        width: `${flowCanvasConsts.STEP_DRAG_OVERLAY_WIDTH}px`,
        zIndex: 99999,
      }}
      id="dragged-step-overlay"
    >
      <img
        className="static left-0 right-0 max-h-full max-w-full object-contain !cursor-grabbing"
        src={step?.settings?.customLogoUrl ?? stepMetadata?.logoUrl}
        alt={t('Step Icon')}
        width="48"
        height="48"
        loading="eager"
        decoding="async"
      />
    </div>
  );
};

export default StepDragOverlay;
