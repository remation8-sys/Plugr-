import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import {
  CATEGORY_PILLS,
  OnboardingCategory,
} from '../utils/piece-category-utils';

type CategoryFilterProps = {
  active: OnboardingCategory;
  onChange: (category: OnboardingCategory) => void;
};

function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        {CATEGORY_PILLS.map((cat) => (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors',
              active === cat
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border text-foreground hover:border-muted-foreground',
            )}
          >
            {cat}
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

CategoryFilter.displayName = 'CategoryFilter';
export { CategoryFilter };
