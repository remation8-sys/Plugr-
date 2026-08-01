import { t } from 'i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { PAGE_SIZE_OPTIONS } from '../lib/utils';

type AutomationsPaginationProps = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export const AutomationsPagination = ({
  currentPage,
  totalPages,
  pageSize,
  onPageSizeChange,
  onPrevPage,
  onNextPage,
}: AutomationsPaginationProps) => {
  const maxPages = Math.max(totalPages, 1);

  return (
    <div className="flex items-center justify-end gap-4 px-2 py-4 text-sm max-md:justify-between max-md:gap-2 max-md:px-4">
      <span className="mr-auto text-sm font-medium text-muted-foreground md:hidden">
        {t('Page {current} of {total}', {
          current: Math.min(currentPage + 1, maxPages),
          total: maxPages,
        })}
      </span>
      <div className="flex items-center gap-2 max-md:hidden">
        <span className="text-muted-foreground">{t('Rows per page')}</span>
        <Select
          value={String(pageSize)}
          onValueChange={(val) => onPageSizeChange(Number(val))}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onPrevPage}
        disabled={currentPage === 0}
        className="h-11 gap-1 max-md:size-11 max-md:px-0"
        aria-label={t('Previous page')}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="max-md:hidden">{t('Previous')}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onNextPage}
        disabled={currentPage >= maxPages - 1}
        className="h-11 gap-1 max-md:size-11 max-md:px-0"
        aria-label={t('Next page')}
      >
        <span className="max-md:hidden">{t('Next')}</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
