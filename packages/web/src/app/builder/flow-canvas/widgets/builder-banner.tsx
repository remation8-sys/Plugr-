import { isNil } from '@activepieces/shared';

import {
  ResourceLockAcquiringWidget,
  ResourceLockWidget,
} from '@/components/custom/resource-lock-widget';

import { useBuilderStateContext } from '../../builder-hooks';

import { PublishFlowReminderWidget } from './publish-flow-reminder-widget';
import { RunInfoWidget } from './run-info-widget';
import { SaveErrorWidget } from './save-error-widget';
import { useFlowLock } from './use-flow-lock';
import { ViewingOldVersionWidget } from './viewing-old-version-widget';

const BuilderBanner = () => {
  const { lockedBy, lockStatus, takeOver } = useFlowLock();
  const run = useBuilderStateContext((state) => state.run);
  const saveError = useBuilderStateContext((state) => state.saveError);

  if (lockedBy) {
    return (
      <ResourceLockWidget
        lockedBy={lockedBy}
        takeOver={takeOver}
        resourceLabel="flow"
      />
    );
  }
  if (lockStatus === 'acquiring') {
    return <ResourceLockAcquiringWidget resourceLabel="flow" />;
  }
  if (saveError) {
    return <SaveErrorWidget />;
  }
  if (!isNil(run)) {
    return <RunInfoWidget />;
  }
  return (
    <>
      <ViewingOldVersionWidget />
      <PublishFlowReminderWidget />
    </>
  );
};

BuilderBanner.displayName = 'BuilderBanner';
export { BuilderBanner };
