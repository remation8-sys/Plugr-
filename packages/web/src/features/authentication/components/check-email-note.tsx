import { CreateOtpRequestBody, OtpType } from '@activepieces/shared';
import { t } from 'i18next';
import { MailCheck } from 'lucide-react';
import { toast } from 'sonner';

import { authMutations } from '../hooks/auth-hooks';

const CheckEmailNote = ({ email, type }: CreateOtpRequestBody) => {
  const { mutate: resendVerification } = authMutations.useSendOtpEmail({
    onSuccess: () => {
      toast.success(
        type === OtpType.EMAIL_VERIFICATION
          ? t('Verification email resent, if previous one expired.')
          : t('Password reset link resent, if previous one expired.'),
        {
          duration: 3000,
        },
      );
    },
  });
  return (
    <div className="gap-2 w-full flex flex-col">
      <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
        <MailCheck className="w-16 h-16" />
        <span className="text-left w-fit">
          {type === OtpType.EMAIL_VERIFICATION
            ? t('We sent you a link to complete your registration to')
            : t('We sent you a link to reset your password to')}
          <strong>&nbsp;{email}</strong>.
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {t("Didn't receive an email or it expired?")}
        <button
          className="cursor-pointer text-primary underline"
          onClick={() =>
            resendVerification({
              email,
              type,
            })
          }
        >
          {t('Resend')}
        </button>
      </div>
    </div>
  );
};

CheckEmailNote.displayName = 'CheckEmailNote';
export { CheckEmailNote };
