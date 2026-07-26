import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { LoadingScreen } from '@/components/custom/loading-screen';
import { flowHooks } from '@/features/flows';

const AfterImportFlowRedirect = () => {
  const { flowId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (flowId) {
      queryClient.removeQueries({
        queryKey: flowHooks.createFlowQueryKeys({
          flowId,
          versionId: undefined,
        }),
      });
    }
    navigate(`/flows/${flowId}`, { replace: true });
  }, [flowId, navigate, queryClient]);
  return <LoadingScreen message="Opening your imported flow" />;
};

export { AfterImportFlowRedirect };
