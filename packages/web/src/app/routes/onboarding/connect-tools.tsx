import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { AppConnectionWithoutSensitiveData, isNil } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { ArrowRight } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { FullLogo } from '@/components/custom/full-logo';
import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { appConnectionsApi } from '@/features/connections/api/app-connections';
import { piecesApi } from '@/features/pieces/api/pieces-api';
import { authenticationSession } from '@/lib/authentication-session';

import { CategoryFilter } from './components/category-filter';
import { SuccessAnimation } from './components/success-animation';
import { ToolCard } from './components/tool-card';
import {
  filterByCategory,
  OnboardingCategory,
  POPULAR_PIECE_NAMES,
} from './utils/piece-category-utils';

const TOOLS_COMPLETED_KEY = 'plugr_connect_tools_completed';

export function ConnectToolsPage() {
  const token = authenticationSession.getToken();
  if (!token) return <Navigate to="/sign-in" replace />;
  if (authenticationSession.isOnboarding())
    return <Navigate to="/create-platform" replace />;
  if (localStorage.getItem(TOOLS_COMPLETED_KEY) === '1')
    return <Navigate to="/" replace />;
  return <ConnectToolsContent />;
}

function ConnectToolsContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = authenticationSession.getProjectId();

  // After onboarding, land the user in the templates gallery — the fastest path
  // to a first working automation on ANY plan (Starter has no AI, so chat is not
  // a universal entry point). Honor an explicit deep-link (`from`) if present.
  const goToFirstAutomation = () => {
    const from = searchParams.get('from');
    navigate(from ?? '/templates');
  };

  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);
  const [activeCategory, setActiveCategory] =
    useState<OnboardingCategory>('All');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [connectedNames, setConnectedNames] = useState<Set<string>>(new Set());
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    piece: PieceMetadataModelSummary | null;
  }>({ open: false, piece: null });
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: pieces, isLoading: piecesLoading } = useQuery({
    queryKey: ['onboarding-pieces', projectId],
    queryFn: () =>
      piecesApi.list({
        projectId: projectId ?? undefined,
      }),
    staleTime: Infinity,
    enabled: !isNil(projectId),
  });

  const { data: existingConnections } = useQuery({
    queryKey: ['onboarding-connections', projectId],
    queryFn: () =>
      appConnectionsApi.list({
        projectId: projectId!,
        limit: 1000,
      }),
    enabled: !isNil(projectId),
  });

  useEffect(() => {
    if (existingConnections) {
      const names = new Set(existingConnections.data.map((c) => c.pieceName));
      setConnectedNames(names);
    }
  }, [existingConnections]);

  const handleConnectionSaved = (pieceName: string) => {
    setConnectedNames((prev) => new Set([...prev, pieceName]));
    setExpandedCard(null);
  };

  const handleDialogSetOpen = (
    open: boolean,
    connection?: AppConnectionWithoutSensitiveData,
  ) => {
    if (connection) {
      setConnectedNames((prev) => new Set([...prev, connection.pieceName]));
    }
    setDialogState((prev) => ({ ...prev, open }));
  };

  const handleConnectClick = (piece: PieceMetadataModelSummary) => {
    setDialogState({ open: true, piece });
  };

  const handleExpandToggle = (pieceName: string) => {
    setExpandedCard((prev) => (prev === pieceName ? null : pieceName));
  };

  const handleSkip = () => {
    localStorage.setItem(TOOLS_COMPLETED_KEY, '1');
    goToFirstAutomation();
  };

  const handleContinue = () => {
    localStorage.setItem(TOOLS_COMPLETED_KEY, '1');
    setShowSuccess(true);
  };

  const handleSuccessComplete = () => {
    goToFirstAutomation();
  };

  if (showSuccess) {
    return <SuccessAnimation onComplete={handleSuccessComplete} />;
  }

  const piecesWithAuth = (pieces ?? []).filter((p) => !isNil(p.auth));

  const popularPieces = POPULAR_PIECE_NAMES.map((name) =>
    piecesWithAuth.find((p) => p.name === name),
  ).filter((p): p is PieceMetadataModelSummary => !isNil(p));

  // Only show the full catalog when user is actively searching or browsing a category.
  // Defaulting to 700+ cards is a CRO anti-pattern: it overwhelms and slows the page.
  const isExploring = deferredSearch.trim() !== '' || activeCategory !== 'All';

  const filteredByCategory = filterByCategory(piecesWithAuth, activeCategory);

  const displayPieces = deferredSearch.trim()
    ? filteredByCategory.filter(
        (p) =>
          p.displayName.toLowerCase().includes(deferredSearch.toLowerCase()) ||
          p.description.toLowerCase().includes(deferredSearch.toLowerCase()),
      )
    : filteredByCategory;

  const connectedCount = connectedNames.size;

  return (
    <div className="flex min-h-screen flex-col bg-background pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]">
      <div className="flex justify-center pt-6">
        <FullLogo />
      </div>

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 pb-44 pt-8 sm:pb-28">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              {t('Step 2 of 3')}
            </span>
            <Progress value={66} className="h-1.5 w-40" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-sentient">
            {t('Connect your tools')}
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            {t(
              'Connect once. Works in every flow forever. You can add more anytime.',
            )}
          </p>
        </div>

        <div className="mb-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('Search for an app...')}
          />
        </div>

        <div className="mb-6">
          <CategoryFilter
            active={activeCategory}
            onChange={(cat) => {
              setActiveCategory(cat);
              setSearchQuery('');
            }}
          />
        </div>

        {piecesLoading ? (
          <PiecesGridSkeleton />
        ) : isExploring ? (
          // Full catalog view — only rendered when the user is actively searching/filtering
          displayPieces.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <p className="text-sm">
                {t('No tools found for "{query}"', { query: deferredSearch })}
              </p>
            </div>
          ) : (
            <PiecesGrid
              pieces={displayPieces}
              connectedNames={connectedNames}
              expandedCard={expandedCard}
              onConnectClick={handleConnectClick}
              onExpandToggle={handleExpandToggle}
              onConnectionSaved={handleConnectionSaved}
            />
          )
        ) : (
          // Default view — popular tools only. Focused, fast, not overwhelming.
          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('Popular tools')}
            </h2>
            <PiecesGrid
              pieces={popularPieces}
              connectedNames={connectedNames}
              expandedCard={expandedCard}
              onConnectClick={handleConnectClick}
              onExpandToggle={handleExpandToggle}
              onConnectionSaved={handleConnectionSaved}
            />
            {piecesWithAuth.length > popularPieces.length && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                {t('Search above to find any of our {count} integrations.', {
                  count: piecesWithAuth.length,
                })}
              </p>
            )}
          </section>
        )}
      </div>

      <div className="fixed bottom-0 left-[env(safe-area-inset-left)] right-[env(safe-area-inset-right)] border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl flex-col items-stretch gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            {t('Skip for now')}
          </button>
          <div className="flex w-full flex-col items-stretch gap-1 sm:w-auto sm:items-end">
            {connectedCount === 0 && (
              <p className="text-xs text-muted-foreground">
                {t('Connect at least one tool to continue')}
              </p>
            )}
            {connectedCount > 0 && (
              <p className="text-xs text-primary font-medium">
                {t('{count} tool connected', { count: connectedCount })}
              </p>
            )}
            <Button
              size="lg"
              disabled={connectedCount === 0}
              onClick={handleContinue}
              className="w-full gap-2 sm:w-auto"
            >
              {t('Continue')}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {dialogState.piece && (
        <CreateOrEditConnectionDialog
          key={dialogState.piece.name}
          piece={dialogState.piece}
          open={dialogState.open}
          reconnectConnection={null}
          isGlobalConnection={false}
          setOpen={handleDialogSetOpen}
        />
      )}
    </div>
  );
}

type PiecesGridProps = {
  pieces: PieceMetadataModelSummary[];
  connectedNames: Set<string>;
  expandedCard: string | null;
  onConnectClick: (piece: PieceMetadataModelSummary) => void;
  onExpandToggle: (pieceName: string) => void;
  onConnectionSaved: (pieceName: string) => void;
};

function PiecesGrid({
  pieces,
  connectedNames,
  expandedCard,
  onConnectClick,
  onExpandToggle,
  onConnectionSaved,
}: PiecesGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {pieces.map((piece) => (
        <ToolCard
          key={piece.name}
          piece={piece}
          isConnected={connectedNames.has(piece.name)}
          isExpanded={expandedCard === piece.name}
          onConnectClick={onConnectClick}
          onExpandToggle={onExpandToggle}
          onConnectionSaved={onConnectionSaved}
        />
      ))}
    </div>
  );
}

function PiecesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-lg" />
      ))}
    </div>
  );
}
