import { isNil } from '@activepieces/shared';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { LoadingScreen } from '@/components/custom/loading-screen';
import { authenticationSession } from '@/lib/authentication-session';

const AuthenticatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const response = searchParams.get('response');

  useEffect(() => {
    if (response) {
      const decodedResponse = JSON.parse(response);
      authenticationSession.saveResponse(decodedResponse, false);
      if (isNil(decodedResponse.projectId)) {
        navigate('/create-platform');
        return;
      }
      navigate(`/projects/${decodedResponse.projectId}/automations`);
    }
  }, [navigate, response]);

  return <LoadingScreen message="Preparing your workspace" />;
};

export default AuthenticatePage;
