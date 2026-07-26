import { useRef } from 'react';

import { useBuilderStateContext } from '../builder-hooks';

import { PieceActionsOrTriggersList } from './piece-actions-or-triggers-list';

import { CardListItem } from '@/components/custom/card-list';
import {
  PieceIcon,
  PieceSelectorOperation,
  StepMetadataWithSuggestions,
  PIECE_SELECTOR_ELEMENTS_HEIGHTS,
} from '@/features/pieces';
import { useIsMobile } from '@/hooks/use-mobile';
import { wait } from '@/lib/dom-utils';
import { cn } from '@/lib/utils';

type PieceCardListItemProps = {
  pieceMetadata: StepMetadataWithSuggestions;
  searchQuery: string;
  operation: PieceSelectorOperation;
  isTemporaryDisabledUntilNextCursorMove: boolean;
};

const PieceCardListItem = ({
  pieceMetadata,
  searchQuery,
  operation,
  isTemporaryDisabledUntilNextCursorMove,
}: PieceCardListItemProps) => {
  const isMobile = useIsMobile();
  const showSuggestions = searchQuery.length > 0 || isMobile;
  const isMouseOver = useRef(false);
  const selectPieceMetatdata = async () => {
    if (isTemporaryDisabledUntilNextCursorMove || showSuggestions) {
      return;
    }
    isMouseOver.current = true;
    await wait(250);
    if (isMouseOver.current) {
      setSelectedPieceMetadataInPieceSelector(pieceMetadata);
    }
  };
  const [
    selectedPieceMetadataInPieceSelector,
    setSelectedPieceMetadataInPieceSelector,
  ] = useBuilderStateContext((state) => [
    state.selectedPieceMetadataInPieceSelector,
    state.setSelectedPieceMetadataInPieceSelector,
  ]);
  const itemHeight = PIECE_SELECTOR_ELEMENTS_HEIGHTS.PIECE_ITEM_HEIGHT;
  return (
    <>
      <CardListItem
        className={cn(
          'mx-1.5 flex-col items-start gap-1 truncate rounded-md border border-transparent px-3 py-2 text-sm transition-colors hover:border-border/70',
          {
            'hover:bg-transparent!': isTemporaryDisabledUntilNextCursorMove,
          },
        )}
        style={{ height: `${itemHeight}px`, maxHeight: `${itemHeight}px` }}
        selected={
          selectedPieceMetadataInPieceSelector?.displayName ===
            pieceMetadata.displayName && searchQuery.length === 0
        }
        interactive={!showSuggestions}
        onMouseEnter={selectPieceMetatdata}
        onMouseMove={selectPieceMetatdata}
        onClick={() => {
          if (!showSuggestions) {
            setSelectedPieceMetadataInPieceSelector(pieceMetadata);
          }
        }}
        onMouseLeave={() => {
          isMouseOver.current = false;
        }}
        id={pieceMetadata.displayName}
        data-testid={pieceMetadata.displayName}
      >
        <div className="flex h-full min-w-0 items-center gap-2">
          <PieceIcon
            logoUrl={pieceMetadata.logoUrl}
            displayName={pieceMetadata.displayName}
            showTooltip={false}
            size={'sm'}
          />
          <div className="flex h-full min-w-0 grow items-center truncate text-sm font-medium">
            {pieceMetadata.displayName}
          </div>
        </div>
      </CardListItem>

      {showSuggestions && (
        <div>
          <PieceActionsOrTriggersList
            stepMetadataWithSuggestions={pieceMetadata}
            hidePieceIconAndDescription={true}
            operation={operation}
          />
        </div>
      )}
    </>
  );
};

PieceCardListItem.displayName = 'PieceCardListItem';
export { PieceCardListItem };
