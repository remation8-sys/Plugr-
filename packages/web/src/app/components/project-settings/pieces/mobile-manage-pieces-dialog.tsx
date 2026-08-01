import type { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { PiecesFilterType } from '@activepieces/shared';
import { Check, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PieceIcon, piecesHooks } from '@/features/pieces';
import { projectCollectionUtils } from '@/features/projects';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { mobilePiecesUtils } from './mobile-pieces-utils';

const MOBILE_MANAGE_PAGE_SIZE = 20;

function MobileManagePiecesDialog({
  visiblePieces,
  onSuccess,
}: MobileManagePiecesDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        className="size-11 shrink-0"
        onClick={() => setOpen(true)}
        size="icon"
        type="button"
        variant="outline"
      >
        <Check aria-hidden="true" className="size-4" />
        <span className="sr-only">{t('Manage Plugs')}</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        {open && (
          <DialogContent className="flex h-dvh max-h-dvh flex-col gap-0 overflow-hidden max-md:p-0">
            <MobileManagePiecesContent
              onClose={() => setOpen(false)}
              onSuccess={onSuccess}
              visiblePieces={visiblePieces}
            />
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function MobileManagePiecesContent({
  visiblePieces,
  onClose,
  onSuccess,
}: MobileManagePiecesContentProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(MOBILE_MANAGE_PAGE_SIZE);
  const [selectedPieces, setSelectedPieces] = useState(() =>
    visiblePieces.map((piece) => piece.name),
  );
  const { pieces: allPieces, isLoading } = piecesHooks.usePieces({
    searchQuery: '',
    includeHidden: true,
    isTableQuery: true,
  });
  const filteredPieces = useMemo(
    () =>
      mobilePiecesUtils.filterPieces({
        pieces: allPieces ?? [],
        searchQuery,
      }),
    [allPieces, searchQuery],
  );
  const renderedPieces = mobilePiecesUtils.getVisiblePieces({
    pieces: filteredPieces,
    limit: visibleLimit,
  });

  useEffect(() => {
    setVisibleLimit(MOBILE_MANAGE_PAGE_SIZE);
  }, [searchQuery]);

  const togglePiece = (pieceName: string) => {
    setSelectedPieces((current) =>
      current.includes(pieceName)
        ? current.filter((name) => name !== pieceName)
        : [...current, pieceName],
    );
  };

  const handleSave = () => {
    projectCollectionUtils.update(authenticationSession.getProjectId()!, {
      plan: {
        piecesFilterType: PiecesFilterType.ALLOWED,
        pieces: selectedPieces,
      },
    });
    onSuccess();
    onClose();
  };

  return (
    <>
      <DialogHeader className="shrink-0 border-b px-4 pb-3 pr-14 pt-[max(0.75rem,env(safe-area-inset-top))] text-left">
        <DialogTitle>{t('Manage Plugs')}</DialogTitle>
        <DialogDescription>
          {t(
            'Choose which plugs you want to be available for your current project users',
          )}
        </DialogDescription>
      </DialogHeader>

      <div className="shrink-0 border-b p-4">
        <div className="relative">
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
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        {isLoading ? (
          <div
            aria-busy="true"
            aria-label={t('Manage Plugs')}
            className="space-y-2"
            role="status"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <ul className="space-y-2" role="list">
            {renderedPieces.map((piece) => {
              const checked = selectedPieces.includes(piece.name);
              return (
                <li key={`${piece.name}:${piece.version}`}>
                  <button
                    aria-checked={checked}
                    className={cn(
                      'flex min-h-16 w-full items-center gap-3 rounded-lg border bg-card p-3 text-left active:bg-muted',
                      checked && 'border-primary',
                    )}
                    onClick={() => togglePiece(piece.name)}
                    role="checkbox"
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-sm border',
                        checked &&
                          'border-primary bg-primary text-primary-foreground',
                      )}
                    >
                      {checked && <Check className="size-3.5" />}
                    </span>
                    <PieceIcon
                      border
                      displayName={piece.displayName}
                      logoUrl={piece.logoUrl}
                      showTooltip={false}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {piece.displayName}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {renderedPieces.length < filteredPieces.length && (
          <Button
            className="mt-4 h-11 w-full"
            onClick={() =>
              setVisibleLimit((current) => current + MOBILE_MANAGE_PAGE_SIZE)
            }
            type="button"
            variant="outline"
          >
            {t('Load more')}
          </Button>
        )}
      </div>

      <div className="flex shrink-0 gap-3 border-t bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <Button className="h-11 flex-1" onClick={onClose} variant="outline">
          {t('Cancel')}
        </Button>
        <Button
          className="h-11 flex-1"
          disabled={isLoading}
          onClick={handleSave}
        >
          {t('Save')}
        </Button>
      </div>
    </>
  );
}

export { MobileManagePiecesDialog };

type MobileManagePiecesDialogProps = {
  visiblePieces: PieceMetadataModelSummary[];
  onSuccess: () => void;
};

type MobileManagePiecesContentProps = MobileManagePiecesDialogProps & {
  onClose: () => void;
};
