import React, { Suspense } from 'react';

import { PageTitle } from '@/app/components/page-title';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';

const ResetPasswordPage = React.lazy(() =>
  import('./forget-password').then((module) => ({
    default: module.ResetPasswordPage,
  })),
);
const ChangePasswordPage = React.lazy(() =>
  import('./change-password').then((module) => ({
    default: module.ChangePasswordPage,
  })),
);
const SignInPage = React.lazy(() =>
  import('./sign-in').then((module) => ({ default: module.SignInPage })),
);
const VerifyEmail = React.lazy(() =>
  import('@/features/authentication/components/verify-email').then(
    (module) => ({ default: module.VerifyEmail }),
  ),
);
const SignUpPage = React.lazy(() =>
  import('./sign-up').then((module) => ({ default: module.SignUpPage })),
);
const CreatePlatformPage = React.lazy(() =>
  import('./create-platform').then((module) => ({
    default: module.CreatePlatformPage,
  })),
);
const ConnectToolsPage = React.lazy(() =>
  import('./onboarding/connect-tools').then((module) => ({
    default: module.ConnectToolsPage,
  })),
);
const AcceptInvitation = React.lazy(() =>
  import('@/features/members/components/accept-invitation').then((module) => ({
    default: module.AcceptInvitation,
  })),
);

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteLoadingBar />}>{children}</Suspense>;
}

const authRoutes = [
  {
    path: '/forget-password',
    element: (
      <PageTitle title="Forget Password">
        <SuspenseWrapper>
          <ResetPasswordPage />
        </SuspenseWrapper>
      </PageTitle>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <PageTitle title="Reset Password">
        <SuspenseWrapper>
          <ChangePasswordPage />
        </SuspenseWrapper>
      </PageTitle>
    ),
  },
  {
    path: '/sign-in',
    element: (
      <PageTitle title="Sign In">
        <SuspenseWrapper>
          <SignInPage />
        </SuspenseWrapper>
      </PageTitle>
    ),
  },
  {
    path: '/verify-email',
    element: (
      <PageTitle title="Verify Email">
        <SuspenseWrapper>
          <VerifyEmail />
        </SuspenseWrapper>
      </PageTitle>
    ),
  },
  {
    path: '/sign-up',
    element: (
      <PageTitle title="Sign Up">
        <SuspenseWrapper>
          <SignUpPage />
        </SuspenseWrapper>
      </PageTitle>
    ),
  },
  {
    path: '/create-platform',
    element: (
      <PageTitle title="Create Platform">
        <SuspenseWrapper>
          <CreatePlatformPage />
        </SuspenseWrapper>
      </PageTitle>
    ),
  },
  {
    path: '/onboarding/connect-tools',
    element: (
      <PageTitle title="Connect Your Tools">
        <SuspenseWrapper>
          <ConnectToolsPage />
        </SuspenseWrapper>
      </PageTitle>
    ),
  },
  {
    path: '/invitation',
    element: (
      <PageTitle title="Accept Invitation">
        <SuspenseWrapper>
          <AcceptInvitation />
        </SuspenseWrapper>
      </PageTitle>
    ),
  },
];

export { authRoutes };
