import type { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { isNil, PieceType } from '@activepieces/shared';
import { Package, Search, Trash } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RequestTrial } from '@/app/components/request-trial';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { LockedAlert } from '@/components/custom/locked-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { piecesApi, PieceIcon, piecesHooks } from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';

import { MobileManagePiecesDialog } from './mobile-manage-pieces-dialog';
import { mobilePiecesUtils } from './mobile-pieces-utils';

const MOBILE_PAGE_SIZE = 20;

function MobilePiecesSettings() {
  const { t } = useTranslation();
  const { platform } = platformHooks.useCurrentPlatform();
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(MOBILE_PAGE_SIZE);
  const { pieces, isLoading, refetch } = piecesHooks.usePieces({
    searchQuery: '',
    isTableQuery: true,
  });
  const allPieces = useMemo(() => pieces ?? [], [pieces]);
  const filteredPieces = useMemo(
    () =>
      mobilePiecesUtils.filterPieces({
        pieces: allPieces,
        searchQuery,
      }),
    [allPieces, searchQuery],
  );
  const visiblePieces = mobilePiecesUtils.getVisiblePieces({
    pieces: filteredPieces,
    limit: visibleLimit,
  });

  useEffect(() => {
    setVisibleLimit(MOBILE_PAGE_SIZE);
  }, [searchQuery]);

  return (
    <div className="space-y-4">
      {!platform.plan.managePiecesEnabled && (
        <LockedAlert
          button={
            <RequestTrial
              buttonVariant="basic"
              featureKey="ENTERPRISE_PIECES"
            />
          }
          description={t(
            "Show the plugs that matter most to your users and hide the ones you don't like.",
          )}
          title={t('Control Plugs')}
        />
      )}

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label={t('Plug Name')}
            className="h-11 pl-9 text-base"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('Search...')}
            type="search"
            value={searchQuery}
          />
        </div>
        {platform.plan.managePiecesEnabled && (
          <MobileManagePiecesDialog
            onSuccess={() => {
              void refetch();
            }}
            visiblePieces={allPieces}
          />
        )}
      </div>

      {isLoading ? (
        <MobilePiecesSkeleton />
      ) : visiblePieces.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-2 py-16 text-center"
          role="status"
        >
          <Package
            aria-hidden="true"
            className="size-12 text-muted-foreground"
          />
          <p className="font-medium">{t('No plugs found')}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span aria-label={t('Plugs')}>
              {visiblePieces.length} / {filteredPieces.length}
            </span>
          </div>
          <ul className="space-y-2" role="list">
            {visiblePieces.map((piece) => (
              <MobilePieceCard
                key={`${piece.name}:${piece.version}`}
                onDeleted={() => {
                  void refetch();
                }}
                piece={piece}
              />
            ))}
          </ul>
          {visiblePieces.length < filteredPieces.length && (
            <Button
              className="h-11 w-full"
              onClick={() =>
                setVisibleLimit((current) => current + MOBILE_PAGE_SIZE)
              }
              type="button"
              variant="outline"
            >
              {t('Load more')}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function MobilePieceCard({ piece, onDeleted }: MobilePieceCardProps) {
  const { t } = useTranslation();
  const canDelete = piece.pieceType === PieceType.CUSTOM && !isNil(piece.id);

  return (
    <li className="flex min-h-16 items-center gap-3 rounded-lg border bg-card p-3">
      <PieceIcon
        border
        displayName={piece.displayName}
        logoUrl={piece.logoUrl}
        showTooltip={false}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{piece.displayName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {piece.version}
        </p>
      </div>
      {canDelete && (
        <ConfirmationDeleteDialog
          entityName={t('Plug')}
          message={t(
            'This will permanently delete this plug, all steps using it will fail.',
          )}
          mutationFn={async () => {
            if (isNil(piece.id)) {
              return;
            }
            await piecesApi.delete(piece.id);
            onDeleted();
          }}
          title={t('Delete {name}', { name: piece.displayName })}
        >
          <Button
            aria-label={t('Delete {name}', { name: piece.displayName })}
            className="size-11 shrink-0"
            size="icon"
            variant="ghost"
          >
            <Trash aria-hidden="true" className="size-4 text-destructive" />
          </Button>
        </ConfirmationDeleteDialog>
      )}
    </li>
  );
}

function MobilePiecesSkeleton() {
  const { t } = useTranslation();

  return (
    <div
      aria-busy="true"
      aria-label={t('Plugs')}
      className="space-y-2"
      role="status"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

export { MobilePiecesSettings };

type MobilePieceCardProps = {
  piece: PieceMetadataModelSummary;
  onDeleted: () => void;
};
