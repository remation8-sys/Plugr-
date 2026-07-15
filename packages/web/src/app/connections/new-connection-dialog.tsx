import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { AppConnectionWithoutSensitiveData, isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { Search } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { piecesHooks } from '@/features/pieces';

import { CreateOrEditConnectionDialog } from './create-edit-connection-dialog';

type NewConnectionDialogProps = {
  onConnectionCreated: (connection: AppConnectionWithoutSensitiveData) => void;
  children: React.ReactNode;
  isGlobalConnection: boolean;
};

const NewConnectionDialog = React.memo(
  ({
    onConnectionCreated,
    children,
    isGlobalConnection,
  }: NewConnectionDialogProps) => {
    const [dialogTypesOpen, setDialogTypesOpen] = useState(false);
    const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
    const [selectedPiece, setSelectedPiece] = useState<
      PieceMetadataModelSummary | undefined
    >(undefined);
    const { pieces, isLoading } = piecesHooks.usePieces({});
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPieces = pieces?.filter((piece) => {
      return (
        !isNil(piece.auth) &&
        piece.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    const clickPiece = (name: string) => {
      setDialogTypesOpen(false);
      setSelectedPiece(pieces?.find((piece) => piece.name === name));
      setConnectionDialogOpen(true);
    };

    return (
      <>
        {selectedPiece && (
          <CreateOrEditConnectionDialog
            reconnectConnection={null}
            piece={selectedPiece}
            open={connectionDialogOpen}
            isGlobalConnection={isGlobalConnection}
            key={`CreateOrEditConnectionDialog-open-${connectionDialogOpen}`}
            setOpen={(open, connection) => {
              setConnectionDialogOpen(open);
              if (connection) {
                onConnectionCreated(connection);
              }
            }}
          ></CreateOrEditConnectionDialog>
        )}
        <Dialog
          open={dialogTypesOpen}
          onOpenChange={(open) => {
            setDialogTypesOpen(open);
            setSearchTerm('');
          }}
        >
          <DialogTrigger asChild>{children}</DialogTrigger>
          <DialogContent className="flex h-[680px] max-h-[85dvh] w-[95vw] max-w-[700px] flex-col sm:min-w-[700px]">
            <DialogHeader>
              <DialogTitle>{t('New Connection')}</DialogTitle>
            </DialogHeader>
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('Search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <ScrollArea className="grow overflow-y-auto ">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {(isLoading ||
                  (filteredPieces && filteredPieces.length === 0)) && (
                  <div className="text-center">{t('No plugs found')}</div>
                )}
                {!isLoading &&
                  filteredPieces &&
                  filteredPieces.map((piece, index) => (
                    <div
                      key={index}
                      onClick={() => clickPiece(piece.name)}
                      className="flex h-[140px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border bg-card p-2 shadow-none transition-shadow hover:shadow hover:bg-accent/50"
                    >
                      <img
                        className="w-[40px] h-[40px]"
                        src={piece.logoUrl}
                      ></img>
                      <div className="mt-2 truncate max-w-full text-center text-sm font-medium">
                        {piece.displayName}
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  {t('Close')}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
);

NewConnectionDialog.displayName = 'NewConnectionDialog';
export { NewConnectionDialog };
