import { t } from 'i18next';
import { EllipsisVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const StepNodeChevron = ({ isSelected }: { isSelected?: boolean }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('Open node actions')}
          className={cn(
            'size-8 rounded-md border border-border/70 bg-background/95 text-muted-foreground shadow-sm opacity-0 transition-all hover:bg-accent hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary/25 group-hover:opacity-100',
            { 'opacity-100': isSelected },
          )}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (e.target) {
              const rightClickEvent = new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                view: window,
                button: 2,
                clientX: e.clientX,
                clientY: e.clientY,
              });
              e.target.dispatchEvent(rightClickEvent);
            }
          }}
        >
          <EllipsisVertical className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{t('Node actions')}</TooltipContent>
    </Tooltip>
  );
};

export { StepNodeChevron };
