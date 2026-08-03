import { useQueryClient } from '@tanstack/react-query';
import { ArrowDown, LoaderCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { useIsMobile } from '@/hooks/use-mobile';
import { mobileHaptics } from '@/lib/mobile-haptics';
import { cn } from '@/lib/utils';

const REFRESH_THRESHOLD = 72;
const MAX_PULL_DISTANCE = 104;
function MobilePullToRefresh({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const startYRef = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshQueryRoots = getRefreshQueryRoots(location.pathname);
  const enabled = isMobile && refreshQueryRoots.length > 0;
  const isReady = pullDistance >= REFRESH_THRESHOLD;

  function resetPull() {
    startYRef.current = null;
    setPullDistance(0);
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (
      !enabled ||
      isRefreshing ||
      event.touches.length !== 1 ||
      event.currentTarget.scrollTop > 0
    ) {
      return;
    }

    startYRef.current = event.touches[0].clientY;
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (startYRef.current === null || event.touches.length !== 1) {
      return;
    }

    if (event.currentTarget.scrollTop > 0) {
      resetPull();
      return;
    }

    const distance = event.touches[0].clientY - startYRef.current;
    if (distance <= 0) {
      setPullDistance(0);
      return;
    }

    event.preventDefault();
    setPullDistance(Math.min(MAX_PULL_DISTANCE, distance * 0.45));
  }

  function handleTouchEnd() {
    if (startYRef.current === null) {
      return;
    }

    startYRef.current = null;
    if (!isReady) {
      setPullDistance(0);
      return;
    }

    void refreshActiveData();
  }

  async function refreshActiveData() {
    setIsRefreshing(true);
    setPullDistance(56);
    mobileHaptics.refresh();

    try {
      await queryClient.refetchQueries(
        {
          type: 'active',
          predicate: (query) => {
            const queryRoot = query.queryKey[0];
            return (
              typeof queryRoot === 'string' &&
              refreshQueryRoots.includes(queryRoot)
            );
          },
        },
        { throwOnError: true },
      );
      mobileHaptics.success();
    } catch {
      mobileHaptics.error();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }

  const statusLabel = isRefreshing
    ? t('Refreshing...')
    : isReady
    ? t('Release to refresh')
    : t('Pull to refresh');

  return (
    <div
      className={cn('relative', className)}
      data-mobile-scroll
      data-pull-to-refresh={enabled ? 'enabled' : 'disabled'}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={resetPull}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 z-20 flex h-12 items-center justify-center gap-2 text-sm font-medium text-muted-foreground transition-opacity',
          pullDistance > 0 || isRefreshing ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          transform: `translate3d(0, ${Math.max(-48, pullDistance - 48)}px, 0)`,
        }}
        role="status"
        aria-live="polite"
        aria-hidden={pullDistance === 0 && !isRefreshing}
      >
        {isRefreshing ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <ArrowDown
            className={cn(
              'size-4 transition-transform',
              isReady && 'rotate-180',
            )}
            aria-hidden="true"
          />
        )}
        <span>{statusLabel}</span>
      </div>
      <div
        className={cn(
          'flex min-h-full flex-col transition-transform ease-out',
          pullDistance > 0 && !isRefreshing ? 'duration-0' : 'duration-150',
        )}
        style={{ transform: `translate3d(0, ${pullDistance}px, 0)` }}
      >
        {children}
      </div>
    </div>
  );
}

function getRefreshQueryRoots(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, '');
  return (
    REFRESH_ROUTES.find(({ suffix }) => normalizedPath.endsWith(suffix))
      ?.queryRoots ?? EMPTY_QUERY_ROOTS
  );
}

const mobilePullToRefreshUtils = {
  getRefreshQueryRoots,
};

export { MobilePullToRefresh, mobilePullToRefreshUtils };

const EMPTY_QUERY_ROOTS: readonly string[] = [];
const REFRESH_ROUTES: RefreshRoute[] = [
  {
    suffix: '/platform/setup/templates',
    queryRoots: ['templates'],
  },
  {
    suffix: '/platform/setup/connections',
    queryRoots: ['globalConnections'],
  },
  {
    suffix: '/platform/setup/pieces',
    queryRoots: ['oauth2-apps-configured', 'pieces-table'],
  },
  {
    suffix: '/platform/infrastructure/event-destinations',
    queryRoots: ['event-destinations', 'flow-display-name'],
  },
  {
    suffix: '/platform/security/audit-logs',
    queryRoots: ['audit-logs'],
  },
  {
    suffix: '/platform/infrastructure/workers',
    queryRoots: ['worker-machines'],
  },
  {
    suffix: '/platform/infrastructure/health',
    queryRoots: [
      'system-health',
      'platform-metrics-report',
      'platform-metrics-live',
      'platform-metrics-health-history',
    ],
  },
  {
    suffix: '/platform/connections',
    queryRoots: ['platform-app-connections'],
  },
  {
    suffix: '/platform/projects',
    queryRoots: ['projects', 'projects-for-platforms', 'globalConnections'],
  },
  {
    suffix: '/platform/users',
    queryRoots: ['users', 'platform-invitations'],
  },
  {
    suffix: '/automations',
    queryRoots: ['folders', 'root-flows', 'root-tables', 'all-folder-contents'],
  },
  {
    suffix: '/connections',
    queryRoots: ['app-connections', 'app-connections-owners'],
  },
  {
    suffix: '/leaderboard',
    queryRoots: [
      'analytics',
      'project-leaderboard',
      'user-badges',
      'user-leaderboard',
    ],
  },
  {
    suffix: '/templates',
    queryRoots: ['template', 'templates', 'template-summaries'],
  },
  {
    suffix: '/impact',
    queryRoots: ['analytics'],
  },
  {
    suffix: '/runs',
    queryRoots: ['flow-run-count-by-status', 'flow-run-table'],
  },
];

type RefreshRoute = {
  suffix: string;
  queryRoots: readonly string[];
};
