import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { MailCheck, MailX } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { authMutations } from '../hooks/auth-hooks';

import { FullLogo } from '@/components/custom/full-logo';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Card } from '@/components/ui/card';
import { internalErrorToast } from '@/components/ui/sonner';
import { usePartnerStack } from '@/hooks/use-partner-stack';
import { api } from '@/lib/api';

const VerifyEmail = () => {
  const [isExpired, setIsExpired] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const otp = searchParams.get('otpcode');
  const identityId = searchParams.get('identityId');
  const hasMutated = useRef(false);
  const { reportSignup } = usePartnerStack();

  const { mutate, isPending } = authMutations.useVerifyEmail({
    onSuccess: ({ email, firstName }) => {
      reportSignup(email, firstName);
      setTimeout(() => navigate('/sign-in'), 5000);
    },
    onError: (error) => {
      if (
        api.isError(error) &&
        error.response?.status === HttpStatusCode.Gone
      ) {
        setIsExpired(true);
        setTimeout(() => navigate('/sign-in'), 5000);
      } else {
        console.error(error);
        internalErrorToast();
        setTimeout(() => navigate('/sign-in'), 5000);
      }
    },
  });

  useEffect(() => {
    if (otp && identityId && !hasMutated.current) {
      mutate({ otp, identityId });
      hasMutated.current = true;
    }
  }, [otp, identityId, mutate]);

  if (!otp || !identityId) {
    return <Navigate to="/sign-in" replace />;
  }
  return (
    <div className="mx-auto h-screen w-screen flex flex-col items-center justify-center gap-2">
      <FullLogo />

      <Card className="w-[calc(100vw-2rem)] max-w-md rounded-sm p-4 drop-shadow-xl">
        <div className="gap-2 w-full flex flex-col">
          <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
            {!isPending && !isExpired && (
              <>
                <MailCheck className="w-16 h-16" />
                <span className="text-left w-fit">
                  {t(
                    'Email has been verified. You will be redirected to sign in...',
                  )}
                </span>
              </>
            )}
            {isPending && !isExpired && (
              <>
                <LoadingSpinner className="size-6" />
                <span className="text-left w-fit">
                  {t('Verifying email...')}
                </span>
              </>
            )}

            {isExpired && (
              <>
                <MailX className="w-16 h-16" />
                <div className="text-left w-fit">
                  <div>
                    {t(
                      'invitation has expired, once you sign in again you will be able to resend the verification email.',
                    )}
                  </div>
                  <div>{t('Redirecting to sign in...')}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
VerifyEmail.displayName = 'VerifyEmail';

export { VerifyEmail };
