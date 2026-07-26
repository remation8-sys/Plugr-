import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from '@/components/ui/carousel';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

type CategoryFilterCarouselProps = {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  className?: string;
};

const CarouselContentWithButtons = ({
  className,
  categories,
  selectedCategory,
  onCategorySelect,
}: CategoryFilterCarouselProps) => {
  const { canScrollNext, canScrollPrev } = useCarousel();

  return (
    <div
      className="relative my-4 border-y py-3 transition-[padding] duration-200"
      style={{
        paddingLeft: canScrollPrev ? '3rem' : '0',
        paddingRight: canScrollNext ? '3rem' : '0',
      }}
    >
      <CarouselContent className={cn('-ml-2 gap-1', className)}>
        {categories.map((category) => (
          <CarouselItem key={category} className="basis-auto pl-2">
            <CategoryButton
              category={category}
              selected={selectedCategory === category}
              onSelect={onCategorySelect}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      {canScrollPrev && (
        <CarouselPrevious variant="ghost" className="left-0 z-10">
          <ChevronLeft className="h-4 w-4" />
        </CarouselPrevious>
      )}
      {canScrollNext && (
        <CarouselNext variant="ghost" className="right-0 z-10">
          <ChevronRight className="h-4 w-4" />
        </CarouselNext>
      )}
    </div>
  );
};

const CategoryFilterCarousel = ({
  categories,
  selectedCategory,
  onCategorySelect,
}: CategoryFilterCarouselProps) => {
  return (
    <>
      <div className="my-4 flex flex-wrap gap-2 border-y px-4 py-3 md:hidden">
        {categories.map((category) => (
          <CategoryButton
            key={category}
            category={category}
            selected={selectedCategory === category}
            onSelect={onCategorySelect}
          />
        ))}
      </div>
      <Carousel
        opts={{
          align: 'start',
          loop: false,
        }}
        className="hidden w-full md:block"
      >
        <CarouselContentWithButtons
          className={DASHBOARD_CONTENT_PADDING_X}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={onCategorySelect}
        />
      </Carousel>
    </>
  );
};

function CategoryButton({
  category,
  selected,
  onSelect,
}: {
  category: string;
  selected: boolean;
  onSelect: (category: string) => void;
}) {
  return (
    <Button
      variant="outline"
      onClick={() => onSelect(category)}
      className={cn(
        'h-auto min-h-10 whitespace-normal px-4 py-1.5 transition-colors',
        selected
          ? 'border-black bg-black text-white hover:!bg-black hover:!text-white'
          : 'border-none bg-transparent hover:!bg-sidebar-accent hover:!text-sidebar-accent-foreground',
      )}
    >
      {category}
    </Button>
  );
}

export { CategoryFilterCarousel };
