import { GetSampleDataRequest } from '@activepieces/shared';

import { api } from '@/lib/api';

export const sampleDataApi = {
  get(request: GetSampleDataRequest) {
    return api.get<unknown>(`/v1/sample-data`, request);
  },
  getForFlow(request: Omit<GetSampleDataRequest, 'stepName' | 'type'>) {
    return api.get<FlowSampleData>(`/v1/sample-data/flow`, request);
  },
};

type FlowSampleData = {
  input: Record<string, unknown>;
  output: Record<string, unknown>;
};
