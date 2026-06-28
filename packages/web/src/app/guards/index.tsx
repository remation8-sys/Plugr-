import React, { Suspense } from 'react';
import {
  RouterProvider,
  createBrowserRouter,
  createMemoryRouter,
} from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
import { authRoutes } from '@/app/routes/auth-routes';
import { LandingPage } from '@/app/routes/landing';
import { platformRoutes } from '@/app/routes/platform-routes';
import { projectRoutes } from '@/app/routes/project-routes';
import { publicRoutes } from '@/app/routes/public-routes';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { useEmbedding } from '@/components/providers/embed-provider';
import { PlugrAccessGuard } from '@/features/plugr-billing';
import { authenticationSession } from '@/lib/authentication-session';

import { AllowOnlyLoggedInUserOnlyGuard } from '../components/allow-logged-in-user-only-guard';
import { ProjectDashboardLayout } from '../components/project-layout';

import { DefaultRoute } from './default-route';
import { TokenCheckerWrapper } from './project-route-wrapper';

const ChatWithAIPage = React.lazy(() =>
  import('@/app/routes/chat-with-ai').then((m) => ({
    default: m.ChatWithAIPage,
  })),
);

const PricingPage = React.lazy(() =>
  import('@/app/routes/pricing').then((m) => ({ default: m.PricingPage })),
);
const BillingSuccessPage = React.lazy(() =>
  import('@/app/routes/billing-result/success').then((m) => ({
    default: m.BillingSuccessPage,
  })),
);
const BillingFailedPage = React.lazy(() =>
  import('@/app/routes/billing-result/failed').then((m) => ({
    default: m.BillingFailedPage,
  })),
);
function chatElement() {
  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      <ProjectDashboardLayout>
        <PageTitle title="Plugr" separator="-">
          <PlugrAccessGuard>
            <Suspense fallback={<RouteLoadingBar />}>
              <ChatWithAIPage />
            </Suspense>
          </PlugrAccessGuard>
        </PageTitle>
      </ProjectDashboardLayout>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}

const chatRoutes = [
  { path: '/chat', element: chatElement() },
  { path: '/chat/:conversationId', element: chatElement() },
];

function billingElement(children: React.ReactNode, title: string) {
  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      <ProjectDashboardLayout>
        <PageTitle title={title} separator="-">
          <Suspense fallback={<RouteLoadingBar />}>{children}</Suspense>
        </PageTitle>
      </ProjectDashboardLayout>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}

const billingRoutes = [
  { path: '/pricing', element: billingElement(<PricingPage />, 'Pricing') },
  {
    path: '/billing/success',
    element: billingElement(<BillingSuccessPage />, 'Payment received'),
  },
  {
    path: '/billing/failed',
    element: billingElement(<BillingFailedPage />, 'Payment failed'),
  },
];
const RootRoute = () => {
  const token = authenticationSession.getToken();
  if (token) {
    return <DefaultRoute />;
  }
  return <LandingPage />;
};

const routes = [
  {
    path: '/',
    element: (
      <PageTitle title="Plugr">
        <RootRoute />
      </PageTitle>
    ),
  },
  ...publicRoutes,
  ...projectRoutes,
  ...authRoutes,
  ...platformRoutes,
  ...chatRoutes,
  ...billingRoutes,
  {
    path: '/projects/:projectId',
    element: (
      <TokenCheckerWrapper>
        <DefaultRoute></DefaultRoute>
      </TokenCheckerWrapper>
    ),
  },
  {
    path: '/*',
    element: (
      <PageTitle title="Redirect">
        <DefaultRoute></DefaultRoute>
      </PageTitle>
    ),
  },
];

export const memoryRouter = createMemoryRouter(routes);
const browserRouter = createBrowserRouter(routes);

const ApRouter = () => {
  const { embedState } = useEmbedding();
  const router = embedState.isEmbedded ? memoryRouter : browserRouter;
  return <RouterProvider router={router}></RouterProvider>;
};

export { ApRouter };
