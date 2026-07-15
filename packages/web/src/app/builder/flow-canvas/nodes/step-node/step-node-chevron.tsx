import { EllipsisVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const StepNodeChevron = ({ isSelected }: { isSelected?: boolean }) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        'p-1 size-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100',
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
      <EllipsisVertical className="w-4 h-4 stroke-muted-foreground" />
    </Button>
  );
};

export { StepNodeChevron };
