import { StepOutputStatus, isNil } from '@activepieces/shared';
import { useMemo } from 'react';

import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../../../builder-hooks';
import { flowCanvasUtils } from '../../utils/flow-canvas-utils';
import { flowScreenshotUtils } from '../../utils/flow-screenshot-utils';

const RING_COLOR_CLASS: Record<StepOutputStatus, string> = {
  [StepOutputStatus.RUNNING]: 'border-primary/40',
  [StepOutputStatus.SUCCEEDED]: 'border-success-600/50',
  [StepOutputStatus.STOPPED]: 'border-success-600/50',
  [StepOutputStatus.FAILED]: 'border-destructive-600/50',
  [StepOutputStatus.PAUSED]: 'border-warning-500/60',
};

/**
 * Live execution ring drawn just outside the node border: a rotating comet
 * sweep while the step is running (static under prefers-reduced-motion) and a
 * colored ring for terminal/paused states. Reads the same run state the
 * status badges use — purely presentational.
 */
const ApStepNodeStatusRing = ({
  stepName,
  className,
}: {
  stepName: string;
  className?: string;
}) => {
  const [run, loopIndexes, isBeingTested] = useBuilderStateContext((state) => [
    state.run,
    state.loopsIndexes,
    state.isStepBeingTested(stepName),
  ]);
  const statusInRun = useMemo(() => {
    return flowCanvasUtils.getStepStatus(stepName, run, loopIndexes);
  }, [stepName, run, loopIndexes]);
  const status = isBeingTested ? StepOutputStatus.RUNNING : statusInRun;
  if (isNil(status)) {
    return null;
  }
  const screenshotExclude = {
    [flowScreenshotUtils.SCREENSHOT_EXCLUDE_ATTRIBUTE]: 'ignore-me',
  };
  return (
    <>
      <div
        aria-hidden
        {...screenshotExclude}
        className={cn(
          'pointer-events-none absolute -inset-[3px] rounded-[calc(var(--radius)+1px)] border-[3px] transition-colors duration-300',
          RING_COLOR_CLASS[status],
          {
            'motion-safe:animate-pulse': status === StepOutputStatus.PAUSED,
          },
          className,
        )}
      />
      {status === StepOutputStatus.RUNNING && (
        <div
          aria-hidden
          {...screenshotExclude}
          className={cn(
            'pointer-events-none absolute -inset-[3px] rounded-[calc(var(--radius)+1px)] node-comet-ring motion-safe:animate-node-comet motion-reduce:hidden',
            className,
          )}
        />
      )}
    </>
  );
};

ApStepNodeStatusRing.displayName = 'ApStepNodeStatusRing';
export { ApStepNodeStatusRing };
