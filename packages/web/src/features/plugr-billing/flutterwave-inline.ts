import { PlugrInlineCheckoutParams } from '@activepieces/shared';

const FLUTTERWAVE_INLINE_SCRIPT = 'https://checkout.flutterwave.com/v3.js';

type FlutterwavePaymentResponse = {
  status?: string;
  tx_ref?: string;
  transaction_id?: number | string;
};

type FlutterwaveCheckoutConfig = {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options?: string;
  payment_plan?: string;
  redirect_url?: string;
  customer: { email: string; name?: string };
  meta?: Record<string, string | number | boolean | null>;
  customizations?: { title?: string; description?: string; logo?: string };
  callback?: (payment: FlutterwavePaymentResponse) => void;
  onclose?: (incomplete?: boolean) => void;
};

declare global {
  interface Window {
    FlutterwaveCheckout?: (config: FlutterwaveCheckoutConfig) => void;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window !== 'undefined' && window.FlutterwaveCheckout) {
    return Promise.resolve();
  }
  if (scriptPromise) {
    return scriptPromise;
  }
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = FLUTTERWAVE_INLINE_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Reset so a later attempt can retry (and let the caller fall back).
      scriptPromise = null;
      reject(new Error('flutterwave-script-failed'));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Opens the Flutterwave Inline modal on-site. Card data stays inside
 * Flutterwave's iframe (no PCI burden). On completion we route to
 * /billing/success, which verifies the payment server-side before granting
 * access. Throws if the script can't load, so callers can fall back to the
 * hosted checkout redirect.
 */
export async function openPlugrInlineCheckout(
  inline: PlugrInlineCheckoutParams,
): Promise<void> {
  await loadScript();
  const checkout = window.FlutterwaveCheckout;
  if (!checkout) {
    throw new Error('flutterwave-not-available');
  }
  checkout({
    public_key: inline.publicKey,
    tx_ref: inline.txRef,
    amount: inline.amount,
    currency: inline.currency,
    payment_options: inline.paymentOptions,
    ...(inline.paymentPlanId ? { payment_plan: inline.paymentPlanId } : {}),
    redirect_url: inline.redirectUrl,
    customer: { email: inline.customer.email, name: inline.customer.name },
    meta: inline.meta,
    customizations: inline.customizations,
    callback: (payment) => {
      const params = new URLSearchParams({
        status: normalizeFlutterwaveValue(payment?.status) ?? '',
        tx_ref: normalizeFlutterwaveValue(payment?.tx_ref) ?? inline.txRef,
      });
      const transactionId = normalizeFlutterwaveValue(payment?.transaction_id);
      if (transactionId) {
        params.set('transaction_id', transactionId);
      }
      window.location.href = `/billing/success?${params.toString()}`;
    },
    onclose: () => {
      // User dismissed the modal without completing — stay on the page.
    },
  });
}

function normalizeFlutterwaveValue(value: number | string | undefined): string | undefined {
  const normalized = value === undefined ? undefined : String(value).trim();
  if (
    !normalized ||
    normalized.toLowerCase() === 'null' ||
    normalized.toLowerCase() === 'undefined'
  ) {
    return undefined;
  }
  return normalized;
}
