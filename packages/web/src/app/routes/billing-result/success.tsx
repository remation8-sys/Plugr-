import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Clock } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { plugrBillingApi } from '@/features/plugr-billing/plugr-billing-api';
import { plugrBillingKeys } from '@/features/plugr-billing/plugr-billing-hooks';

export function BillingSuccessPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const startedRef = useRef(false);

  // Flutterwave appends these to the redirect URL after the checkout flow ends,
  // whether the payment succeeded, failed, or was cancelled.
  const transactionId = normalizeGatewayParam(
    searchParams.get('transaction_id') ?? searchParams.get('transactionId'),
  );
  const reference = normalizeGatewayParam(
    searchParams.get('tx_ref') ?? searchParams.get('reference'),
  );

  // We never trust the gateway's status query param on its own — it is granted
  // server-side only after Flutterwave verification. Declined charges often
  // arrive with status=cancelled/failed and no transaction_id (Flutterwave
  // never assigned one), but the tx_ref alone is still enough for the server
  // to verify by reference — only skip verification when we have neither.
  const cancelledWithoutTransaction = !transactionId && !reference;

  const verify = useMutation({
    mutationFn: () =>
      plugrBillingApi.verifyTransaction({
        transactionId: transactionId ?? undefined,
        reference: reference ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plugrBillingKeys.info });
    },
  });

  const runVerify = verify.mutate;
  useEffect(() => {
    if (startedRef.current || cancelledWithoutTransaction) {
      return;
    }
    startedRef.current = true;
    runVerify();
  }, [cancelledWithoutTransaction, runVerify]);

  if (cancelledWithoutTransaction) {
    return <Navigate to="/billing/failed" replace />;
  }

  if (verify.isPending || verify.isIdle) {
    return (
      <Centered
        icon={<Loader2 className="size-7 animate-spin" />}
        tone="muted"
        title="Confirming your payment…"
        description="Hang tight while we verify this with Flutterwave. This usually takes a few seconds."
      />
    );
  }

  const status = verify.data?.status;

  if (status === 'successful') {
    return (
      <Centered
        icon={<CheckCircle2 className="size-7" />}
        tone="primary"
        title="Payment received"
        description="Your plan is now active. Your new tier and credits are ready to use."
        actions
      />
    );
  }

  if (verify.isError || status === 'failed') {
    return <Navigate to="/billing/failed" replace />;
  }

  // status === 'pending' — verified request reached us but Flutterwave has not
  // confirmed the charge yet. Access will unlock automatically via the webhook.
  return (
    <Centered
      icon={<Clock className="size-7" />}
      tone="muted"
      title="We're confirming your payment"
      description="Flutterwave is still processing this transaction. Your plan will unlock automatically as soon as it's confirmed — no need to pay again."
      actions
    />
  );
}

type CenteredProps = {
  icon: React.ReactNode;
  tone: 'primary' | 'muted';
  title: string;
  description: string;
  actions?: boolean;
};

function Centered({ icon, tone, title, description, actions }: CenteredProps) {
  return (
    <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
      <div
        className={
          tone === 'primary'
            ? 'flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary'
            : 'flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground'
        }
      >
        {icon}
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      {actions && (
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/pricing">View billing</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/chat">Open Plugr</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function normalizeGatewayParam(value: string | null): string | undefined {
  const normalized = value?.trim();
  if (
    !normalized ||
    normalized.toLowerCase() === 'null' ||
    normalized.toLowerCase() === 'undefined'
  ) {
    return undefined;
  }
  return normalized;
}

export default BillingSuccessPage;
