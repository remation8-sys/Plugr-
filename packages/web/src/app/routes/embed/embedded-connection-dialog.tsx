import {
  apId,
  AppConnectionWithoutSensitiveData,
  isNil,
} from '@activepieces/shared';
import {
  ActivepiecesClientConnectionNameIsInvalid,
  ActivepiecesClientConnectionPieceNotFound,
  ActivepiecesClientEventName,
  ActivepiecesClientShowConnectionIframe,
  ActivepiecesNewConnectionDialogClosed,
  NEW_CONNECTION_QUERY_PARAMS,
} from 'ee-embed-sdk';
import { useEffect, useRef, useState } from 'react';

import { memoryRouter } from '@/app/guards';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { oauthAppsQueries } from '@/features/connections';
import { piecesHooks } from '@/features/pieces';
import { parentWindow } from '@/lib/dom-utils';
import { cn } from '@/lib/utils';

import { CreateOrEditConnectionDialogContent } from '../../connections/create-edit-connection-dialog';

const extractIdFromQueryParams = () => {
  const connectionName = new URLSearchParams(
    memoryRouter.state.location.search,
  ).get(NEW_CONNECTION_QUERY_PARAMS.connectionName);
  return isNil(connectionName) || connectionName.length === 0
    ? apId()
    : connectionName;
};
export const EmbeddedConnectionDialog = () => {
  const connectionName = extractIdFromQueryParams();
  const queryParams = new URLSearchParams(memoryRouter.state.location.search);
  const pieceName = queryParams.get(NEW_CONNECTION_QUERY_PARAMS.name);
  const randomId = queryParams.get(NEW_CONNECTION_QUERY_PARAMS.randomId);
  return (
    <EmbeddedConnectionDialogContent
      connectionName={
        connectionName && connectionName.length > 0 ? connectionName : null
      }
      pieceName={pieceName}
      key={randomId}
    ></EmbeddedConnectionDialogContent>
  );
};

type EmbeddedConnectionDialogContentProps = {
  pieceName: string | null;
  connectionName: string | null;
};

const EmbeddedConnectionDialogContent = ({
  pieceName,
  connectionName,
}: EmbeddedConnectionDialogContentProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const hasErrorRef = useRef(false);

  const {
    data: pieceModel,
    isLoading: isLoadingPiece,
    isSuccess,
  } = piecesHooks.usePieceForEmbeddingConnection({
    pieceName: pieceName ?? '',
    connectionExternalId: connectionName ?? '',
  });
  const hideConnectionIframe = (
    connection?: Pick<AppConnectionWithoutSensitiveData, 'id' | 'externalId'>,
  ) => {
    postMessageToParent({
      type: ActivepiecesClientEventName.CLIENT_NEW_CONNECTION_DIALOG_CLOSED,
      data: {
        connection: connection
          ? {
              id: connection.id,
              name: connection.externalId,
            }
          : undefined,
      },
    });
  };

  const postMessageToParent = (
    event:
      | ActivepiecesNewConnectionDialogClosed
      | ActivepiecesClientConnectionNameIsInvalid
      | ActivepiecesClientConnectionPieceNotFound,
  ) => {
    parentWindow.postMessage(event, '*');
  };
  useEffect(() => {
    const showConnectionIframeEvent: ActivepiecesClientShowConnectionIframe = {
      type: ActivepiecesClientEventName.CLIENT_SHOW_CONNECTION_IFRAME,
      data: {},
    };
    parentWindow.postMessage(showConnectionIframeEvent, '*');
    document.body.style.background = 'transparent';
  }, []);

  useEffect(() => {
    if (!isSuccess && !isLoadingPiece && !hasErrorRef.current) {
      postMessageToParent({
        type: ActivepiecesClientEventName.CLIENT_CONNECTION_PIECE_NOT_FOUND,
        data: {
          error: JSON.stringify({
            isValid: 'false',
            error: `piece: ${pieceName} not found`,
          }),
        },
      });
      hideConnectionIframe();
      hasErrorRef.current = true;
    }
  }, [isSuccess, isLoadingPiece, pieceName]);

  const { data: piecesOAuth2AppsMap, isPending: loadingPiecesOAuth2AppsMap } =
    oauthAppsQueries.usePiecesOAuth2AppsMap();
  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          hideConnectionIframe();
        }
      }}
    >
      <DialogContent
        showOverlay={false}
        onInteractOutside={(e) => e.preventDefault()}
        className={cn(
          'max-h-[70vh] w-[calc(100vw-2rem)] max-w-[650px] overflow-y-auto',
          {
            'bg-transparent! border-none! focus:outline-hidden border-transparent! shadow-none!':
              isLoadingPiece,
          },
        )}
        showCloseButton={!isLoadingPiece}
      >
        {(isLoadingPiece || loadingPiecesOAuth2AppsMap) && (
          <div
            aria-busy="true"
            aria-label="Loading connection settings"
            className="space-y-5 py-4"
            role="status"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56 max-w-full" />
              </div>
            </div>
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <div className="flex justify-end gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        )}

        {!isLoadingPiece && pieceModel && piecesOAuth2AppsMap && (
          <CreateOrEditConnectionDialogContent
            reconnectConnection={null}
            piecesOAuth2AppsMap={piecesOAuth2AppsMap}
            piece={pieceModel}
            externalIdComingFromSdk={connectionName}
            isGlobalConnection={false}
            setOpen={(open, connection) => {
              if (!open) {
                hideConnectionIframe(connection);
              }
              setIsDialogOpen(open);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
