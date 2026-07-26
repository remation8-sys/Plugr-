import { Template } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ExploreTemplateCard } from '@/features/templates/components/explore-template-card';

type CategorySectionProps = {
  category: string;
  templates: Template[];
  onCategorySelect: (category: string) => void;
  onTemplateSelect: (template: Template) => void;
};

const CategorySection = React.memo(
  ({
    category,
    templates,
    onCategorySelect,
    onTemplateSelect,
  }: CategorySectionProps) => {
    if (!templates || templates.length === 0) return null;

    return (
      <section className="space-y-4">
        <div className="space-y-4 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <h2 className="min-w-0 text-xl font-medium">{category}</h2>
            <Button
              variant="ghost"
              onClick={() => onCategorySelect(category)}
              className="shrink-0"
            >
              {t('View all')}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {templates.map((template) => (
              <ExploreTemplateCard
                key={template.id}
                template={template}
                onTemplateSelect={onTemplateSelect}
              />
            ))}
          </div>
        </div>

        <Carousel
          opts={{
            align: 'start',
            loop: false,
            slidesToScroll: 'auto',
          }}
          className="hidden w-full md:block"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-xl font-medium">{category}</h2>
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => onCategorySelect(category)}
              >
                {t('View all')}
              </Button>
              <CarouselPrevious
                variant="ghost"
                className="static h-8 w-8 translate-y-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </CarouselPrevious>
              <CarouselNext
                variant="ghost"
                className="static h-8 w-8 translate-y-0"
              >
                <ChevronRight className="h-4 w-4" />
              </CarouselNext>
            </div>
          </div>

          <CarouselContent className="pb-3">
            {templates.map((template) => (
              <CarouselItem
                key={template.id}
                className="min-w-0 md:basis-1/2 lg:basis-1/4 xl:basis-1/5"
              >
                <ExploreTemplateCard
                  template={template}
                  onTemplateSelect={onTemplateSelect}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </section>
    );
  },
);

CategorySection.displayName = 'CategorySection';

export { CategorySection };
