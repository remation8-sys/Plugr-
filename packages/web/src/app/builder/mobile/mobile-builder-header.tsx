import {
  FlowOperationType,
  FlowVersionState,
  Permission,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, HistoryIcon, MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import EditableText from '@/components/custom/editable-text';
import { Button } from '@/components/ui/button';
import { flowHooks } from '@/features/flows';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { NEW_FLOW_QUERY_PARAM } from '@/lib/route-utils';

import FlowActionMenu from '../../components/flow-actions-menu';
import { useBuilderStateContext } from '../builder-hooks';
import { RightSideBarType } from '../types';

function MobileBuilderHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [queryParams] = useSearchParams();
  const hasPermissionToReadRuns = useAuthorization().checkAccess(
    Permission.READ_FLOW,
  );
  const flow = useBuilderStateContext((state) => state.flow);
  const flowVersion = useBuilderStateContext((state) => state.flowVersion);
  const readonly = useBuilderStateContext((state) => state.readonly);
  const editorLockStatus = useBuilderStateContext(
    (state) => state.editorLockStatus,
  );
  const saving = useBuilderStateContext((state) => state.saving);
  const saveError = useBuilderStateContext((state) => state.saveError);
  const moveToFolderClientSide = useBuilderStateContext(
    (state) => state.moveToFolderClientSide,
  );
  const applyOperation = useBuilderStateContext(
    (state) => state.applyOperation,
  );
  const setRightSidebar = useBuilderStateContext(
    (state) => state.setRightSidebar,
  );
  const [isEditingFlowName, setIsEditingFlowName] = useState(false);
  const isLatestVersion =
    flowVersion.state === FlowVersionState.DRAFT ||
    flowVersion.id === flow.publishedVersionId;
  const editingIsPaused = readonly || saveError || editorLockStatus !== 'owned';

  useEffect(() => {
    setIsEditingFlowName(
      !editingIsPaused && queryParams.get(NEW_FLOW_QUERY_PARAM) === 'true',
    );
  }, [editingIsPaused, queryParams]);

  function goToFlowsPage() {
    navigate(authenticationSession.appendProjectRoutePrefix('/automations'));
  }

  return (
    <header
      className="flex h-16 shrink-0 items-center gap-1 border-b border-border/80 bg-background px-2"
      data-builder-save-state={
        saveError ? 'error' : saving ? 'saving' : 'saved'
      }
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 shrink-0 rounded-xl"
        aria-label={t('Back to flows')}
        onClick={goToFlowsPage}
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
      </Button>

      <div className="min-w-0 flex-1 px-1">
        <div className="min-w-0 text-[0.95rem] font-semibold leading-5 text-foreground">
          <EditableText
            className="truncate hover:cursor-text"
            value={flowVersion.displayName}
            readonly={editingIsPaused || !isLatestVersion}
            onValueChange={(value) => {
              applyOperation(
                {
                  type: FlowOperationType.CHANGE_NAME,
                  request: { displayName: value },
                },
                () => flowHooks.invalidateFlowsQuery(queryClient),
              );
            }}
            isEditing={isEditingFlowName}
            setIsEditing={setIsEditingFlowName}
            tooltipContent=""
          />
        </div>
        <p
          aria-live="polite"
          className="mt-0.5 truncate text-[0.7rem] font-medium text-muted-foreground"
        >
          {saveError
            ? t('Not saved')
            : saving
            ? t('Saving...')
            : flowVersion.state === FlowVersionState.DRAFT
            ? t('Draft saved')
            : t('Published')}
        </p>
      </div>

      {hasPermissionToReadRuns && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 rounded-xl"
          aria-label={t('Runs')}
          onClick={() => setRightSidebar(RightSideBarType.RUNS)}
        >
          <HistoryIcon aria-hidden="true" className="size-5" />
        </Button>
      )}

      <FlowActionMenu
        onVersionsListClick={() => setRightSidebar(RightSideBarType.VERSIONS)}
        insideBuilder
        flow={flow}
        flowVersion={flowVersion}
        readonly={editingIsPaused || !isLatestVersion}
        onDelete={goToFlowsPage}
        onRename={() => setIsEditingFlowName(true)}
        onMoveTo={moveToFolderClientSide}
        onDuplicate={() => {}}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 rounded-xl"
          aria-label={t('Flow actions')}
        >
          <MoreHorizontal aria-hidden="true" className="size-5" />
        </Button>
      </FlowActionMenu>
    </header>
  );
}

export { MobileBuilderHeader };
