import { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const CanvasControlButton = ({
  tooltip,
  icon: Icon,
  iconClassName,
  active = false,
  disabled = false,
  onClick,
}: {
  tooltip: string;
  icon: LucideIcon;
  iconClassName?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? 'default' : 'ghost'}
          size="icon"
          aria-label={tooltip}
          disabled={disabled}
          className={cn(
            'size-9 rounded-md transition-all duration-150 motion-reduce:transition-none',
            active
              ? 'shadow-sm hover:bg-primary/90'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
          onClick={onClick}
        >
          <Icon className={cn('size-4', iconClassName)} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  );
};

export { CanvasControlButton };
