import React, { Suspense } from 'react';

import { PageTitle } from '@/app/components/page-title';
import { OfflinePage } from '@/components/custom/pwa/offline-page';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';

const ProjectDashboardLayout = React.lazy(() =>
  import('../components/project-layout').then((module) => ({
    default: module.ProjectDashboardLayout,
  })),
);
const TemplateDetailsWrapper = React.lazy(() =>
  import('../guards/template-details-wrapper').then((module) => ({
    default: module.TemplateDetailsWrapper,
  })),
);
const NotFoundPage = React.lazy(() => import('./404-page'));
const AboutPage = React.lazy(() =>
  import('./about').then((module) => ({ default: module.AboutPage })),
);
const AuthenticatePage = React.lazy(() => import('./authenticate'));
const EmbedPage = React.lazy(() =>
  import('./embed').then((module) => ({ default: module.EmbedPage })),
);
const EmbeddedConnectionDialog = React.lazy(() =>
  import('./embed/embedded-connection-dialog').then((module) => ({
    default: module.EmbeddedConnectionDialog,
  })),
);
const McpAuthorizePage = React.lazy(() =>
  import('./mcp-authorize').then((module) => ({
    default: module.McpAuthorizePage,
  })),
);
const PrivacyPage = React.lazy(() =>
  import('./privacy').then((module) => ({ default: module.PrivacyPage })),
);
const RedirectPage = React.lazy(() =>
  import('./redirect').then((module) => ({ default: module.RedirectPage })),
);
const TermsPage = React.lazy(() =>
  import('./terms').then((module) => ({ default: module.TermsPage })),
);
const ChatPage = React.lazy(() =>
  import('./chat').then((module) => ({ default: module.ChatPage })),
);
const FormPage = React.lazy(() =>
  import('./forms').then((module) => ({ default: module.FormPage })),
);
const TemplatesPage = React.lazy(() =>
  import('./templates').then((module) => ({ default: module.TemplatesPage })),
);

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteLoadingBar />}>{children}</Suspense>;
}

const publicRoutes = [
  {
    path: '/embed',
    element: (
      <SuspenseWrapper>
        <EmbedPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/embed/connections',
    element: (
      <SuspenseWrapper>
        <EmbeddedConnectionDialog />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/authenticate',
    element: (
      <SuspenseWrapper>
        <AuthenticatePage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/templates',
    element: (
      <SuspenseWrapper>
        <ProjectDashboardLayout>
          <PageTitle title="Templates">
            <TemplatesPage />
          </PageTitle>
        </ProjectDashboardLayout>
      </SuspenseWrapper>
    ),
  },
  {
    path: '/templates/:templateId',
    element: (
      <SuspenseWrapper>
        <TemplateDetailsWrapper />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/forms/:flowId',
    element: (
      <PageTitle title="Forms">
        <SuspenseWrapper>
          <FormPage />
        </SuspenseWrapper>
      </PageTitle>
    ),
  },
  {
    path: '/chats/:flowId',
    element: (
      <PageTitle title="Chats">
        <SuspenseWrapper>
          <ChatPage />
        </SuspenseWrapper>
      </PageTitle>
    ),
  },
  {
    path: '/mcp-authorize',
    element: (
      <PageTitle title="Authorize">
        <SuspenseWrapper>
          <McpAuthorizePage />
        </SuspenseWrapper>
      </PageTitle>
    ),
  },
  {
    path: '/redirect',
    element: (
      <SuspenseWrapper>
        <RedirectPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/404',
    element: (
      <PageTitle title="Not Found">
        <SuspenseWrapper>
          <NotFoundPage />
        </SuspenseWrapper>
      </PageTitle>
    ),
  },
  {
    path: '/offline',
    element: (
      <PageTitle title="Offline">
        <OfflinePage />
      </PageTitle>
    ),
  },
  {
    path: '/privacy',
    element: (
      <PageTitle title="Privacy Policy">
        <SuspenseWrapper>
          <PrivacyPage />
        </SuspenseWrapper>
      </PageTitle>
    ),
  },
  {
    path: '/terms',
    element: (
      <PageTitle title="Terms and Conditions">
        <SuspenseWrapper>
          <TermsPage />
        </SuspenseWrapper>
      </PageTitle>
    ),
  },
  {
    path: '/about',
    element: (
      <PageTitle title="About">
        <SuspenseWrapper>
          <AboutPage />
        </SuspenseWrapper>
      </PageTitle>
    ),
  },
];

export { publicRoutes };
