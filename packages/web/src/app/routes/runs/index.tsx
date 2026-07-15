import { t } from 'i18next';

import { EntityPageHeader } from '@/components/custom/entity-page-header';
import { RunsTable } from '@/features/flow-runs';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

const RunsPage = () => {
  return (
    <div className="mx-auto flex w-full max-w-screen-xl flex-col">
      <EntityPageHeader
        className={cn('pt-6 pb-2', DASHBOARD_CONTENT_PADDING_X)}
        title={t('Runs')}
        description={t('View your flow execution history')}
      />
      <RunsTable />
    </div>
  );
};

export { RunsPage };
