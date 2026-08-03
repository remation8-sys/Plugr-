import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { sampleDataHooks } from '@/features/flows';

import { useBuilderStateContext } from '../builder-hooks';

function MobileSampleDataBoundary({ children }: MobileSampleDataBoundaryProps) {
  const { t } = useTranslation();
  const flowVersion = useBuilderStateContext((state) => state.flowVersion);
  const projectId = useBuilderStateContext((state) => state.flow.projectId);
  const hydrateSampleData = useBuilderStateContext(
    (state) => state.hydrateSampleData,
  );
  const lastHydratedRevision = useRef<{
    flowVersionId: string;
    inputDataUpdatedAt: number;
    outputDataUpdatedAt: number;
  } | null>(null);
  const outputQuery = sampleDataHooks.useSampleDataForFlow({
    flowVersion,
    projectId,
  });
  const inputQuery = sampleDataHooks.useSampleDataInputForFlow({
    flowVersion,
    projectId,
  });

  useEffect(() => {
    if (!outputQuery.data || !inputQuery.data) {
      return;
    }
    const revision = {
      flowVersionId: flowVersion.id,
      inputDataUpdatedAt: inputQuery.dataUpdatedAt,
      outputDataUpdatedAt: outputQuery.dataUpdatedAt,
    };
    if (
      lastHydratedRevision.current?.flowVersionId === revision.flowVersionId &&
      lastHydratedRevision.current.inputDataUpdatedAt ===
        revision.inputDataUpdatedAt &&
      lastHydratedRevision.current.outputDataUpdatedAt ===
        revision.outputDataUpdatedAt
    ) {
      return;
    }
    hydrateSampleData({
      flowVersionId: flowVersion.id,
      input: inputQuery.data,
      output: outputQuery.data,
    });
    lastHydratedRevision.current = revision;
  }, [
    flowVersion.id,
    hydrateSampleData,
    inputQuery.data,
    inputQuery.dataUpdatedAt,
    outputQuery.data,
    outputQuery.dataUpdatedAt,
  ]);

  if (outputQuery.isError || inputQuery.isError) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className="m-3 flex items-center justify-between gap-3 rounded-xl border border-warning/35 bg-warning/10 p-3"
          role="alert"
        >
          <p className="text-sm font-medium text-foreground">
            {t('Something went wrong')}
          </p>
          <Button
            className="min-h-11 shrink-0"
            onClick={() => {
              void Promise.all([outputQuery.refetch(), inputQuery.refetch()]);
            }}
            type="button"
            variant="outline"
          >
            {t('Retry')}
          </Button>
        </div>
        {children}
      </div>
    );
  }

  return children;
}

export { MobileSampleDataBoundary };

type MobileSampleDataBoundaryProps = {
  children: React.ReactNode;
};
