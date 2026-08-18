# Billing Adapter Notice

Legacy AIVI backend billing files are preserved for historical reference, but
TNF billing is now the production source of truth.

Use:

- `apps/api/src/modules/billing/paypal.service.ts`
- `apps/api/src/modules/billing/paypal.controller.ts`
- `apps/api/src/modules/billing/billing.module.ts`

Legacy files adapted:

- `backend/services/paypal.service.js` now throws with TNF references.
- `backend/routes/subscriptions.js` now returns adapter responses and TNF links.

Do not ship legacy direct PayPal SDK billing from this folder in TNF production.
