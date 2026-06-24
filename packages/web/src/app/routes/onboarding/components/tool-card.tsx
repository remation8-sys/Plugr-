import {
  PieceMetadataModelSummary,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  AppConnectionType,
  AppConnectionWithoutSensitiveData,
  apId,
  isNil,
} from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { internalErrorToast } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { appConnectionsApi } from '@/features/connections/api/app-connections';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

type AuthKind = 'oauth2' | 'secret' | 'other' | 'none';

function getAuthKind(piece: PieceMetadataModelSummary): AuthKind {
  if (isNil(piece.auth)) return 'none';
  const auth = Array.isArray(piece.auth) ? piece.auth[0] : piece.auth;
  if (auth.type === PropertyType.SECRET_TEXT) return 'secret';
  if (auth.type === PropertyType.OAUTH2) return 'oauth2';
  if (auth.type === PropertyType.NONE) return 'none';
  return 'other';
}

type ToolCardProps = {
  piece: PieceMetadataModelSummary;
  isConnected: boolean;
  isExpanded: boolean;
  onConnectClick: (piece: PieceMetadataModelSummary) => void;
  onExpandToggle: (pieceName: string) => void;
  onConnectionSaved: (pieceName: string) => void;
};

function ToolCard({
  piece,
  isConnected,
  isExpanded,
  onConnectClick,
  onExpandToggle,
  onConnectionSaved,
}: ToolCardProps) {
  const authKind = getAuthKind(piece);

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 rounded-lg border bg-card p-4 transition-all',
        isExpanded && 'ring-2 ring-primary/30',
      )}
    >
      {isConnected && (
        <Badge
          variant="success"
          className="absolute right-3 top-3 flex items-center gap-1 px-2 py-0.5 text-xs"
        >
          <Check className="size-3" />
          {t('Connected')}
        </Badge>
      )}

      <div className="flex items-start gap-3">
        <PieceIcon
          logoUrl={piece.logoUrl}
          displayName={piece.displayName}
          size="lg"
          showTooltip={false}
          border={true}
        />
        <div className="min-w-0 flex-1 pr-2">
          <p className="truncate font-semibold text-sm leading-tight">
            {piece.displayName}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {piece.description}
          </p>
        </div>
      </div>

      {authKind !== 'none' && (
        <ConnectButton
          piece={piece}
          isConnected={isConnected}
          isExpanded={isExpanded}
          authKind={authKind}
          onConnectClick={onConnectClick}
          onExpandToggle={onExpandToggle}
        />
      )}

      {isExpanded && authKind === 'secret' && (
        <InlineApiKeyForm piece={piece} onSaved={onConnectionSaved} />
      )}
    </div>
  );
}

type ConnectButtonProps = {
  piece: PieceMetadataModelSummary;
  isConnected: boolean;
  isExpanded: boolean;
  authKind: AuthKind;
  onConnectClick: (piece: PieceMetadataModelSummary) => void;
  onExpandToggle: (pieceName: string) => void;
};

function ConnectButton({
  piece,
  isConnected,
  isExpanded,
  authKind,
  onConnectClick,
  onExpandToggle,
}: ConnectButtonProps) {
  if (isConnected && authKind === 'secret') {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full h-11"
        onClick={() => onExpandToggle(piece.name)}
      >
        <RefreshCw className="size-3.5 mr-1.5" />
        {t('Update Key')}
      </Button>
    );
  }

  if (isConnected) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full h-11"
        onClick={() => onConnectClick(piece)}
      >
        <RefreshCw className="size-3.5 mr-1.5" />
        {t('Reconnect')}
      </Button>
    );
  }

  if (authKind === 'secret') {
    return (
      <Button
        variant={isExpanded ? 'outline' : 'default'}
        size="sm"
        className="w-full h-11"
        onClick={() => onExpandToggle(piece.name)}
      >
        {isExpanded ? t('Cancel') : t('Connect')}
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      className="w-full h-11"
      onClick={() => onConnectClick(piece)}
    >
      {t('Connect')}
    </Button>
  );
}

type InlineApiKeyFormProps = {
  piece: PieceMetadataModelSummary;
  onSaved: (pieceName: string) => void;
};

function InlineApiKeyForm({ piece, onSaved }: InlineApiKeyFormProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const projectId = authenticationSession.getProjectId();

  const { mutate, isPending } = useMutation({
    mutationFn: (key: string): Promise<AppConnectionWithoutSensitiveData> => {
      if (isNil(projectId)) throw new Error('No project');
      return appConnectionsApi.upsert({
        type: AppConnectionType.SECRET_TEXT,
        externalId: apId(),
        displayName: piece.displayName,
        pieceName: piece.name,
        projectId,
        pieceVersion: piece.version,
        value: {
          type: AppConnectionType.SECRET_TEXT,
          secret_text: key,
        },
      });
    },
    onSuccess: () => {
      setErrorMessage('');
      onSaved(piece.name);
    },
    onError: (error: unknown) => {
      const msg =
        error instanceof Error
          ? error.message
          : t('Key not valid. Please check and try again.');
      if (msg.includes('Something went wrong')) {
        setErrorMessage(t('Key not valid. Please check and try again.'));
      } else {
        setErrorMessage(t('Key not valid. Please check and try again.'));
        internalErrorToast();
      }
    },
  });

  return (
    <div className="flex flex-col gap-2 pt-1 border-t mt-1">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setErrorMessage('');
            }}
            placeholder={t('Paste your API key')}
            className="h-11 pr-9 font-mono text-sm"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showKey ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        <Button
          size="sm"
          className="h-11 shrink-0"
          disabled={apiKey.trim().length === 0 || isPending}
          loading={isPending}
          onClick={() => mutate(apiKey.trim())}
        >
          {t('Save Key')}
        </Button>
      </div>
      {errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}

ToolCard.displayName = 'ToolCard';
export { ToolCard };
