import { FlowVersionState } from '@activepieces/shared';
import { useLayoutEffect, useRef } from 'react';

import { useResourceLock } from '@/hooks/use-resource-lock';

import { useBuilderStateContext } from '../../builder-hooks';

function useFlowLock() {
  const [
    readonly,
    flowId,
    flowVersion,
    publishedVersionId,
    run,
    isPublishing,
    saveError,
    setReadOnly,
    setEditorLockStatus,
  ] = useBuilderStateContext((state) => [
    state.readonly,
    state.flow.id,
    state.flowVersion,
    state.flow.publishedVersionId,
    state.run,
    state.isPublishing,
    state.saveError,
    state.setReadOnly,
    state.setEditorLockStatus,
  ]);
  const readonlySetByLock = useRef(false);
  const lockEnabled = !readonly || readonlySetByLock.current;

  const { lockedBy, lockStatus, takeOver } = useResourceLock({
    resourceId: flowId,
    enabled: lockEnabled,
  });
  const hasIndependentReadonlyReason =
    saveError ||
    isPublishing ||
    run !== null ||
    (publishedVersionId !== flowVersion.id &&
      flowVersion.state === FlowVersionState.LOCKED);

  useLayoutEffect(() => {
    setEditorLockStatus(lockStatus);
    if (readonlySetByLock.current && hasIndependentReadonlyReason) {
      readonlySetByLock.current = false;
    }
    const editingMustPause =
      lockStatus === 'acquiring' || lockStatus === 'locked';
    if (editingMustPause && !readonly) {
      readonlySetByLock.current = true;
      setReadOnly(true);
    }
    if (
      lockStatus === 'owned' &&
      readonlySetByLock.current &&
      !hasIndependentReadonlyReason
    ) {
      readonlySetByLock.current = false;
      setReadOnly(false);
    }
  }, [
    hasIndependentReadonlyReason,
    lockStatus,
    readonly,
    setEditorLockStatus,
    setReadOnly,
  ]);

  return { lockedBy, lockStatus, takeOver };
}

export { useFlowLock };
