# Plugr Billing TODO

## Deferred Email Setup

- Set up the real Plugr work email address and verified sender domain.
- Add production billing email templates for receipts, failed payments, cancellations, and expired trials.
- Wire transactional email sending once the sender address is ready.

## Flutterwave Operations

- Create monthly recurring Flutterwave plans for Starter, Builder, Pro, and Business in USD and NGN.
- Copy each Flutterwave recurring plan ID into the matching `.env` variable.
- Confirm webhook delivery to `/api/v1/user-billing/webhook` on Hostinger.

## Credit Mapping Follow-Up

- Review Plugr credit action costs after real usage data is available.
- If needed, split complex workflow builds into more specific credit actions.