import {
  FlowRetryStrategy,
  FlowRun,
  FlowRunStatus,
  FlowRunWithRetryError,
  isFailedState,
  isFlowRunStateTerminal,
  Permission,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  CheckIcon,
  Redo,
  RotateCw,
  ChevronDown,
  History,
  X,
  Archive,
  SearchIcon,
} from 'lucide-react';
import { useEffect, useMemo, useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  BulkAction,
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
  DataTable,
  DataTableFilters,
} from '@/components/custom/data-table';
import { getDefaultRange } from '@/components/custom/date-time-picker-range';
import { FormattedDate } from '@/components/custom/formatted-date';
import { MessageTooltip } from '@/components/custom/message-tooltip';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { flowRunsApi } from '@/features/flow-runs/api/flow-runs-api';
import {
  DEFAULT_DATE_PRESET,
  flowRunMutations,
} from '@/features/flow-runs/hooks/flow-run-hooks';
import { flowRunUtils } from '@/features/flow-runs/utils/flow-run-utils';
import { flowHooks } from '@/features/flows/hooks/flow-hooks';
import {
  useAuthorization,
  useIsPlatformAdmin,
} from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/format-utils';
import { useNewWindow } from '@/lib/navigation-utils';

import { runsTableColumns } from './columns';
import { FailedRetryRunsDialog } from './failed-retry-runs-dialog';
import { FailedStepDialog } from './failed-step-dialog';
import {
  RetriedRunsSnackbar,
  RUN_IDS_QUERY_PARAM,
} from './retried-runs-snackbar';
import { RunsStatusChart } from './runs-status-chart';

type SelectedRow = {
  id: string;
  status: FlowRunStatus;
};

function RunMobileCard({ run }: { run: FlowRun }) {
  const { variant, Icon } = flowRunUtils.getStatusIcon(run.status);
  const duration =
    run.startTime && run.finishTime
      ? new Date(run.finishTime).getTime() - new Date(run.startTime).getTime()
      : undefined;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 active:scale-[0.98] transition-transform duration-100">
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-foreground truncate leading-snug">
          {run.flowVersion?.displayName ?? '—'}
        </p>
        <div className="flex items-center gap-1.5 mt-1 text-[12px] text-muted-foreground">
          <FormattedDate date={new Date(run.created ?? new Date())} includeTime />
          {run.finishTime && (
            <>
              <span>·</span>
              <span>{formatUtils.formatDuration(duration)}</span>
            </>
          )}
        </div>
      </div>
      <div className="shrink-0">
        <StatusIconWithText
          icon={Icon}
          text={formatUtils.convertEnumToReadable(run.status)}
          variant={variant}
        />
      </div>
    </div>
  );
}

export const RunsTable = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRows, setSelectedRows] = useState<Array<SelectedRow>>([]);
  const [selectedAll, setSelectedAll] = useState(false);
  const [excludedRows, setExcludedRows] = useState<Set<string>>(new Set());

  const projectId = authenticationSession.getProjectId()!;
  const [retriedRunsIds, setRetriedRunsIds] = useState<string[]>([]);
  const [failedRetryRuns, setFailedRetryRuns] = useState<
    Required<FlowRunWithRetryError>[]
  >([]);
  const [failedRetryDialogOpen, setFailedRetryDialogOpen] = useState(false);
  const [errorDialogRun, setErrorDialogRun] = useState<FlowRun | null>(null);

  const [hasSeededDefaultRange, setHasSeededDefaultRange] = useState(() =>
    searchParams.has('createdAfter'),
  );
  useEffect(() => {
    if (hasSeededDefaultRange) return;
    const range = getDefaultRange(DEFAULT_DATE_PRESET);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (!next.has('createdAfter')) {
          next.set('createdAfter', range.from.toISOString());
          next.set('createdBefore', range.to.toISOString());
        }
        return next;
      },
      { replace: true },
    );
    setHasSeededDefaultRange(true);
  }, [hasSeededDefaultRange, setSearchParams]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['flow-run-table', searchParams.toString(), projectId],
    enabled: hasSeededDefaultRange,
    staleTime: 0,
    gcTime: 0,
    meta: { showErrorDialog: true, loadSubsetOptions: {} },
    queryFn: () => {
      const status = searchParams.getAll('status') as FlowRunStatus[];
      const flowId = searchParams.getAll('flowId');
      const cursor = searchParams.get(CURSOR_QUERY_PARAM);
      const flowRunIds = searchParams.getAll(RUN_IDS_QUERY_PARAM);
      const failedStepName = searchParams.get('failedStepName') || undefined;
      const failedStepMessage =
        searchParams.get('failedStepMessage') || undefined;
      const limit = searchParams.get(LIMIT_QUERY_PARAM)
        ? parseInt(searchParams.get(LIMIT_QUERY_PARAM)!)
        : 10;

      const createdAfter = searchParams.get('createdAfter');
      const createdBefore = searchParams.get('createdBefore');
      const archivedParam = searchParams.get('archivedAt');

      return flowRunsApi.list({
        status: status ?? undefined,
        projectId,
        flowId,
        cursor: cursor ?? undefined,
        limit,
        includeArchived: archivedParam === 'true',
        createdAfter: createdAfter ?? undefined,
        createdBefore: createdBefore ?? undefined,
        failedStepName,
        failedStepMessage,
        flowRunIds,
      });
    },
    refetchInterval: (query) => {
      const allRuns = query.state.data?.data;
      const runningRuns = allRuns?.filter(
        (run) =>
          !isFlowRunStateTerminal({
            status: run.status,
            ignoreInternalError: false,
          }),
      );
      return runningRuns?.length ? 15 * 1000 : false;
    },
  });
  const navigate = useNavigate();
  const isPlatformAdmin = useIsPlatformAdmin();
  const canViewInternalError = isPlatformAdmin;
  const columns = runsTableColumns({
    data,
    selectedRows,
    setSelectedRows,
    selectedAll,
    setSelectedAll,
    excludedRows,
    setExcludedRows,
    canViewInternalError,
    onViewError: setErrorDialogRun,
    onViewRun: (run) =>
      navigate(
        authenticationSession.appendProjectRoutePrefix(`/runs/${run.id}`),
      ),
  });

  const { data: flowsData, isFetching: isFetchingFlows } = flowHooks.useFlows({
    limit: 1000,
    cursor: undefined,
  });
  const openNewWindow = useNewWindow();
  const flows = flowsData?.data;
  const { checkAccess } = useAuthorization();
  const userHasPermissionToRetryRun = checkAccess(Permission.WRITE_RUN);

  const filters: DataTableFilters<keyof FlowRun | 'failedStepMessage'>[] =
    useMemo(
      () => [
        {
          type: 'select',
          title: t('Flow name'),
          accessorKey: 'flowId',
          options:
            flows?.map((flow) => ({
              label: flow.version.displayName,
              value: flow.id,
            })) || [],
          icon: CheckIcon,
        },
        {
          type: 'select',
          title: t('Status'),
          accessorKey: 'status',
          options: Object.values(FlowRunStatus).map((status) => {
            return {
              label: formatUtils.convertEnumToHumanReadable(status),
              value: status,
              icon: flowRunUtils.getStatusIcon(status).Icon,
            };
          }),
          icon: CheckIcon,
        },
        {
          type: 'input',
          title: t('Error message'),
          accessorKey: 'failedStepMessage',
          icon: SearchIcon,
        },
        {
          type: 'date',
          title: t('Created'),
          accessorKey: 'created',
          icon: CheckIcon,
          defaultPresetName: DEFAULT_DATE_PRESET,
        },
        {
          type: 'checkbox',
          title: t('Show archived'),
          accessorKey: 'archivedAt',
        },
      ],
      [flows],
    );

  const retryRuns = flowRunMutations.useBulkRetryRuns({
    onSuccess: (runs) => {
      const runsIds = runs.map((run) => run.id);
      setRetriedRunsIds(runsIds);
      const isAlreadyViewingRetriedRuns = searchParams.get(RUN_IDS_QUERY_PARAM);
      refetch();
      if (isAlreadyViewingRetriedRuns) {
        navigate(authenticationSession.appendProjectRoutePrefix(`/runs`));
        setSearchParams({
          [RUN_IDS_QUERY_PARAM]: runsIds,
          [LIMIT_QUERY_PARAM]: runsIds.length.toString(),
        });
      }
    },
    onPartialFailure: (failedRuns) => {
      setFailedRetryRuns(failedRuns);
      toast.error(
        t('{count} run(s) failed to retry', { count: failedRuns.length }),
        {
          action: {
            label: t('More'),
            onClick: () => setFailedRetryDialogOpen(true),
          },
          duration: 15000,
          closeButton: true,
          dismissible: true,
        },
      );
    },
  });

  const cancelRuns = flowRunMutations.useBulkCancelRuns({
    onSuccess: () => {
      refetch();
      setSelectedRows([]);
      setSelectedAll(false);
      setExcludedRows(new Set());
    },
  });

  const archiveRuns = flowRunMutations.useBulkArchiveRuns({
    onSuccess: () => {
      refetch();
    },
  });

  const bulkActions: BulkAction<FlowRun>[] = useMemo(
    () => [
      {
        render: (_, resetSelection) => {
          const isDisabled =
            selectedRows.length === 0 || !userHasPermissionToRetryRun;

          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Button
                disabled={isDisabled}
                variant="ghost"
                size="sm"
                loading={archiveRuns.isPending}
                onClick={() => {
                  const runIds = selectedRows.map((row) => row.id);
                  archiveRuns.mutate({
                    projectId,
                    flowRunIds: selectedAll ? undefined : runIds,
                    excludeFlowRunIds: selectedAll
                      ? Array.from(excludedRows)
                      : undefined,
                    status:
                      searchParams.getAll('status').length > 0
                        ? (searchParams.getAll('status') as FlowRunStatus[])
                        : undefined,
                    flowId: searchParams.getAll('flowId'),
                    createdAfter: searchParams.get('createdAfter') || undefined,
                    createdBefore:
                      searchParams.get('createdBefore') || undefined,
                    failedStepName:
                      searchParams.get('failedStepName') || undefined,
                    failedStepMessage:
                      searchParams.get('failedStepMessage') || undefined,
                  });
                  resetSelection();
                  setSelectedRows([]);
                }}
              >
                <Archive className="size-4 mr-1" />
                {selectedRows.length > 0
                  ? `${t('Archive')} ${
                      !isDisabled
                        ? selectedAll
                          ? excludedRows.size > 0
                            ? `${t('all except')} ${excludedRows.size}`
                            : t('all')
                          : `(${selectedRows.length})`
                        : ''
                    }`
                  : t('Archive')}
              </Button>
            </div>
          );
        },
      },
      {
        render: (_, resetSelection) => {
          const allCancellable = selectedRows.every(
            (row) =>
              row.status === FlowRunStatus.PAUSED ||
              row.status === FlowRunStatus.QUEUED,
          );
          const isDisabled =
            selectedRows.length === 0 ||
            !userHasPermissionToRetryRun ||
            !allCancellable;

          return (
            <div onClick={(e) => e.stopPropagation()}>
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToRetryRun}
              >
                <MessageTooltip
                  message={t('Only paused or queued runs can be cancelled')}
                  isDisabled={allCancellable}
                >
                  <Button
                    disabled={isDisabled}
                    variant="ghost"
                    size="sm"
                    loading={cancelRuns.isPending}
                    onClick={() => {
                      const runIds = selectedRows.map((row) => row.id);
                      const status = searchParams.getAll(
                        'status',
                      ) as FlowRunStatus[];
                      cancelRuns.mutate({
                        projectId,
                        flowRunIds: selectedAll ? undefined : runIds,
                        excludeFlowRunIds: selectedAll
                          ? Array.from(excludedRows)
                          : undefined,
                        status:
                          status.length > 0
                            ? (status.filter(
                                (s) =>
                                  s === FlowRunStatus.PAUSED ||
                                  s === FlowRunStatus.QUEUED,
                              ) as (
                                | typeof FlowRunStatus.PAUSED
                                | typeof FlowRunStatus.QUEUED
                              )[])
                            : undefined,
                        flowId: searchParams.getAll('flowId'),
                        createdAfter:
                          searchParams.get('createdAfter') || undefined,
                        createdBefore:
                          searchParams.get('createdBefore') || undefined,
                      });
                      resetSelection();
                    }}
                  >
                    <X className="h-3 w-4 mr-1" />
                    {selectedRows.length > 0
                      ? `${t('Cancel')} ${
                          selectedAll
                            ? excludedRows.size > 0
                              ? `${t('all except')} ${excludedRows.size}`
                              : t('all')
                            : `(${selectedRows.length})`
                        }`
                      : t('Cancel')}
                  </Button>
                </MessageTooltip>
              </PermissionNeededTooltip>
            </div>
          );
        },
      },
      {
        render: (_, resetSelection) => {
          const allFailed = selectedRows.every((row) =>
            isFailedState(row.status),
          );
          const isDisabled =
            selectedRows.length === 0 || !userHasPermissionToRetryRun;

          return (
            <div onClick={(e) => e.stopPropagation()}>
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToRetryRun}
              >
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild disabled={isDisabled}>
                    <Button
                      disabled={isDisabled}
                      variant="ghost"
                      size="sm"
                      loading={retryRuns.isPending}
                    >
                      <RotateCw className="size-4 mr-1" />
                      {selectedRows.length > 0
                        ? `${t('Retry')} ${
                            !isDisabled
                              ? selectedAll
                                ? excludedRows.size > 0
                                  ? `${t('all except')} ${excludedRows.size}`
                                  : t('all')
                                : `(${selectedRows.length})`
                              : ''
                          }`
                        : t('Retry')}
                      <ChevronDown className="h-3 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <PermissionNeededTooltip
                      hasPermission={userHasPermissionToRetryRun}
                    >
                      <DropdownMenuItem
                        disabled={!userHasPermissionToRetryRun}
                        onClick={() => {
                          const runIds = selectedRows.map((row) => row.id);
                          retryRuns.mutate({
                            projectId,
                            flowRunIds: selectedAll ? undefined : runIds,
                            strategy: FlowRetryStrategy.ON_LATEST_VERSION,
                            excludeFlowRunIds: selectedAll
                              ? Array.from(excludedRows)
                              : undefined,
                            status: searchParams.getAll(
                              'status',
                            ) as FlowRunStatus[],
                            flowId: searchParams.getAll('flowId'),
                            createdAfter:
                              searchParams.get('createdAfter') || undefined,
                            createdBefore:
                              searchParams.get('createdBefore') || undefined,
                            failedStepName:
                              searchParams.get('failedStepName') || undefined,
                            failedStepMessage:
                              searchParams.get('failedStepMessage') ||
                              undefined,
                          });
                          resetSelection();
                          setSelectedRows([]);
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-row gap-2 items-center">
                          <RotateCw className="h-4 w-4" />
                          <span>{t('on latest version')}</span>
                        </div>
                      </DropdownMenuItem>
                    </PermissionNeededTooltip>

                    {selectedRows.some((row) => isFailedState(row.status)) && (
                      <MessageTooltip
                        message={t(
                          'Only failed runs can be retried from failed step',
                        )}
                        isDisabled={!allFailed}
                      >
                        <DropdownMenuItem
                          disabled={!userHasPermissionToRetryRun || !allFailed}
                          onClick={() => {
                            const runIds = selectedRows.map((row) => row.id);
                            retryRuns.mutate({
                              projectId,
                              flowRunIds: selectedAll ? undefined : runIds,
                              strategy: FlowRetryStrategy.FROM_FAILED_STEP,
                              excludeFlowRunIds: selectedAll
                                ? Array.from(excludedRows)
                                : undefined,
                              status: searchParams.getAll(
                                'status',
                              ) as FlowRunStatus[],
                              flowId: searchParams.getAll('flowId'),
                              createdAfter:
                                searchParams.get('createdAfter') || undefined,
                              createdBefore:
                                searchParams.get('createdBefore') || undefined,
                              failedStepName:
                                searchParams.get('failedStepName') || undefined,
                              failedStepMessage:
                                searchParams.get('failedStepMessage') ||
                                undefined,
                            });
                            resetSelection();
                            setSelectedRows([]);
                            setSelectedAll(false);
                            setExcludedRows(new Set());
                          }}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-row gap-2 items-center">
                            <Redo className="h-4 w-4" />
                            <span>{t('from failed step')}</span>
                          </div>
                        </DropdownMenuItem>
                      </MessageTooltip>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </PermissionNeededTooltip>
            </div>
          );
        },
      },
    ],
    [
      retryRuns,
      archiveRuns,
      userHasPermissionToRetryRun,
      selectedRows,
      selectedAll,
      excludedRows,
      cancelRuns,
    ],
  );

  const handleRowClick = useCallback(
    (row: FlowRun, newWindow: boolean) => {
      if (newWindow) {
        openNewWindow(
          authenticationSession.appendProjectRoutePrefix(`/runs/${row.id}`),
        );
      } else {
        navigate(
          authenticationSession.appendProjectRoutePrefix(`/runs/${row.id}`),
        );
      }
    },
    [navigate, openNewWindow],
  );

  const retriedRunsInQueryParams = searchParams.getAll(RUN_IDS_QUERY_PARAM);
  const customFilters =
    retriedRunsInQueryParams.length > 0
      ? [
          <Button
            key="retried-runs-filter"
            variant="outline"
            onClick={() => {
              setSearchParams({});
              navigate(authenticationSession.appendProjectRoutePrefix(`/runs`));
            }}
          >
            <div className="flex flex-row gap-2 items-center">
              {t('Viewing retried runs')} ({retriedRunsInQueryParams.length}){' '}
              <X className="size-4" />
            </div>
          </Button>,
        ]
      : [];

  return (
    <div className="relative">
      <DataTable
        emptyStateTextTitle={t('No flow runs found')}
        emptyStateTextDescription={t(
          'Come back later when your automations start running',
        )}
        emptyStateIcon={<History className="size-14" />}
        columns={columns}
        page={data}
        isLoading={isLoading || isFetchingFlows}
        filters={customFilters.length > 0 ? [] : filters}
        bulkActions={bulkActions}
        onRowClick={(row, newWindow) => handleRowClick(row, newWindow)}
        customFilters={customFilters}
        toolbarButtons={[<RunsStatusChart key="status-chart" />]}
        hidePagination={retriedRunsInQueryParams.length > 0}
        mobileCard={(row) => <RunMobileCard run={row} />}
      />
      <RetriedRunsSnackbar
        retriedRunsIds={retriedRunsIds}
        clearRetriedRuns={() => setRetriedRunsIds([])}
      />
      <FailedRetryRunsDialog
        open={failedRetryDialogOpen}
        onOpenChange={setFailedRetryDialogOpen}
        failedRuns={failedRetryRuns}
      />
      <FailedStepDialog
        run={errorDialogRun}
        open={errorDialogRun !== null}
        onOpenChange={(open) => {
          if (!open) setErrorDialogRun(null);
        }}
      />
    </div>
  );
};
