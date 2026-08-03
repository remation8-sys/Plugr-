import {
  Template,
  TemplateTelemetryEventType,
  TemplateType,
  UncategorizedFolderId,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { PageHeader } from '@/components/custom/page-header';
import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import { flowHooks } from '@/features/flows';
import { templatesTelemetryApi, templatesHooks } from '@/features/templates';
import { platformHooks } from '@/hooks/platform-hooks';
import { useIsMobile } from '@/hooks/use-mobile';
import { DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

import { AllCategoriesView } from './all-categories-view';
import { CategoryFilterCarousel } from './category-filter-carousel';
import { EmptyTemplatesView } from './empty-templates-view';
import { SelectedCategoryView } from './selected-category-view';

const TemplatesPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: templateCategories } = templatesHooks.useTemplateCategories();
  const { platform } = platformHooks.useCurrentPlatform();
  const isShowingOfficialTemplates = !platform.plan.manageTemplatesEnabled;
  const templateType = isShowingOfficialTemplates
    ? TemplateType.OFFICIAL
    : TemplateType.CUSTOM;
  const fullTemplatesQuery = templatesHooks.useTemplates(
    templateType,
    !isMobile,
  );
  const summaryTemplatesQuery = templatesHooks.useTemplateSummaries({
    type: templateType,
    enabled: isMobile,
  });
  const { templates, isLoading, search, setSearch, category, setCategory } =
    isMobile ? summaryTemplatesQuery : fullTemplatesQuery;
  const selectedCategory = category as string;
  const { data: allOfficialTemplates, isLoading: isAllTemplatesLoading } =
    templatesHooks.useAllOfficialTemplates(
      !isMobile && isShowingOfficialTemplates,
    );
  const { mutate: createFlow, isPending: isCreateFlowPending } =
    flowHooks.useStartFromScratch(UncategorizedFolderId);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleTemplateSelect = useCallback(
    (template: Template) => {
      navigate(`/templates/${template.id}`);
      if (template.type === TemplateType.OFFICIAL) {
        templatesTelemetryApi.sendEvent({
          eventType: TemplateTelemetryEventType.VIEW,
          templateId: template.id,
        });
      }
    },
    [navigate],
  );

  const templatesByCategory = useMemo(() => {
    const grouped: Record<string, Template[]> = {} as Record<
      string,
      Template[]
    >;

    if (isShowingOfficialTemplates) {
      allOfficialTemplates?.forEach((template: Template) => {
        if (template.categories?.length) {
          template.categories?.forEach((category: string) => {
            if (!grouped[category]) {
              grouped[category] = [];
            }
            grouped[category].push(template);
          });
        }
      });
    }

    return grouped;
  }, [allOfficialTemplates, isShowingOfficialTemplates]);

  const categories = useMemo(() => {
    return ['All', ...(templateCategories || [])];
  }, [templateCategories]);

  const selectedCategoryTemplates = useMemo(() => {
    if (selectedCategory === 'All') {
      return templates || [];
    }
    if (isMobile) {
      return templates || [];
    }
    return templatesByCategory[selectedCategory] || [];
  }, [isMobile, selectedCategory, templates, templatesByCategory]);

  const showLoading =
    isLoading ||
    (!isMobile && isShowingOfficialTemplates && isAllTemplatesLoading);
  const showAllCategories =
    isShowingOfficialTemplates && selectedCategory === 'All';
  const hasTemplates = templates && templates.length > 0;
  const showCategoryTitleForOfficialTemplates =
    isShowingOfficialTemplates && selectedCategory !== 'All';

  return (
    <div>
      <div>
        <div className="sticky top-0 z-10 bg-background">
          <PageHeader
            showSidebarToggle={true}
            className="static"
            title={
              <>
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-between">
                  <SearchInput
                    value={search}
                    onChange={handleSearchChange}
                    placeholder={t('Search templates by name or description')}
                  ></SearchInput>
                  <div className="flex w-full justify-end sm:w-auto">
                    <Button
                      variant="outline"
                      className="h-full w-full gap-2 sm:w-auto"
                      onClick={() => createFlow()}
                      disabled={isCreateFlowPending}
                    >
                      <Plus className="w-4 h-4" />
                      {t('Start from scratch')}
                    </Button>
                  </div>
                </div>
              </>
            }
          ></PageHeader>

          {isShowingOfficialTemplates && categories && (
            <CategoryFilterCarousel
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={setCategory}
            />
          )}
        </div>
        <div className={DASHBOARD_CONTENT_PADDING_X}>
          {!hasTemplates && !showLoading ? (
            <EmptyTemplatesView />
          ) : showAllCategories && !isMobile ? (
            <AllCategoriesView
              templatesByCategory={templatesByCategory}
              categories={categories}
              onCategorySelect={setCategory}
              onTemplateSelect={handleTemplateSelect}
              isLoading={showLoading}
              hideHeader={!isShowingOfficialTemplates}
            />
          ) : (
            <SelectedCategoryView
              category={selectedCategory}
              templates={selectedCategoryTemplates}
              onTemplateSelect={handleTemplateSelect}
              isLoading={showLoading}
              showCategoryTitle={showCategoryTitleForOfficialTemplates}
              compact={isMobile}
            />
          )}
          {isMobile && summaryTemplatesQuery.hasNextPage && !showLoading && (
            <div className="flex justify-center py-6">
              <Button
                variant="outline"
                disabled={summaryTemplatesQuery.isFetchingNextPage}
                onClick={() => {
                  void summaryTemplatesQuery.fetchNextPage();
                }}
              >
                {summaryTemplatesQuery.isFetchingNextPage
                  ? t('Loading...')
                  : t('Load more')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { TemplatesPage };
