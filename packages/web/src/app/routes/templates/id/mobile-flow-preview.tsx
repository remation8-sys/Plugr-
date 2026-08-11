import type { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  FlowActionType,
  FlowTrigger,
  FlowTriggerType,
  Step,
  flowStructureUtil,
} from '@activepieces/shared';
import { AlertTriangle, Braces, Check, GitBranch, Repeat2, Route, Zap } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  MobileFlowBranch,
  MobileFlowBranchKind,
  MobileFlowCardNode,
  projectFlowToMobileCards,
} from '@/app/builder/mobile/flow-card-projection';
import { PieceIcon, piecesHooks } from '@/features/pieces';
import { cn } from '@/lib/utils';

/**
 * Read-only, tap-free step list for previewing a template's flow on mobile.
 * Reuses the same tree-flattening logic the real mobile builder uses
 * (projectFlowToMobileCards) so branches/loops/routers render consistently,
 * but drops all the editing chrome (piece selector, status, action menus) -
 * a template preview has nothing to edit or run.
 *
 * Exists so mobile visitors never hit the drag-and-zoom react-flow canvas,
 * which the mobile builder itself deliberately moved away from.
 */
function TemplateFlowMobilePreview({ trigger }: { trigger: FlowTrigger }) {
  const projection = useMemo(() => projectFlowToMobileCards(trigger), [trigger]);
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

  return (
    <div className="size-full overflow-y-auto p-3">
      <TemplatePreviewSequence
        nodes={projection.sequence}
        stepNumberByName={projection.stepNumberByName}
        summariesByName={summariesByName}
      />
    </div>
  );
}

function TemplatePreviewSequence({
  nodes,
  stepNumberByName,
  summariesByName,
  nested = false,
}: TemplatePreviewSequenceProps) {
  return (
    <div className={cn('flex flex-col gap-3', nested && 'pl-2')}>
      {nodes.map((node) => (
        <div key={node.step.name}>
          <TemplatePreviewStepCard
            step={node.step}
            stepNumber={stepNumberByName.get(node.step.name) ?? 0}
            summary={getPieceSummary(node.step, summariesByName)}
          />
          {node.branches.length > 0 && (
            <div className="mt-3 space-y-3">
              {node.branches.map((branch) => (
                <TemplatePreviewBranch
                  key={branch.id}
                  branch={branch}
                  stepNumberByName={stepNumberByName}
                  summariesByName={summariesByName}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TemplatePreviewStepCard({
  step,
  stepNumber,
  summary,
}: TemplatePreviewStepCardProps) {
  const { t } = useTranslation();
  const isTrigger = flowStructureUtil.isTrigger(step.type);
  return (
    <div className="flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 shadow-sm">
      <StepArtwork step={step} summary={summary} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[0.95rem] font-semibold leading-5 text-foreground">
            {step.displayName}
          </span>
          {isTrigger && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
              {t('Trigger')}
            </span>
          )}
        </span>
        <span className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className="shrink-0">{stepNumber.toString().padStart(2, '0')}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">
            {summary?.displayName ?? getCoreStepLabel(step, t)}
          </span>
        </span>
      </span>
    </div>
  );
}

function TemplatePreviewBranch({
  branch,
  stepNumberByName,
  summariesByName,
}: TemplatePreviewBranchProps) {
  const { t } = useTranslation();
  const Icon = getBranchIcon(branch.kind);
  const label = getBranchLabel(branch, t);
  return (
    <section
      aria-label={label}
      className={cn(
        'ml-3 rounded-2xl border bg-background p-2.5',
        branch.kind === 'failure'
          ? 'border-destructive/25'
          : branch.kind === 'success'
          ? 'border-success/25'
          : 'border-border',
      )}
    >
      <div className="mb-2 flex items-center gap-2 px-1 py-1">
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-lg',
            branch.kind === 'failure'
              ? 'bg-destructive/10 text-destructive'
              : branch.kind === 'success'
              ? 'bg-success/10 text-success'
              : 'bg-primary/10 text-primary',
          )}
        >
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <span className="truncate text-sm font-semibold text-foreground">
          {label}
        </span>
      </div>
      {branch.content.length > 0 ? (
        <TemplatePreviewSequence
          nodes={branch.content}
          stepNumberByName={stepNumberByName}
          summariesByName={summariesByName}
          nested
        />
      ) : (
        <p className="px-1 pb-1 text-xs text-muted-foreground">
          {t('Empty path')}
        </p>
      )}
    </section>
  );
}

function StepArtwork({ step, summary }: StepArtworkProps) {
  if (summary) {
    return (
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background shadow-sm">
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
    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary shadow-sm">
      <Icon aria-hidden="true" className="size-5" />
    </span>
  );
}

function getPieceName(step: Step) {
  if (step.type === FlowTriggerType.PIECE || step.type === FlowActionType.PIECE) {
    return step.settings.pieceName;
  }
  return undefined;
}

function getPieceSummary(
  step: Step,
  summariesByName: ReadonlyMap<string, PieceMetadataModelSummary>,
) {
  const pieceName = getPieceName(step);
  return pieceName ? summariesByName.get(pieceName) : undefined;
}

function getCoreStepLabel(step: Step, t: (key: string) => string) {
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

function getBranchLabel(branch: MobileFlowBranch, t: (key: string) => string) {
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

type TemplatePreviewSequenceProps = {
  nodes: readonly MobileFlowCardNode[];
  stepNumberByName: ReadonlyMap<string, number>;
  summariesByName: ReadonlyMap<string, PieceMetadataModelSummary>;
  nested?: boolean;
};

type TemplatePreviewStepCardProps = {
  step: Step;
  stepNumber: number;
  summary?: PieceMetadataModelSummary;
};

type TemplatePreviewBranchProps = {
  branch: MobileFlowBranch;
  stepNumberByName: ReadonlyMap<string, number>;
  summariesByName: ReadonlyMap<string, PieceMetadataModelSummary>;
};

type StepArtworkProps = {
  step: Step;
  summary?: PieceMetadataModelSummary;
};

export { TemplateFlowMobilePreview };
