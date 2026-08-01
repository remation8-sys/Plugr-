import type { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { PackageType, PieceType } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { mobilePiecesUtils } from '@/app/components/project-settings/pieces/mobile-pieces-utils';

describe('mobilePiecesUtils', () => {
  const pieces = [
    createPiece({ name: '@plugr/gmail', displayName: 'Gmail' }),
    createPiece({ name: '@plugr/google-sheets', displayName: 'Google Sheets' }),
    createPiece({ name: '@plugr/slack', displayName: 'Slack' }),
  ];

  it('filters by display name or package name without case sensitivity', () => {
    expect(
      mobilePiecesUtils
        .filterPieces({ pieces, searchQuery: 'GOOGLE' })
        .map((piece) => piece.displayName),
    ).toEqual(['Google Sheets']);
    expect(
      mobilePiecesUtils
        .filterPieces({ pieces, searchQuery: '@plugr/slack' })
        .map((piece) => piece.displayName),
    ).toEqual(['Slack']);
  });

  it('limits the number of rendered mobile cards', () => {
    const manyPieces = Array.from({ length: 45 }, (_, index) =>
      createPiece({
        name: `@plugr/piece-${index}`,
        displayName: `Piece ${index}`,
      }),
    );

    expect(
      mobilePiecesUtils.getVisiblePieces({
        pieces: manyPieces,
        limit: 20,
      }),
    ).toHaveLength(20);
  });
});

function createPiece({
  name,
  displayName,
}: CreatePieceParams): PieceMetadataModelSummary {
  return {
    actions: 0,
    authors: [],
    contextInfo: undefined,
    description: '',
    displayName,
    logoUrl: '',
    name,
    packageType: PackageType.REGISTRY,
    pieceType: PieceType.OFFICIAL,
    projectUsage: 0,
    triggers: 0,
    version: '1.0.0',
  };
}

type CreatePieceParams = {
  name: string;
  displayName: string;
};
