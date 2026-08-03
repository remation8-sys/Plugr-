import type { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  FlowActionType,
  FlowRun,
  FlowOperationType,
  FlowRunStatus,
  FlowTriggerType,
  PasteLocation,
  Step,
  StepLocationRelativeToParent,
  StepOutputStatus,
  flowStructureUtil,
} from '@activepieces/shared';
import type { TFunction } from 'i18next';
import {
  AlertTriangle,
  ArrowLeftRight,
  Braces,
  Check,
  ChevronRight,
  CirclePause,
  CircleStop,
  ClipboardPlus,
  Copy,
  CopyPlus,
  GitBranch,
  LoaderCircle,
  MoreVertical,
  Plus,
  Repeat2,
  Route,
  RouteOff,
  Sparkles,
  Trash,
  Zap,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import {
  lazy,
  memo,
  ReactNode,
  Suspense,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { usePrevious } from 'react-use';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { flowRunUtils } from '@/features/flow-runs';
import {
  PieceIcon,
  PieceSelectorOperation,
  piecesHooks,
} from '@/features/pieces';
import { cn } from '@/lib/utils';

import { BuilderFlowStatusSection } from '../builder-header/flow-status';
import { useBuilderStateContext, useBuilderStateStore } from '../builder-hooks';
import {
  copySelectedNodes,
  deleteSelectedNodes,
  pasteNodes,
  toggleSkipSelectedNodes,
} from '../flow-canvas/utils/bulk-actions';
import { TestFlowWidget } from '../flow-canvas/widgets/test-flow-widget';

import {
  MobileFlowAddSlot,
  MobileFlowBranch,
  MobileFlowBranchKind,
  MobileFlowCardNode,
  MobileFlowProjection,
  projectFlowToMobileCards,
} from './flow-card-projection';
import {
  MobileViewportMount,
  MobileViewportMountProvider,
} from './mobile-viewport-mount';

const LazyPieceSelector = lazy(() =>
  import('../pieces-selector').then((module) => ({
    default: module.PieceSelector,
  })),
);

function MobileFlowBuilder() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const allowMotion = !prefersReducedMotion;
  const scrollRootRef = useRef<HTMLElement>(null);
  const currentRunStep = useMobileRunFollow({ allowMotion });
  const [selectedStep, flowTrigger, notesCount, openedPieceSelectorId] =
    useBuilderStateContext(
      useShallow((state) => [
        state.selectedStep,
        state.flowVersion.trigger,
        state.flowVersion.notes.length,
        state.openedPieceSelectorStepNameOrAddButtonId,
      ]),
    );
  const deferredFlowTrigger = useDeferredValue(flowTrigger);
  const projection = useMemo(
    () => projectFlowToMobileCards(deferredFlowTrigger),
    [deferredFlowTrigger],
  );
  const pieceNames = useMemo(
    () =>
      Array.from(
        new Set(
          Array.from(projection.stepByName.values()).flatMap((step) => {
            const pieceName = getPieceName(step);
            return pieceName ? [pieceName] : [];
          }),
        ),
      ),
    [projection],
  );
  const { summaries } = piecesHooks.usePieceSummariesByNames({
    names: pieceNames,
  });
  const summariesByName = useMemo(
    () => new Map(summaries.map((summary) => [summary.name, summary])),
    [summaries],
  );
  const openedSelectorOwnerStep = useMemo(() => {
    if (!openedPieceSelectorId) {
      return null;
    }
    return projection.stepByName.has(openedPieceSelectorId)
      ? openedPieceSelectorId
      : projection.selectorOwnerStepNameById.get(openedPieceSelectorId) ?? null;
  }, [openedPieceSelectorId, projection]);
  const pinnedStepNames = useMemo(() => {
    const pinnedNames = new Set<string>();
    [selectedStep, currentRunStep, openedSelectorOwnerStep].forEach(
      (stepName) => {
        if (!stepName) {
          return;
        }
        pinnedNames.add(stepName);
        projection.ancestorStepNamesByStepName
          .get(stepName)
          ?.forEach((ancestorName) => pinnedNames.add(ancestorName));
      },
    );
    return pinnedNames;
  }, [currentRunStep, openedSelectorOwnerStep, projection, selectedStep]);
  const renderingModel = useMemo<MobileFlowRenderingModel>(
    () => ({
      animateEntryMotion:
        allowMotion &&
        projection.totalSteps <= MAX_FLOW_STEPS_WITH_ENTRY_MOTION,
      animateStatusMotion:
        allowMotion &&
        projection.totalSteps <= MAX_FLOW_STEPS_WITH_STATUS_MOTION,
      pinnedStepNames,
      projection,
      summariesByName,
    }),
    [allowMotion, pinnedStepNames, projection, summariesByName],
  );

  return (
    <main
      ref={scrollRootRef}
      className="mobile-flow-builder relative h-full overflow-y-auto bg-builder-background"
      data-mobile-flow-builder
      data-mobile-scroll
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.14),transparent_68%)]"
      />
      <div className="relative mx-auto w-full max-w-xl px-3 pb-32 pt-28">
        <div className="mb-5 flex items-end justify-between gap-3 px-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {t('Flow map')}
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {t('Build the signal')}
            </h1>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="rounded-full border border-border/80 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              {t('{count} steps', {
                count: projection.totalSteps,
              })}
            </div>
            <BuilderFlowStatusSection />
          </div>
        </div>

        <div className="mb-5 px-1">
          <TestFlowWidget mobile />
        </div>

        <MobileViewportMountProvider scrollRootRef={scrollRootRef}>
          <MobileFlowSequence
            nodes={projection.sequence}
            renderingModel={renderingModel}
          />
        </MobileViewportMountProvider>

        {notesCount > 0 && (
          <aside className="mt-6 rounded-2xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              {t('{count} canvas notes', {
                count: notesCount,
              })}
            </p>
            <p className="mt-1 leading-5">
              {t(
                'Notes stay attached to the desktop canvas. Mobile keeps them read-only so their canvas positions are never changed.',
              )}
            </p>
          </aside>
        )}
      </div>
    </main>
  );
}

function useMobileRunFollow({ allowMotion }: { allowMotion: boolean }) {
  const [run, userManuallySelectedStepDuringRun] = useBuilderStateContext(
    useShallow((state) => [state.run, state.userManuallySelectedStepDuringRun]),
  );
  const previousRunStatus = usePrevious(run?.status);
  const currentStep = flowRunUtils.findLastStepWithStatus(
    previousRunStatus ?? FlowRunStatus.RUNNING,
    run?.steps ?? {},
  );

  useEffect(() => {
    if (!currentStep || userManuallySelectedStepDuringRun) {
      return;
    }

    const scrollTimer = window.setTimeout(() => {
      document
        .getElementById('mobile-flow-step-' + currentStep)
        ?.scrollIntoView({
          behavior: allowMotion ? 'smooth' : 'auto',
          block: 'center',
        });
    }, 180);

    return () => window.clearTimeout(scrollTimer);
  }, [allowMotion, currentStep, userManuallySelectedStepDuringRun]);

  return currentStep;
}

const MobileFlowSequence = memo(function MobileFlowSequence({
  nodes,
  renderingModel,
  nested = false,
}: MobileFlowSequenceProps) {
  return (
    <div className={cn('relative', nested && 'pl-2')}>
      {nodes.map((node, index) => (
        <MobileViewportMount
          key={node.step.name}
          eager={
            index <
            (nested
              ? EAGER_NESTED_MOBILE_NODE_COUNT
              : EAGER_ROOT_MOBILE_NODE_COUNT)
          }
          estimatedHeight={getEstimatedMobileNodeHeight(node, renderingModel)}
          id={'mobile-flow-step-' + node.step.name}
          pinned={renderingModel.pinnedStepNames.has(node.step.name)}
        >
          <MobileProjectedNode
            node={node}
            renderingModel={renderingModel}
            terminal={index === nodes.length - 1}
          />
        </MobileViewportMount>
      ))}
    </div>
  );
});

function MobileProjectedNode({
  node,
  renderingModel,
  terminal,
}: MobileProjectedNodeProps) {
  const status = useMobileStepStatus(node.step);
  const animateEntry = renderingModel.animateEntryMotion;

  return (
    <motion.div
      initial={animateEntry ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <MobileStepCard
        step={node.step}
        status={status}
        stepNumber={
          renderingModel.projection.stepNumberByName.get(node.step.name) ?? 0
        }
        summary={getPieceSummary(node.step, renderingModel.summariesByName)}
      />

      {node.branches.length > 0 && (
        <div className="mt-3 space-y-3">
          {node.branches.map((branch) => (
            <MobileBranchGroup
              key={branch.id}
              branch={branch}
              parentStep={node.step}
              renderingModel={renderingModel}
            />
          ))}
        </div>
      )}

      <MobileAddStep
        allowMotion={renderingModel.animateStatusMotion}
        slot={node.addAfter}
        status={status}
        terminal={terminal}
      />
    </motion.div>
  );
}

function getEstimatedMobileNodeHeight(
  node: MobileFlowCardNode,
  renderingModel: MobileFlowRenderingModel,
) {
  const descendantStepCount = node.branches.reduce(
    (count, branch) =>
      count +
      (renderingModel.projection.descendantStepNamesByBranchId.get(branch.id)
        ?.length ?? 0),
    0,
  );
  return (
    MOBILE_NODE_ESTIMATED_HEIGHT * (descendantStepCount + 1) +
    MOBILE_BRANCH_ESTIMATED_OVERHEAD * node.branches.length
  );
}

function MobileStepCard({
  step,
  status,
  stepNumber,
  summary,
}: MobileStepCardProps) {
  const { t } = useTranslation();
  const [
    readonly,
    selectedStep,
    selectedBranchIndex,
    selectStepByName,
    setSelectedBranchIndex,
  ] = useBuilderStateContext(
    useShallow((state) => [
      state.readonly,
      state.selectedStep,
      state.selectedBranchIndex,
      state.selectStepByName,
      state.setSelectedBranchIndex,
    ]),
  );
  const isSelected = selectedStep === step.name;
  const operation = getReplaceOperation(step);
  const statusView = getStatusView(status, t);
  const StatusIcon = statusView.icon;

  function openStep() {
    if (readonly && step.type === FlowTriggerType.EMPTY) {
      return;
    }
    if (selectedStep !== step.name) {
      selectStepByName(step.name);
      return;
    }
    if (selectedBranchIndex !== null) {
      setSelectedBranchIndex(null);
    }
  }

  return (
    <div
      className={cn(
        'group relative min-h-[5.25rem] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_-24px_rgba(0,0,0,0.55)] transition-[border-color,box-shadow,background-color] duration-200 focus-within:ring-2 focus-within:ring-primary/35',
        isSelected &&
          'border-primary/70 bg-primary/[0.035] shadow-[0_12px_34px_-22px_hsl(var(--primary)/0.55)]',
        status === 'running' && 'border-primary/60',
        status === 'failed' && 'border-destructive/60',
        'skip' in step && step.skip && 'opacity-65',
      )}
      data-mobile-flow-step={step.name}
    >
      <MobilePieceSelectorTrigger
        id={step.name}
        operation={operation}
        stepToReplacePieceDisplayName={summary?.displayName}
      >
        <button
          type="button"
          aria-label={t('Edit {stepName}', { stepName: step.displayName })}
          aria-pressed={isSelected}
          className="flex min-h-[5.25rem] w-full items-center gap-3 px-3.5 py-3 pr-14 text-left outline-none transition-transform active:scale-[0.985] motion-reduce:transition-none"
          onClick={openStep}
        >
          <MobileStepSignal status={status} />
          <StepArtwork step={step} summary={summary} />

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-[0.95rem] font-semibold leading-5 text-foreground">
                {step.displayName}
              </span>
              {flowStructureUtil.isTrigger(step.type) && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
                  {t('Trigger')}
                </span>
              )}
            </span>
            <span className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <span className="shrink-0">
                {stepNumber.toString().padStart(2, '0')}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate">
                {summary?.displayName ?? getCoreStepLabel(step, t)}
              </span>
            </span>
          </span>

          <span className="flex shrink-0 flex-col items-end gap-2">
            <span
              className={cn(
                'inline-flex min-h-6 items-center gap-1 rounded-full px-2 py-1 text-[0.68rem] font-semibold',
                statusView.className,
              )}
            >
              <StatusIcon
                aria-hidden="true"
                className={cn(
                  'size-3.5',
                  status === 'running' &&
                    'animate-spin motion-reduce:animate-none',
                )}
              />
              {statusView.label}
            </span>
          </span>
        </button>
      </MobilePieceSelectorTrigger>

      <MobileStepActions readonly={readonly} step={step} />
    </div>
  );
}

function MobilePieceSelectorTrigger({
  children,
  id,
  operation,
  stepToReplacePieceDisplayName,
}: MobilePieceSelectorTriggerProps) {
  const isOpen = useBuilderStateContext(
    (state) => state.openedPieceSelectorStepNameOrAddButtonId === id,
  );
  if (!isOpen) {
    return children;
  }
  return (
    <Suspense fallback={children}>
      <LazyPieceSelector
        id={id}
        operation={operation}
        openSelectorOnClick={false}
        stepToReplacePieceDisplayName={stepToReplacePieceDisplayName}
      >
        {children}
      </LazyPieceSelector>
    </Suspense>
  );
}

function MobileStepActions({ readonly, step }: MobileStepActionsProps) {
  const { t } = useTranslation();
  const builderStore = useBuilderStateStore();
  const [
    applyOperation,
    exitStepSettings,
    isSelected,
    setOpenedPieceSelectorStepNameOrAddButtonId,
  ] = useBuilderStateContext(
    useShallow((state) => [
      state.applyOperation,
      state.exitStepSettings,
      state.selectedStep === step.name,
      state.setOpenedPieceSelectorStepNameOrAddButtonId,
    ]),
  );
  const isTrigger = flowStructureUtil.isTrigger(step.type);
  const isSkipped = 'skip' in step && Boolean(step.skip);
  const selectedNodes = [step.name];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          aria-label={t('Actions for {stepName}', {
            stepName: step.displayName,
          })}
          className="absolute bottom-1.5 right-1.5 z-10 size-11 rounded-xl text-muted-foreground"
          size="icon"
          variant="ghost"
        >
          <MoreVertical aria-hidden="true" className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        {!readonly && (
          <DropdownMenuItem
            onClick={() =>
              setOpenedPieceSelectorStepNameOrAddButtonId(step.name)
            }
          >
            <ArrowLeftRight aria-hidden="true" className="size-4" />
            {t('Replace')}
          </DropdownMenuItem>
        )}
        {!isTrigger && (
          <DropdownMenuItem
            onClick={() => {
              void copySelectedNodes({
                selectedNodes,
                flowVersion: builderStore.getState().flowVersion,
              })
                .then(() => toast.success(t('Step copied')))
                .catch(() => toast.error(t('Could not access the clipboard')));
            }}
          >
            <Copy aria-hidden="true" className="size-4" />
            {t('Copy step')}
          </DropdownMenuItem>
        )}
        {!readonly && !isTrigger && (
          <DropdownMenuItem
            onClick={() =>
              applyOperation({
                type: FlowOperationType.DUPLICATE_ACTION,
                request: { stepName: step.name },
              })
            }
          >
            <CopyPlus aria-hidden="true" className="size-4" />
            {t('Duplicate')}
          </DropdownMenuItem>
        )}
        {!readonly && !isTrigger && (
          <DropdownMenuItem
            onClick={() =>
              toggleSkipSelectedNodes({
                selectedNodes,
                flowVersion: builderStore.getState().flowVersion,
                applyOperation,
              })
            }
          >
            {isSkipped ? (
              <Route aria-hidden="true" className="size-4" />
            ) : (
              <RouteOff aria-hidden="true" className="size-4" />
            )}
            {isSkipped ? t('Unskip') : t('Skip')}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => {
            void navigator.clipboard
              .writeText(`{{${step.name}['output']}}`)
              .then(() => toast.success(t('Reference copied to clipboard')))
              .catch(() => toast.error(t('Could not access the clipboard')));
          }}
        >
          <Braces aria-hidden="true" className="size-4" />
          {t('Copy reference')}
        </DropdownMenuItem>
        {!readonly && (
          <DropdownMenuItem
            onClick={() =>
              void pasteNodes(
                builderStore.getState().flowVersion,
                {
                  parentStepName: step.name,
                  stepLocationRelativeToParent:
                    StepLocationRelativeToParent.AFTER,
                },
                applyOperation,
              )
            }
          >
            <ClipboardPlus aria-hidden="true" className="size-4" />
            {t('Paste after')}
          </DropdownMenuItem>
        )}
        {!readonly && !isTrigger && (
          <>
            <DropdownMenuSeparator />
            <ConfirmationDeleteDialog
              title={t('Delete {stepName}?', {
                stepName: step.displayName,
              })}
              message={t(
                'This removes the step and anything nested inside it.',
              )}
              entityName={t('step')}
              buttonText={t('Delete')}
              mutationFn={async () => {
                deleteSelectedNodes({
                  selectedNodes,
                  applyOperation,
                  selectedStep: isSelected ? step.name : null,
                  exitStepSettings,
                });
              }}
            >
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={(event) => event.preventDefault()}
              >
                <Trash aria-hidden="true" className="size-4" />
                {t('Delete')}
              </DropdownMenuItem>
            </ConfirmationDeleteDialog>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileBranchGroup({
  branch,
  parentStep,
  renderingModel,
}: MobileBranchGroupProps) {
  const { t } = useTranslation();
  const branchStatus = useMobileBranchStatus(
    renderingModel.projection.descendantStepNamesByBranchId.get(branch.id) ??
      EMPTY_STEP_NAMES,
  );
  const [selectStepByName, setSelectedBranchIndex, readonly] =
    useBuilderStateContext(
      useShallow((state) => [
        state.selectStepByName,
        state.setSelectedBranchIndex,
        state.readonly,
      ]),
    );
  const label = getBranchLabel(branch, t);
  const Icon = getBranchIcon(branch.kind);

  function openBranchSettings() {
    selectStepByName(parentStep.name);
    setSelectedBranchIndex(
      branch.kind === 'router' ? branch.emptyAddSlot.branchIndex ?? null : null,
    );
  }

  return (
    <section
      aria-label={label}
      className={cn(
        'relative ml-3 rounded-2xl border bg-background p-2.5 shadow-sm',
        branch.kind === 'failure'
          ? 'border-destructive/25'
          : branch.kind === 'success'
          ? 'border-success/25'
          : 'border-border',
        branchStatus === 'running' &&
          'ring-1 ring-primary/45 shadow-[0_10px_32px_-24px_hsl(var(--primary)/0.7)]',
        branchStatus === 'succeeded' && 'ring-1 ring-success/35',
        branchStatus === 'failed' && 'ring-1 ring-destructive/45',
      )}
    >
      <button
        type="button"
        className="mb-2 flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/30 active:bg-muted"
        onClick={openBranchSettings}
        disabled={readonly && branch.kind !== 'router'}
      >
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            branch.kind === 'failure'
              ? 'bg-destructive/10 text-destructive'
              : branch.kind === 'success'
              ? 'bg-success/10 text-success'
              : 'bg-primary/10 text-primary',
          )}
        >
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">
            {label}
          </span>
          {branchStatus ? (
            <BranchStatus status={branchStatus} />
          ) : (
            <span className="block text-xs text-muted-foreground">
              {branch.content.length > 0
                ? t('Connected path')
                : t('Empty path')}
            </span>
          )}
        </span>
        {branch.kind === 'router' && (
          <ChevronRight
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
        )}
      </button>

      {branch.content.length > 0 ? (
        <MobileFlowSequence
          nodes={branch.content}
          renderingModel={renderingModel}
          nested
        />
      ) : (
        <MobileAddStep
          allowMotion={renderingModel.animateStatusMotion}
          slot={branch.emptyAddSlot}
          terminal
          emptyBranchLabel={label}
        />
      )}
    </section>
  );
}

function MobileAddStep({
  allowMotion,
  slot,
  terminal,
  status,
  emptyBranchLabel,
}: MobileAddStepProps) {
  const { t } = useTranslation();
  const builderStore = useBuilderStateStore();
  const [
    readonly,
    applyOperation,
    setOpenedPieceSelectorStepNameOrAddButtonId,
  ] = useBuilderStateContext(
    useShallow((state) => [
      state.readonly,
      state.applyOperation,
      state.setOpenedPieceSelectorStepNameOrAddButtonId,
    ]),
  );

  if (readonly) {
    return terminal ? null : (
      <MobileConnector allowMotion={allowMotion} status={status} />
    );
  }

  const label = emptyBranchLabel
    ? t('Add a step to {branch}', { branch: emptyBranchLabel })
    : terminal
    ? t('Add next step')
    : t('Add step here');

  return (
    <div className="relative flex min-h-14 flex-col items-center justify-center">
      <MobileConnector allowMotion={allowMotion} status={status} />
      <div className="relative z-10 flex items-center gap-2">
        <MobilePieceSelectorTrigger
          id={slot.id}
          operation={getAddOperation(slot)}
        >
          <button
            type="button"
            aria-label={label}
            className={cn(
              'flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-3 text-xs font-semibold text-muted-foreground shadow-sm outline-none transition-[border-color,color,box-shadow,background-color,transform] hover:border-primary/45 hover:bg-card hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/35 active:scale-95 active:bg-muted motion-reduce:transition-none',
              terminal && 'text-primary',
            )}
            onClick={() => setOpenedPieceSelectorStepNameOrAddButtonId(slot.id)}
          >
            <Plus aria-hidden="true" className="size-4" />
            {(terminal || emptyBranchLabel) && <span>{label}</span>}
          </button>
        </MobilePieceSelectorTrigger>
        {(terminal || emptyBranchLabel) && (
          <Button
            type="button"
            aria-label={t('Paste copied step here')}
            className="size-11 rounded-full bg-background shadow-sm"
            size="icon"
            variant="outline"
            onClick={() =>
              void pasteNodes(
                builderStore.getState().flowVersion,
                getPasteLocation(slot),
                applyOperation,
              )
            }
          >
            <ClipboardPlus aria-hidden="true" className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function MobileConnector({
  allowMotion,
  status,
}: {
  allowMotion: boolean;
  status?: MobileStepStatus;
}) {
  const isActive = status === 'running' || status === 'succeeded';
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border',
        isActive && 'bg-primary/45',
      )}
    >
      {status === 'running' && allowMotion && (
        <motion.span
          className="absolute left-1/2 top-0 size-2 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_14px_hsl(var(--primary)/0.8)]"
          animate={{ y: [0, 42, 0], opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.25, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </span>
  );
}

function MobileStepSignal({ status }: { status: MobileStepStatus }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute inset-y-3 left-0 w-0.5 rounded-r-full bg-transparent',
        status === 'running' && 'bg-primary',
        status === 'succeeded' && 'bg-success',
        status === 'failed' && 'bg-destructive',
        status === 'incomplete' && 'bg-warning',
      )}
    />
  );
}

function StepArtwork({ step, summary }: StepArtworkProps) {
  if (summary) {
    return (
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background shadow-sm">
        <PieceIcon
          displayName={summary.displayName}
          logoUrl={summary.logoUrl}
          showTooltip={false}
          size="lg"
        />
      </span>
    );
  }

  const Icon =
    step.type === FlowTriggerType.EMPTY
      ? Zap
      : step.type === FlowActionType.CODE
      ? Braces
      : step.type === FlowActionType.LOOP_ON_ITEMS
      ? Repeat2
      : Route;

  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary shadow-sm">
      <Icon aria-hidden="true" className="size-5" />
    </span>
  );
}

function useMobileStepStatus(step: Step): MobileStepStatus {
  const [run, loopIndexes, isBeingTested, hasError] = useBuilderStateContext(
    useShallow((state) => [
      state.run,
      state.loopsIndexes,
      Boolean(state.stepTestListeners[step.name]),
      Boolean(state.errorLogs[step.name]),
    ]),
  );

  if ('skip' in step && step.skip) {
    return 'skipped';
  }

  const runStatus = getStepRunStatus({
    stepName: step.name,
    run,
    loopIndexes,
  });
  if (runStatus) {
    return getRunStatus(runStatus);
  }
  if (!step.valid) {
    return 'incomplete';
  }
  if (isBeingTested) {
    return 'running';
  }
  if (hasError) {
    return 'failed';
  }

  const lastTestDate = step.settings?.sampleData?.lastTestDate;
  if (lastTestDate && step.lastUpdatedDate <= lastTestDate) {
    return 'tested';
  }
  return 'ready';
}

function useMobileBranchStatus(
  stepNames: readonly string[],
): MobileBranchStatus | null {
  const [run, loopIndexes] = useBuilderStateContext(
    useShallow((state) => [state.run, state.loopsIndexes]),
  );

  if (!run || stepNames.length === 0) {
    return null;
  }

  const statuses = stepNames.flatMap((stepName) => {
    const status = getStepRunStatus({ stepName, run, loopIndexes });
    return status ? [status] : [];
  });

  if (statuses.includes(StepOutputStatus.RUNNING)) {
    return 'running';
  }
  if (statuses.includes(StepOutputStatus.FAILED)) {
    return 'failed';
  }
  if (statuses.includes(StepOutputStatus.PAUSED)) {
    return 'paused';
  }
  if (statuses.includes(StepOutputStatus.STOPPED)) {
    return 'stopped';
  }
  if (statuses.includes(StepOutputStatus.SUCCEEDED)) {
    return 'succeeded';
  }
  return null;
}

function getStepRunStatus({
  stepName,
  run,
  loopIndexes,
}: GetStepRunStatusParams) {
  if (!run?.steps) {
    return undefined;
  }
  return flowRunUtils.extractStepOutput(stepName, loopIndexes, run.steps)
    ?.status;
}

function BranchStatus({ status }: { status: MobileBranchStatus }) {
  const { t } = useTranslation();
  const statusView = getStatusView(status, t);
  const Icon = statusView.icon;

  return (
    <span
      className={cn(
        'mt-0.5 inline-flex items-center gap-1 text-xs font-medium',
        getBranchStatusTextClass(status),
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'size-3',
          status === 'running' && 'animate-spin motion-reduce:animate-none',
        )}
      />
      {statusView.label}
    </span>
  );
}

function getBranchStatusTextClass(status: MobileBranchStatus) {
  switch (status) {
    case 'running':
      return 'text-primary';
    case 'succeeded':
      return 'text-success';
    case 'failed':
      return 'text-destructive';
    case 'paused':
      return 'text-warning';
    case 'stopped':
      return 'text-muted-foreground';
  }
}

function getRunStatus(status: StepOutputStatus): MobileStepStatus {
  switch (status) {
    case StepOutputStatus.RUNNING:
      return 'running';
    case StepOutputStatus.SUCCEEDED:
      return 'succeeded';
    case StepOutputStatus.FAILED:
      return 'failed';
    case StepOutputStatus.PAUSED:
      return 'paused';
    case StepOutputStatus.STOPPED:
      return 'stopped';
  }
}

function getReplaceOperation(step: Step): PieceSelectorOperation {
  if (flowStructureUtil.isTrigger(step.type)) {
    return { type: FlowOperationType.UPDATE_TRIGGER };
  }
  return {
    type: FlowOperationType.UPDATE_ACTION,
    stepName: step.name,
  };
}

function getAddOperation(slot: MobileFlowAddSlot): PieceSelectorOperation {
  if (
    slot.stepLocationRelativeToParent ===
    StepLocationRelativeToParent.INSIDE_BRANCH
  ) {
    return {
      type: FlowOperationType.ADD_ACTION,
      actionLocation: {
        parentStep: slot.parentStep,
        stepLocationRelativeToParent:
          StepLocationRelativeToParent.INSIDE_BRANCH,
        branchIndex: slot.branchIndex ?? 0,
      },
    };
  }
  return {
    type: FlowOperationType.ADD_ACTION,
    actionLocation: {
      parentStep: slot.parentStep,
      stepLocationRelativeToParent: slot.stepLocationRelativeToParent,
    },
  };
}

function getPasteLocation(slot: MobileFlowAddSlot): PasteLocation {
  if (
    slot.stepLocationRelativeToParent ===
    StepLocationRelativeToParent.INSIDE_BRANCH
  ) {
    return {
      parentStepName: slot.parentStep,
      stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH,
      branchIndex: slot.branchIndex ?? 0,
    };
  }
  return {
    parentStepName: slot.parentStep,
    stepLocationRelativeToParent: slot.stepLocationRelativeToParent,
  };
}

function getPieceSummary(
  step: Step,
  summariesByName: ReadonlyMap<string, PieceMetadataModelSummary>,
) {
  const pieceName = getPieceName(step);
  return pieceName ? summariesByName.get(pieceName) : undefined;
}

function getPieceName(step: Step) {
  if (
    step.type === FlowTriggerType.PIECE ||
    step.type === FlowActionType.PIECE
  ) {
    return step.settings.pieceName;
  }
  return undefined;
}

function getCoreStepLabel(step: Step, t: TFunction) {
  if (step.type === FlowTriggerType.EMPTY) {
    return t('Choose a trigger');
  }
  if (step.type === FlowActionType.CODE) {
    return t('Code');
  }
  if (step.type === FlowActionType.LOOP_ON_ITEMS) {
    return t('Loop');
  }
  if (step.type === FlowActionType.ROUTER) {
    return t('Router');
  }
  return t('Step');
}

function getBranchLabel(branch: MobileFlowBranch, t: TFunction) {
  switch (branch.kind) {
    case 'loop':
      return t('Loop body');
    case 'success':
      return t('On success');
    case 'failure':
      return t('On failure');
    case 'router':
      return branch.label;
  }
}

function getBranchIcon(kind: MobileFlowBranchKind) {
  switch (kind) {
    case 'loop':
      return Repeat2;
    case 'router':
      return GitBranch;
    case 'success':
      return Check;
    case 'failure':
      return AlertTriangle;
  }
}

function getStatusView(status: MobileStepStatus, t: TFunction) {
  switch (status) {
    case 'incomplete':
      return {
        label: t('Incomplete'),
        icon: AlertTriangle,
        className: 'bg-warning/10 text-warning',
      };
    case 'running':
      return {
        label: t('Running'),
        icon: LoaderCircle,
        className: 'bg-primary/10 text-primary',
      };
    case 'succeeded':
    case 'tested':
      return {
        label: status === 'tested' ? t('Tested') : t('Succeeded'),
        icon: Check,
        className: 'bg-success/10 text-success',
      };
    case 'failed':
      return {
        label: t('Failed'),
        icon: AlertTriangle,
        className: 'bg-destructive/10 text-destructive',
      };
    case 'paused':
      return {
        label: t('Paused'),
        icon: CirclePause,
        className: 'bg-warning/10 text-warning',
      };
    case 'stopped':
      return {
        label: t('Stopped'),
        icon: CircleStop,
        className: 'bg-muted text-muted-foreground',
      };
    case 'skipped':
      return {
        label: t('Skipped'),
        icon: CircleStop,
        className: 'bg-muted text-muted-foreground',
      };
    case 'ready':
      return {
        label: t('Ready'),
        icon: Sparkles,
        className: 'bg-muted text-muted-foreground',
      };
  }
}

type MobileStepStatus =
  | 'incomplete'
  | 'ready'
  | 'tested'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'paused'
  | 'stopped'
  | 'skipped';

type MobileBranchStatus = Extract<
  MobileStepStatus,
  'running' | 'succeeded' | 'failed' | 'paused' | 'stopped'
>;

type MobileFlowSequenceProps = {
  nodes: readonly MobileFlowCardNode[];
  renderingModel: MobileFlowRenderingModel;
  nested?: boolean;
};

type MobileProjectedNodeProps = {
  node: MobileFlowCardNode;
  renderingModel: MobileFlowRenderingModel;
  terminal: boolean;
};

type MobileStepCardProps = {
  step: Step;
  status: MobileStepStatus;
  stepNumber: number;
  summary?: PieceMetadataModelSummary;
};

type MobileStepActionsProps = {
  readonly: boolean;
  step: Step;
};

type MobilePieceSelectorTriggerProps = {
  children: ReactNode;
  id: string;
  operation: PieceSelectorOperation;
  stepToReplacePieceDisplayName?: string;
};

type MobileBranchGroupProps = {
  branch: MobileFlowBranch;
  parentStep: Step;
  renderingModel: MobileFlowRenderingModel;
};

type MobileAddStepProps = {
  allowMotion: boolean;
  slot: MobileFlowAddSlot;
  terminal: boolean;
  status?: MobileStepStatus;
  emptyBranchLabel?: string;
};

type StepArtworkProps = {
  step: Step;
  summary?: PieceMetadataModelSummary;
};

type MobileFlowRenderingModel = {
  animateEntryMotion: boolean;
  animateStatusMotion: boolean;
  pinnedStepNames: ReadonlySet<string>;
  projection: MobileFlowProjection;
  summariesByName: ReadonlyMap<string, PieceMetadataModelSummary>;
};

type GetStepRunStatusParams = {
  stepName: string;
  run: FlowRun | null;
  loopIndexes: Record<string, number>;
};

const EAGER_ROOT_MOBILE_NODE_COUNT = 5;
const EAGER_NESTED_MOBILE_NODE_COUNT = 0;
const MAX_FLOW_STEPS_WITH_ENTRY_MOTION = 12;
const MAX_FLOW_STEPS_WITH_STATUS_MOTION = 32;
const MOBILE_NODE_ESTIMATED_HEIGHT = 140;
const MOBILE_BRANCH_ESTIMATED_OVERHEAD = 72;
const EMPTY_STEP_NAMES: readonly string[] = [];

export { MobileFlowBuilder };
