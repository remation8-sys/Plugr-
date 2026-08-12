import { ErrorCode, isNil } from '@activepieces/shared';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { t } from 'i18next';

import { useApErrorDialogStore } from '@/components/custom/ap-error-dialog/ap-error-dialog-store';
import { internalErrorToast } from '@/components/ui/sonner';
import { useManagePlanDialogStore } from '@/features/billing';
import { api } from '@/lib/api';
import { mobileHaptics } from '@/lib/mobile-haptics';

export const queryClient = new QueryClient({
  // Global default only - any useQuery with its own staleTime (e.g. Infinity
  // for immutable piece metadata, 0 for live search) overrides this. Without
  // it, react-query's own default (staleTime: 0) meant every window refocus
  // or remount refetched every list on screen, even ones that rarely change.
  defaultOptions: {
    queries: {
      staleTime: 15_000,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.showErrorDialog) {
        mobileHaptics.error();
        const { openDialog } = useApErrorDialogStore.getState();
        openDialog({
          title: t('Failed to load data'),
          description: t(
            'Something went wrong while loading your data. Your data is safe — please try again by refreshing the page.',
          ),
          error: {
            queryKey: query.queryKey,
            details: api.isError(error) ? error.response?.data : String(error),
          },
        });
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (err: Error, _, __, mutation) => {
      mobileHaptics.error();
      if (api.isApError(err, ErrorCode.QUOTA_EXCEEDED)) {
        const { openDialog } = useManagePlanDialogStore.getState();
        openDialog();
      } else if (isNil(mutation.options.onError)) {
        internalErrorToast();
      }
    },
    onSuccess: () => {
      mobileHaptics.success();
    },
  }),
});
