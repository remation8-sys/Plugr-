import { FlowVersion, flowStructureUtil } from '@activepieces/shared';
import { useQuery, QueryClient } from '@tanstack/react-query';

import { sampleDataApi } from '../api/sample-data-api';

export const sampleDataHooks = {
  useSampleDataForFlow: ({
    flowVersion,
    projectId,
    enabled = true,
  }: SampleDataQueryParams) => {
    return useQuery({
      queryKey: ['flowSampleData', flowVersion?.id],
      enabled: !!flowVersion && enabled,
      staleTime: Infinity,
      retry: 1,
      refetchOnWindowFocus: false,
      queryFn: () =>
        sampleDataApi.getForFlow({
          flowId: flowVersion!.flowId,
          flowVersionId: flowVersion!.id,
          projectId: projectId!,
        }),
      select: (sampleData) => sampleData.output,
    });
  },
  useSampleDataInputForFlow: ({
    flowVersion,
    projectId,
    enabled = true,
  }: SampleDataQueryParams) => {
    return useQuery({
      queryKey: ['flowSampleData', flowVersion?.id],
      enabled: !!flowVersion && enabled,
      staleTime: Infinity,
      retry: 1,
      refetchOnWindowFocus: false,
      queryFn: () =>
        sampleDataApi.getForFlow({
          flowId: flowVersion!.flowId,
          flowVersionId: flowVersion!.id,
          projectId: projectId!,
        }),
      select: (sampleData) => {
        if (!flowVersion) {
          return sampleData.input;
        }
        return Object.fromEntries(
          flowStructureUtil
            .getAllSteps(flowVersion.trigger)
            .map((step) => [
              step.name,
              step.settings.sampleData?.sampleDataInputFileId
                ? sampleData.input[step.name]
                : undefined,
            ]),
        );
      },
    });
  },
  invalidateSampleData: (flowVersionId: string, queryClient: QueryClient) => {
    queryClient.invalidateQueries({
      queryKey: ['flowSampleData', flowVersionId],
    });
  },
};

type SampleDataQueryParams = {
  flowVersion: FlowVersion | undefined;
  projectId: string | undefined;
  enabled?: boolean;
};
