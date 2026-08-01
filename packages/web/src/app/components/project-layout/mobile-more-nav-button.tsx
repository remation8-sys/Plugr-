import { MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

function MobileMoreNavButton({ active, onClick }: MobileMoreNavButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      aria-label={t('More')}
      className={cn(
        'relative flex min-h-11 min-w-0 flex-1 touch-manipulation flex-col items-center justify-center gap-1 px-1 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary active:bg-muted',
        active && 'text-primary hover:text-primary',
      )}
      onClick={onClick}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute top-0 h-0.5 w-8 rounded-b-full bg-primary"
        />
      )}
      <MoreHorizontal aria-hidden="true" className="size-5" />
      <span className="max-w-full truncate text-xs font-medium leading-none">
        {t('More')}
      </span>
    </button>
  );
}

type MobileMoreNavButtonProps = {
  active: boolean;
  onClick: () => void;
};

export { MobileMoreNavButton };
