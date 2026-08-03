import { describe, expect, it } from 'vitest';

import { mobilePullToRefreshUtils } from '@/components/custom/mobile-pull-to-refresh';

describe('mobilePullToRefreshUtils', () => {
  it('selects only the automation list queries', () => {
    expect(
      mobilePullToRefreshUtils.getRefreshQueryRoots(
        '/projects/project-id/automations',
      ),
    ).toEqual(['folders', 'root-flows', 'root-tables', 'all-folder-contents']);
  });

  it('prefers the specific platform templates route', () => {
    expect(
      mobilePullToRefreshUtils.getRefreshQueryRoots(
        '/platform/setup/templates',
      ),
    ).toEqual(['templates']);
  });

  it('refreshes the active mobile template gallery summaries', () => {
    expect(
      mobilePullToRefreshUtils.getRefreshQueryRoots(
        '/projects/project-id/templates',
      ),
    ).toEqual(['template', 'templates', 'template-summaries']);
  });

  it('refreshes project rows and their visible connection totals together', () => {
    expect(
      mobilePullToRefreshUtils.getRefreshQueryRoots('/platform/projects'),
    ).toEqual(['projects', 'projects-for-platforms', 'globalConnections']);
  });

  it('matches the platform infrastructure and security routes', () => {
    expect(
      mobilePullToRefreshUtils.getRefreshQueryRoots(
        '/platform/infrastructure/workers',
      ),
    ).toEqual(['worker-machines']);
    expect(
      mobilePullToRefreshUtils.getRefreshQueryRoots(
        '/platform/security/audit-logs',
      ),
    ).toEqual(['audit-logs']);
  });

  it('disables pull-to-refresh on routes without scoped data', () => {
    expect(
      mobilePullToRefreshUtils.getRefreshQueryRoots(
        '/projects/project-id/flows/flow-id',
      ),
    ).toEqual([]);
  });
});
