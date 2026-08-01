import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { sampleDataHooks } from '@/features/flows';

import { useBuilderStateContext } from '../builder-hooks';

function MobileSampleDataBoundary({ children }: MobileSampleDataBoundaryProps) {
  const { t } = useTranslation();
  const flowVersion = useBuilderStateContext((state) => state.flowVersion);
  const projectId = useBuilderStateContext((state) => state.flow.projectId);
  const hydrateSampleData = useBuilderStateContext(
    (state) => state.hydrateSampleData,
  );
  const outputQuery = sampleDataHooks.useSampleDataForFlow({
    flowVersion,
    projectId,
  });
  const inputQuery = sampleDataHooks.useSampleDataInputForFlow({
    flowVersion,
    projectId,
  });

  useLayoutEffect(() => {
    if (!outputQuery.data || !inputQuery.data) {
      return;
    }
    hydrateSampleData({
      flowVersionId: flowVersion.id,
      input: inputQuery.data,
      output: outputQuery.data,
    });
  }, [flowVersion.id, hydrateSampleData, inputQuery.data, outputQuery.data]);

  if (outputQuery.isLoading || inputQuery.isLoading) {
    return <MobileSampleDataSkeleton />;
  }

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
              void outputQuery.refetch();
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

function MobileSampleDataSkeleton() {
  const { t } = useTranslation();
  return (
    <div
      aria-busy="true"
      aria-label={t('Loading...')}
      className="space-y-4 p-5"
      role="status"
    >
      <Skeleton className="h-6 w-2/5" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export { MobileSampleDataBoundary };

type MobileSampleDataBoundaryProps = {
  children: React.ReactNode;
};
