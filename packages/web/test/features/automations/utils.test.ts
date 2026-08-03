import { FlowStatus, PopulatedFlow, Table } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { filterFolderContentForRecordFilters } from '@/features/automations/lib/utils';

describe('filterFolderContentForRecordFilters', () => {
  it('keeps folder-name search children inside the active type, status, and connection filters', () => {
    const matchingFlow = createFlow('matching-flow', FlowStatus.ENABLED, [
      'connection-a',
    ]);
    const wrongStatus = createFlow('wrong-status', FlowStatus.DISABLED, [
      'connection-a',
    ]);
    const wrongConnection = createFlow('wrong-connection', FlowStatus.ENABLED, [
      'connection-b',
    ]);
    const table = { id: 'table' } as Table;

    const result = filterFolderContentForRecordFilters(
      {
        flows: [matchingFlow, wrongStatus, wrongConnection],
        tables: [table],
        hasMore: true,
      },
      {
        typeFilter: ['flow'],
        statusFilter: [FlowStatus.ENABLED],
        connectionFilter: ['connection-a'],
      },
    );

    expect(result.flows.map((flow) => flow.id)).toEqual(['matching-flow']);
    expect(result.tables).toEqual([]);
    expect(result.hasMore).toBe(true);
  });
});

function createFlow(
  id: string,
  status: FlowStatus,
  connectionIds: string[],
): PopulatedFlow {
  return {
    id,
    status,
    version: { connectionIds },
  } as PopulatedFlow;
}
