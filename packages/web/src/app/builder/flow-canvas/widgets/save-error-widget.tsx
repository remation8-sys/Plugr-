import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import LargeWidgetWrapper from './large-widget-wrapper';

function SaveErrorWidget() {
  const { t } = useTranslation();

  return (
    <LargeWidgetWrapper containerClassName="border-destructive/35">
      <div className="flex min-w-0 items-start gap-2 text-destructive">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold">{t('Changes were not saved')}</p>
          <p className="text-xs leading-5 text-muted-foreground">
            {t(
              'Editing is paused. Reload the saved server version before continuing.',
            )}
          </p>
        </div>
      </div>
      <Button
        className="h-11 shrink-0"
        onClick={() => window.location.reload()}
        size="sm"
        variant="outline"
      >
        {t('Discard and reload')}
      </Button>
    </LargeWidgetWrapper>
  );
}

export { SaveErrorWidget };
