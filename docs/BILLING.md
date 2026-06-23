# NexusCRM — Billing & Subscription Guide

## Plans

| Plan         | Users | Contacts | Price/mo |
|-------------|-------|----------|----------|
| Starter      | 5     | 1,000    | $29      |
| Professional | 25    | 25,000   | $99      |
| Enterprise   | ∞     | ∞        | $299     |

## Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Create 3 products with monthly prices matching the plan table above
3. Copy the Price IDs into `backend/app/billing/plans.py`
4. Add keys to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
5. Register the webhook endpoint in Stripe Dashboard:
   - URL: `https://your-domain.com/api/v1/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

## Customer Portal
Users can manage their subscription, update payment methods, and cancel at:
`GET /api/v1/billing/portal`
