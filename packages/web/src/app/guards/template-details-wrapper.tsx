import { TemplateType, isNil } from '@activepieces/shared';
import { Navigate, useParams, useLocation } from 'react-router-dom';

import { ProjectDashboardLayout } from '@/app/components/project-layout';
import { TemplatesPage } from '@/app/routes/templates';
import { LoadingScreen } from '@/components/custom/loading-screen';
import { ShareTemplate, templatesHooks } from '@/features/templates';
import { authenticationSession } from '@/lib/authentication-session';
import { FROM_QUERY_PARAM } from '@/lib/navigation-utils';

const TemplateDetailsWrapper = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const location = useLocation();
  const { data: template, isLoading } = templatesHooks.useTemplate(templateId!);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!template) {
    return <Navigate to="/templates" replace />;
  }

  const token = authenticationSession.getToken();
  const isNotAuthenticated = isNil(token);
  const useProjectLayout = template.type !== TemplateType.SHARED;

  if (isNotAuthenticated && useProjectLayout) {
    return (
      <Navigate
        to={`/sign-in?${FROM_QUERY_PARAM}=${location.pathname}${location.search}`}
        replace
      />
    );
  }

  if (useProjectLayout) {
    // Renders the same gallery as /templates; TemplatesPage reads :templateId
    // itself and shows the details as a dialog on top of it.
    return (
      <ProjectDashboardLayout>
        <TemplatesPage />
      </ProjectDashboardLayout>
    );
  }

  return <ShareTemplate template={template} />;
};

export { TemplateDetailsWrapper };
