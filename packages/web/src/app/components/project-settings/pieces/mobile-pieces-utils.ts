import type { PieceMetadataModelSummary } from '@activepieces/pieces-framework';

function filterPieces({
  pieces,
  searchQuery,
}: FilterPiecesParams): PieceMetadataModelSummary[] {
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return pieces;
  }
  return pieces.filter(
    (piece) =>
      piece.displayName.toLocaleLowerCase().includes(normalizedQuery) ||
      piece.name.toLocaleLowerCase().includes(normalizedQuery),
  );
}

function getVisiblePieces({
  pieces,
  limit,
}: GetVisiblePiecesParams): PieceMetadataModelSummary[] {
  return pieces.slice(0, Math.max(0, limit));
}

const mobilePiecesUtils = {
  filterPieces,
  getVisiblePieces,
};

export { mobilePiecesUtils };

type FilterPiecesParams = {
  pieces: PieceMetadataModelSummary[];
  searchQuery: string;
};

type GetVisiblePiecesParams = {
  pieces: PieceMetadataModelSummary[];
  limit: number;
};
