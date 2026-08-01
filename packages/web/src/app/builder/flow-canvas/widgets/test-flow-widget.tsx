import {
  isNil,
  FlowTriggerType,
  UpdateRunProgressRequest,
  assertNotNullOrUndefined,
} from '@activepieces/shared';
import { t } from 'i18next';
import { MessageCircle, Play } from 'lucide-react';
import { useRef } from 'react';

import { EditFlowOrViewDraftButton } from '@/app/builder/builder-header/flow-status/view-draft-or-edit-flow-button';
import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { ChatDrawerSource } from '@/app/builder/types';
import { Button } from '@/components/ui/button';
import { flowRunUtils } from '@/features/flow-runs';
import { flowHooks } from '@/features/flows';
import { pieceSelectorUtils } from '@/features/pieces';

import { AboveTriggerButton } from './above-trigger-button';

const TestFlowWidget = ({ mobile = false }: TestFlowWidgetProps) => {
  const [
    setChatDrawerOpenSource,
    flowVersion,
    readonly,
    hideTestWidget,
    run,
    setRun,
    publishedVersionId,
  ] = useBuilderStateContext((state) => [
    state.setChatDrawerOpenSource,
    state.flowVersion,
    state.readonly,
    state.hideTestWidget,
    state.run,
    state.setRun,
    state.flow.publishedVersionId,
  ]);
  const runRef = useRef(run);
  runRef.current = run;

  const triggerHasSampleData =
    flowVersion.trigger.type === FlowTriggerType.PIECE &&
    !isNil(flowVersion.trigger.settings.sampleData?.lastTestDate);

  const isChatTrigger = pieceSelectorUtils.isChatTrigger(
    flowVersion.trigger.settings.pieceName,
    flowVersion.trigger.settings.triggerName,
  );
  const isManualTrigger = pieceSelectorUtils.isManualTrigger({
    pieceName: flowVersion.trigger.settings.pieceName,
    triggerName: flowVersion.trigger.settings.triggerName,
  });

  const { mutate: runFlow, isPending: isTestingFlow } =
    flowHooks.useTestFlowOrStartManualTrigger({
      flowVersionId: flowVersion.id,
      isForManualTrigger: isManualTrigger,
      onUpdateRun: (response: UpdateRunProgressRequest) => {
        assertNotNullOrUndefined(response.flowRun, 'flowRun');
        const steps = runRef.current?.steps ?? {};
        const startTime =
          response.flowRun.startTime ?? runRef.current?.startTime;
        if (!isNil(response.step)) {
          const updatedSteps = flowRunUtils.updateRunSteps(
            steps,
            response.step?.name,
            response.step?.path,
            response.step?.output,
          );
          setRun(
            { ...response.flowRun, startTime, steps: updatedSteps },
            flowVersion,
          );
          return;
        }
        setRun({ ...response.flowRun, startTime, steps }, flowVersion);
      },
    });

  if (!flowVersion.valid) {
    return null;
  }

  if (hideTestWidget) {
    return null;
  }
  if (
    isManualTrigger &&
    (publishedVersionId !== flowVersion.id || isNil(publishedVersionId))
  ) {
    return null;
  }

  if (readonly) {
    return <EditFlowOrViewDraftButton mobile={mobile} onCanvas={!mobile} />;
  }

  if (isChatTrigger) {
    if (mobile) {
      return (
        <MobileTestFlowButton
          icon={MessageCircle}
          loading={isTestingFlow}
          onClick={() => {
            setChatDrawerOpenSource(ChatDrawerSource.TEST_FLOW);
          }}
          text={t('Open Chat')}
        />
      );
    }
    return (
      <AboveTriggerButton
        onClick={() => {
          setChatDrawerOpenSource(ChatDrawerSource.TEST_FLOW);
        }}
        text={t('Open Chat')}
        loading={isTestingFlow}
      />
    );
  }

  if (mobile) {
    return (
      <MobileTestFlowButton
        disabled={!triggerHasSampleData && !isManualTrigger}
        icon={Play}
        loading={isTestingFlow}
        onClick={() => runFlow()}
        text={isManualTrigger ? t('Run Flow') : t('Test Flow')}
      />
    );
  }

  return (
    <AboveTriggerButton
      onClick={() => {
        runFlow();
      }}
      text={isManualTrigger ? t('Run Flow') : t('Test Flow')}
      disable={!triggerHasSampleData && !isManualTrigger}
      loading={isTestingFlow}
    />
  );
};

function MobileTestFlowButton({
  disabled = false,
  icon: Icon,
  loading,
  onClick,
  text,
}: MobileTestFlowButtonProps) {
  return (
    <div className="w-full">
      <Button
        className="h-12 w-full rounded-xl text-sm font-semibold shadow-[0_12px_30px_-18px_hsl(var(--primary)/0.8)]"
        disabled={disabled}
        loading={loading}
        onClick={onClick}
      >
        <Icon aria-hidden="true" className="size-4" />
        {text}
      </Button>
      {disabled && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {t('Test the trigger first to run the complete flow.')}
        </p>
      )}
    </div>
  );
}

TestFlowWidget.displayName = 'TestFlowWidget';

export { TestFlowWidget };

type TestFlowWidgetProps = {
  mobile?: boolean;
};

type MobileTestFlowButtonProps = {
  disabled?: boolean;
  icon: React.ComponentType<{
    className?: string;
    'aria-hidden'?: React.AriaAttributes['aria-hidden'];
  }>;
  loading: boolean;
  onClick: () => void;
  text: string;
};
