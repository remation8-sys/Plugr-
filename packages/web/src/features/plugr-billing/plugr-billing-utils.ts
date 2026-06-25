import { PlugrBillingCurrency } from '@activepieces/shared';

export function formatPlugrMoney(
  amount: number,
  currency: PlugrBillingCurrency,
): string {
  return new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPlugrDate(
  value: string | Date | null | undefined,
): string {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}
