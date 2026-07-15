import { t } from 'i18next';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';

type SidebarHeaderProps = {
  children: React.ReactNode;
  onClose: () => void;
  leadingIcon?: React.ReactNode;
  actions?: React.ReactNode;
};
const SidebarHeader = ({
  children,
  onClose,
  leadingIcon,
  actions,
}: SidebarHeaderProps) => {
  return (
    <div className="flex min-h-[48px] w-full items-center gap-2 border-b bg-background/95 px-3 py-2 text-base backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {leadingIcon && <div className="shrink-0">{leadingIcon}</div>}
      <div className="flex items-center gap-2 min-w-0 grow">{children}</div>
      {actions}
      <Button
        variant="ghost"
        size={'sm'}
        className="size-8 shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label={t('Close')}
      >
        <X size={16} />
      </Button>
    </div>
  );
};

export { SidebarHeader };
