# TNF Chrome Web Store Submission Pack

This folder contains TNF-adapted assets and listing content for Chrome Web Store
submission of the TNF Chrome extension.

## Files

- `chrome-web-store-description.txt` - Full long description
- `store-listing.md` - Title/summary/highlights/checklist
- `privacy-policy.md` - Policy link and summary
- `terms-of-service.md` - Terms link and summary
- `support.md` - Support channels for TNF users
- `assets/*` - Store icon + screenshots + promo graphics

## Billing Source Of Truth

Do not use legacy AIVI PayPal backend code for production billing.

Use TNF billing implementation:

- `apps/api/src/modules/billing/paypal.service.ts`
- `apps/api/src/modules/billing/paypal.controller.ts`
- `apps/api/src/modules/billing/billing.module.ts`

## Notes

- Some screenshots are currently inherited from legacy AIVI captures and should
  be replaced with final TNF Services-tab captures before final publication.
