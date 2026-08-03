import {
  Permission,
  isNil,
  WebsocketClientEvent,
  RunEnvironment,
  isFlowRunStateTerminal,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect } from 'react';
import { unstable_usePrompt } from 'react-router-dom';
import { useLocation } from 'react-use';

import { useEmbedding } from '@/components/providers/embed-provider';
import { useSocket } from '@/components/providers/socket-provider';
import { flowRunsApi } from '@/features/flow-runs';
import { flowsApi } from '@/features/flows';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { useIsMobile } from '@/hooks/use-mobile';

import { useBuilderStateContext } from './builder-hooks';
import { textMentionUtils } from './piece-properties/text-input-with-mentions/text-input-utils';

function useSetSocketListener(refetchPiece: () => void) {
  const socket = useSocket();
  const runId = useBuilderStateContext((state) => state.run?.id);
  useEffect(() => {
    const refreshPiece = () => refetchPiece();
    socket.on(WebsocketClientEvent.REFRESH_PIECE, refreshPiece);
    return () => {
      socket.off(WebsocketClientEvent.REFRESH_PIECE, refreshPiece);
    };
  }, [refetchPiece, runId, socket]);
}

function useListenToExistingRun() {
  const run = useBuilderStateContext((state) => state.run);
  const setRun = useBuilderStateContext((state) => state.setRun);
  const flowVersion = useBuilderStateContext((state) => state.flowVersion);
  const location = useLocation();
  const inRunsPage = location.pathname?.includes('/runs');
  useQuery({
    queryKey: ['refetched-run', run?.id],
    queryFn: async () => {
      if (isNil(run)) {
        return null;
      }
      const flowRun = await flowRunsApi.getPopulated(run.id);
      setRun(flowRun, flowVersion);
      return flowRun;
    },
    enabled:
      !isNil(run) &&
      run.environment === RunEnvironment.PRODUCTION &&
      !isFlowRunStateTerminal({
        status: run.status,
        ignoreInternalError: false,
      }) &&
      inRunsPage,
    refetchInterval: 5000,
  });
}

function useShowBuilderIsSavingWarningBeforeLeaving() {
  const {
    embedState: { isEmbedded },
  } = useEmbedding();
  const isMobile = useIsMobile();
  const isSaving = useBuilderStateContext((state) => state.saving);
  const saveError = useBuilderStateContext((state) => state.saveError);
  const hasUnsavedChanges = isSaving || saveError;
  const message = t(
    'Leaving now may discard changes that have not reached the server. Continue?',
  );
  unstable_usePrompt({
    when: isMobile && !isEmbedded && hasUnsavedChanges,
    message,
  });
  useEffect(() => {
    if (isEmbedded) {
      return;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, isEmbedded, message]);
}

function useSwitchToDraft() {
  const flowVersion = useBuilderStateContext((state) => state.flowVersion);
  const setVersion = useBuilderStateContext((state) => state.setVersion);
  const clearRun = useBuilderStateContext((state) => state.clearRun);
  const setFlow = useBuilderStateContext((state) => state.setFlow);
  const socket = useSocket();
  const { checkAccess } = useAuthorization();
  const userHasPermissionToEditFlow = checkAccess(Permission.WRITE_FLOW);

  const { mutate: switchToDraft, isPending: isSwitchingToDraftPending } =
    useMutation({
      mutationFn: async () => flowsApi.get(flowVersion.flowId),
      onSuccess: (flow) => {
        setFlow(flow);
        setVersion(flow.version);
        clearRun(userHasPermissionToEditFlow);
        socket.removeAllListeners(WebsocketClientEvent.UPDATE_RUN_PROGRESS);
      },
    });
  return {
    switchToDraft,
    isSwitchingToDraftPending,
  };
}

function useIsFocusInsideListMapperModeInput({
  containerRef,
  setIsFocusInsideListMapperModeInput,
  isFocusInsideListMapperModeInput,
}: UseIsFocusInsideListMapperModeInputParams) {
  useEffect(() => {
    const focusInListener = () => {
      const focusedElement = document.activeElement;
      const isFocusedInside = !!containerRef.current?.contains(focusedElement);
      const isFocusedInsideDataSelector =
        !isNil(document.activeElement) &&
        document.activeElement instanceof HTMLElement &&
        textMentionUtils.isDataSelectorOrChildOfDataSelector(
          document.activeElement,
        );
      setIsFocusInsideListMapperModeInput(
        isFocusedInside ||
          (isFocusedInsideDataSelector && isFocusInsideListMapperModeInput),
      );
    };
    document.addEventListener('focusin', focusInListener);
    return () => document.removeEventListener('focusin', focusInListener);
  }, [
    containerRef,
    isFocusInsideListMapperModeInput,
    setIsFocusInsideListMapperModeInput,
  ]);
}

export const builderLifecycleHooks = {
  useIsFocusInsideListMapperModeInput,
  useListenToExistingRun,
  useSetSocketListener,
  useShowBuilderIsSavingWarningBeforeLeaving,
  useSwitchToDraft,
};

type UseIsFocusInsideListMapperModeInputParams = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  setIsFocusInsideListMapperModeInput: (
    isFocusInsideListMapperModeInput: boolean,
  ) => void;
  isFocusInsideListMapperModeInput: boolean;
};
