# Zo Crawl -> TNF Parity Diff (2026-03-25)

## Crawl scope

- Start URL: `https://whodaniel.zo.computer/?chat=new_ftjvdq`
- Captured pages: `131`
- Unique in-scope paths: `128`
- Artifacts:
  - `crawl-summary.json`
  - `pages/*/page.json`
  - `pages/*/page.html`
  - `pages/*/page.txt`
  - `pages/*/*.png`

## High-signal Zo routes discovered

- Product/navigation: `/`, `/channels`, `/skills`, `/tools`, `/integrations`,
  `/pricing`, `/about`
- Skill catalog: `/skills`, `/skills/*`
- Tool catalog: `/tools`, `/tools/*`
- Onboarding/auth: `/signup`, `/signup?handle=whodaniel`

## TNF parity mapping activated

- `/channels` and `/channels/*` -> TNF chat (`/chat`)
- `/tools` and `/tools/*` -> TNF resources catalog (`/skills`/resources
  dashboard)
- `/integrations` and `/integrations/*` -> TNF resources catalog (`/resources`)
- `/models` -> TNF API/model settings (`/settings/api`)
- `/faq` -> TNF docs (`/docs`)
- `/comparisons` -> TNF product map (`/product-map`)
- `/careers` and `/ambassador` -> TNF community (`/community`)
- `/testimonials` -> TNF landing testimonials anchor (`/#testimonials`)
- Existing parity pages retained:
  - `/files`, `/datasets`, `/hosting`, `/space`, `/automations`, `/terminal`,
    `/system`, `/billing`, `/bookmarks`, `/settings`

## Implementation updates for this crawl

- Route aliases added in `apps/frontend/src/ComprehensiveRouter.tsx`.
- Route catalog updated in `apps/frontend/src/config/routeCatalog.ts`.
- Competitive parity registry updated in
  `apps/frontend/src/config/zoParityFeatures.ts`.
- Parity docs refreshed in `docs/competitive/zo-parity/`.

## Notes

- This capture reflects what was reachable from Playwright browser automation in
  this environment.
- If authenticated/private Zo pages are required, rerun with an authenticated
  browser context and recapture into a new dated folder.
