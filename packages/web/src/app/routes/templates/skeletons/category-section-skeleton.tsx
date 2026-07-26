import { TemplateCardSkeleton } from './template-card-skeleton';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';

type CategorySectionSkeletonProps = {
  hideHeader?: boolean;
};

const CategorySectionSkeleton = ({
  hideHeader = false,
}: CategorySectionSkeletonProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-4 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-8 w-40 max-w-[60%]" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[...Array(4)].map((_, index) => (
            <TemplateCardSkeleton
              key={index}
              showCategoryCarouselButton={hideHeader}
            />
          ))}
        </div>
      </div>

      <Carousel
        opts={{
          align: 'start',
          loop: false,
        }}
        className="hidden w-full md:block"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </div>

        <CarouselContent className="pb-3">
          {[...Array(4)].map((_, index) => (
            <CarouselItem
              key={index}
              className="min-w-0 md:basis-1/2 lg:basis-1/4 xl:basis-1/5"
            >
              <TemplateCardSkeleton showCategoryCarouselButton={hideHeader} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export { CategorySectionSkeleton };
