import { FlowRun, PopulatedFlow } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { ReactFlowProvider } from '@xyflow/react';
import { t } from 'i18next';
import { useParams } from 'react-router-dom';

import { BuilderPage } from '@/app/builder';
import { BuilderStateProvider } from '@/app/builder/state/builder-state-provider';
import { PageLoadingSkeleton } from '@/components/custom/page-loading-skeleton';
import { flowRunsApi } from '@/features/flow-runs';
import { flowsApi, sampleDataHooks } from '@/features/flows';

const FlowRunPage = () => {
  const { runId, projectId } = useParams();
  const { data, isLoading } = useQuery<
    {
      run: FlowRun;
      flow: PopulatedFlow;
    },
    Error
  >({
    queryKey: ['run', runId],
    queryFn: async () => {
      const flowRun = await flowRunsApi.getPopulated(runId!);
      const flow = await flowsApi.get(flowRun.flowId, {
        versionId: flowRun.flowVersionId,
      });
      return {
        run: flowRun,
        flow: flow,
      };
    },
    enabled: runId !== undefined,
    refetchInterval: 15000,
    meta: {
      loadSubsetOptions: {},
      showErrorDialog: true,
    },
  });

  const { data: sampleData, isLoading: isSampleDataLoading } =
    sampleDataHooks.useSampleDataForFlow({
      flowVersion: data?.flow?.version,
      projectId,
    });

  const { data: sampleDataInput, isLoading: isSampleDataInputLoading } =
    sampleDataHooks.useSampleDataInputForFlow({
      flowVersion: data?.flow?.version,
      projectId,
    });

  if (isLoading || isSampleDataLoading || isSampleDataInputLoading) {
    return (
      <PageLoadingSkeleton
        className="h-full"
        label={t('Loading flow run')}
        mode="builder"
      />
    );
  }

  return (
    data && (
      <ReactFlowProvider>
        <BuilderStateProvider
          flow={data.flow}
          flowVersion={data.flow.version}
          readonly={true}
          hideTestWidget={false}
          run={data.run}
          outputSampleData={sampleData ?? {}}
          inputSampleData={sampleDataInput ?? {}}
        >
          <BuilderPage />
        </BuilderStateProvider>
      </ReactFlowProvider>
    )
  );
};

export { FlowRunPage };
