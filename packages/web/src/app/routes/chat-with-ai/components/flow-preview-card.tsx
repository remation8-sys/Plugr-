import { isObject } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ExternalLink, Workflow, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { AnyToolPart, chatPartUtils } from '@/features/chat/lib/chat-types';
import { flowHooks } from '@/features/flows';

const MAX_VISIBLE_STEPS = 5;

export type FlowPreviewData = {
  flowId: string;
  projectId: string | null;
  flowUrl: string | null;
  displayName: string;
  stepCount: number;
  steps: string[];
};

/**
 * Pulls the flow summary out of a completed ap_build_flow tool call. Handles
 * both shapes the output arrives in: a live-stream object or a persisted JSON
 * string, each holding the MCP result { content, structuredContent }. Returns
 * null when anything is missing so the chat falls back to the plain tool pill.
 */
export function extractFlowPreviewFromPart(
  part: AnyToolPart,
): FlowPreviewData | null {
  const parsed = chatPartUtils.parseToolOutput(part);
  if (parsed.state !== 'success') return null;
  let output: unknown = parsed.data;
  if (!isObject(output)) return null;
  if (output.type === 'json' && isObject(output.value)) {
    output = output.value;
  }
  if (!isObject(output)) return null;
  const structured = isObject(output.structuredContent)
    ? output.structuredContent
    : output;
  const flowId = structured.flowId;
  if (typeof flowId !== 'string' || flowId.length === 0) return null;
  const steps = Array.isArray(structured.steps)
    ? structured.steps.filter((s): s is string => typeof s === 'string')
    : [];
  return {
    flowId,
    projectId:
      typeof structured.projectId === 'string' ? structured.projectId : null,
    flowUrl: typeof structured.flowUrl === 'string' ? structured.flowUrl : null,
    displayName:
      typeof structured.displayName === 'string' && structured.displayName
        ? structured.displayName
        : t('New flow'),
    stepCount:
      typeof structured.stepCount === 'number'
        ? structured.stepCount
        : steps.length,
    steps,
  };
}

function getBuilderPath(preview: FlowPreviewData): string | null {
  if (preview.projectId) {
    return `/projects/${preview.projectId}/flows/${preview.flowId}`;
  }
  if (preview.flowUrl) {
    try {
      return new URL(preview.flowUrl).pathname;
    } catch {
      return null;
    }
  }
  return null;
}

/** In-conversation summary of a flow Plugr just built, with activate/open actions. */
export function FlowPreviewCard({ preview }: { preview: FlowPreviewData }) {
  const navigate = useNavigate();
  const [activated, setActivated] = useState(false);
  const publishMutation = flowHooks.useChangeFlowStatus({
    flowId: preview.flowId,
    change: 'publish',
    onSuccess: () => {
      setActivated(true);
      toast.success(t('Flow activated'), {
        description: t('"{name}" is now live.', { name: preview.displayName }),
      });
    },
  });

  const builderPath = getBuilderPath(preview);
  const visibleSteps = preview.steps.slice(0, MAX_VISIBLE_STEPS);
  const hiddenStepCount = preview.stepCount - visibleSteps.length;

  return (
    <motion.div
      className="rounded-xl border bg-background overflow-hidden my-2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Workflow className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {preview.displayName}
          </div>
          <div className="text-xs text-muted-foreground">
            {preview.stepCount === 1
              ? t('1 step')
              : t('{count} steps', { count: preview.stepCount })}
          </div>
        </div>
      </div>

      {visibleSteps.length > 0 && (
        <ol className="mx-3.5 mb-2 space-y-1 rounded-lg bg-muted/40 px-3 py-2">
          {visibleSteps.map((step, i) => (
            <li
              key={`${step}-${i}`}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-background text-xs font-medium">
                {i + 1}
              </span>
              <span className="truncate">{step}</span>
            </li>
          ))}
          {hiddenStepCount > 0 && (
            <li className="pl-6 text-xs text-muted-foreground">
              {t('+ {count} more', { count: hiddenStepCount })}
            </li>
          )}
        </ol>
      )}

      <div className="flex flex-wrap items-center gap-2 px-3.5 pb-3">
        <Button
          size="sm"
          className="gap-1.5"
          disabled={activated || publishMutation.isPending}
          loading={publishMutation.isPending}
          onClick={() => publishMutation.mutate()}
        >
          {activated ? (
            <>
              <Check className="size-3.5" />
              {t('Active')}
            </>
          ) : (
            <>
              <Zap className="size-3.5" />
              {t('Activate Flow')}
            </>
          )}
        </Button>
        {builderPath && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => navigate(builderPath)}
          >
            <ExternalLink className="size-3.5" />
            {t('View in Builder')}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
