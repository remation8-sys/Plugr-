import { t } from 'i18next';
import { SearchX } from 'lucide-react';

import { EmptyView } from '@/components/custom/empty-view';
import { Button } from '@/components/ui/button';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

type AutomationsNoResultsStateProps = {
  onClearFilters: () => void;
};

export const AutomationsNoResultsState = ({
  onClearFilters,
}: AutomationsNoResultsStateProps) => {
  return (
    <div className={cn('py-6', DASHBOARD_CONTENT_PADDING_X)}>
      <EmptyView
        icon={<SearchX />}
        title={t('No results found')}
        description={t(
          "We couldn't find any automations matching your search or filters. Try adjusting your criteria.",
        )}
        action={
          <Button variant="outline" onClick={onClearFilters}>
            {t('Clear filters')}
          </Button>
        }
      />
    </div>
  );
};
