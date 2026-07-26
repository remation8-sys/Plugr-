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
    <div className="flex w-full flex-wrap gap-2 pb-2">
      {CATEGORY_PILLS.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={cn(
            'min-h-11 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors md:min-h-10',
            active === cat
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-foreground hover:border-muted-foreground',
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

CategoryFilter.displayName = 'CategoryFilter';
export { CategoryFilter };
