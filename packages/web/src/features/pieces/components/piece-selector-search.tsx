import { t } from 'i18next';
import { ArrowLeftIcon } from 'lucide-react';

import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import { usePieceSearchContext } from '@/features/pieces/stores/piece-search-context';
import {
  PieceSelectorTabType,
  usePieceSelectorTabs,
} from '@/features/pieces/stores/piece-selector-tabs-provider';

type PiecesSearchInputProps = {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onSearchChange: (query: string) => void;
};

const PiecesSearchInput = ({
  searchInputRef,
  onSearchChange,
}: PiecesSearchInputProps) => {
  const { searchQuery, setSearchQuery } = usePieceSearchContext();
  const {
    resetToBeforeNoneWasSelected: resetToPreviousValue,
    setSelectedTab,
    selectedPieceInExplore,
    selectedTab,
    setSelectedPieceInExplore,
  } = usePieceSelectorTabs();
  const showBackButton =
    selectedPieceInExplore && selectedTab === PieceSelectorTabType.EXPLORE;
  return (
    <div className="flex items-center gap-2 bg-muted/20 p-2.5">
      {showBackButton && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('Back')}
          onClick={() => {
            setSelectedPieceInExplore(null);
          }}
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
      )}
      <SearchInput
        placeholder={t('Search apps and actions')}
        value={searchQuery}
        data-testid="pieces-search-input"
        ref={searchInputRef}
        onChange={(e) => {
          setSearchQuery(e);
          onSearchChange(e);
          if (e === '') {
            resetToPreviousValue();
          } else {
            setSelectedTab(PieceSelectorTabType.NONE);
          }
        }}
      />
    </div>
  );
};
PiecesSearchInput.displayName = 'PiecesSearchInput';
export { PiecesSearchInput };
