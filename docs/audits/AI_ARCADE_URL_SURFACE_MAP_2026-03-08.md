# AI-Arcade URL Surface Map (2026-03-08)

## Scope

URLs reviewed:

- `https://ai-arcade.xyz/`
- `https://ai-arcade-poker.pages.dev/`
- `https://fae7326d.ai-arcade-poker.pages.dev/`
- `https://poker.ai-arcade.xyz/`
- `https://7b91c0db.ai-arcade-poker.pages.dev/` (latest deployment observed in
  this session)
- `https://gemini.google.com/app/ec6332f27308320a#133951e29c7299c0`
  (external/private tool link)

## What each URL currently is

| URL                                  | Runtime                                                           | What it appears to serve                                            | Notes                                                                                |
| ------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `ai-arcade.xyz`                      | CloudRuntime                                                           | AI-ARCADE frontend shell (`<title>AI-ARCADE`)                       | Uses JS bundle `/assets/index-DRxT0dov.js`.                                          |
| `ai-arcade-poker.pages.dev`          | Cloudflare Pages (production alias for project `ai-arcade-poker`) | AI-ARCADE frontend shell (`<title>AI-ARCADE`)                       | Uses JS bundle `/assets/index-DOlcVTKZ.js`.                                          |
| `7b91c0db.ai-arcade-poker.pages.dev` | Cloudflare Pages (preview deployment)                             | Same build as current production alias                              | Same bundle as production alias in this session.                                     |
| `fae7326d.ai-arcade-poker.pages.dev` | Cloudflare Pages (older preview deployment)                       | Different app (`<title>My Google AI Studio App`)                    | Marked `x-robots-tag: noindex`; appears to be legacy/incorrect preview payload.      |
| `poker.ai-arcade.xyz`                | CloudRuntime                                                           | Dedicated Poker Room/operator UI (`<title>AI-ARCADE.XYZ Poker App`) | Contains heavy control surfaces and console/operator panels.                         |
| `gemini.google.com/...`              | External (Google account-scoped)                                  | Private Gemini workspace/app context                                | Not part of TNF deployment topology; not publicly introspectable from platform side. |

## Relationship to Poker game

- The poker surface is currently **separate** from the AI-ARCADE main frontend:
  - `poker.ai-arcade.xyz` is a dedicated poker/operator web app.
  - `ai-arcade.xyz` and `ai-arcade-poker.pages.dev` are general AI-ARCADE
    frontend builds.
- `ai-arcade-poker.pages.dev` is currently the best candidate for
  Cloudflare-hosted canonical frontend.
- `fae7326d.ai-arcade-poker.pages.dev` is a stale preview deployment and should
  not be treated as canonical.

## Canonical routing recommendation

1. Canonical public frontend:
   - `https://ai-arcade.xyz` -> serve or redirect to
     `https://ai-arcade-poker.pages.dev` (or custom-domain on Cloudflare Pages).
2. Keep preview URLs non-canonical:
   - All `<hash>.ai-arcade-poker.pages.dev` remain internal preview-only
     (`noindex`).
3. Poker operator separation:
   - Keep `https://poker.ai-arcade.xyz` as isolated runtime; do not merge with
     public catalog UI without role enforcement.

## Access-control recommendation by surface

| Surface                                                                                  | Recommended access                                             |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| AI-ARCADE marketing/catalog/play landing                                                 | `PUBLIC`                                                       |
| App submission controls                                                                  | `MEMBER`+ (creator/admin/agent capability)                     |
| Poker game player table (if public launch mode)                                          | `MEMBER` or invite-gated                                       |
| Poker operator/console controls (wallet, chain controls, admin console, trait dashboard) | `SUPER_ADMIN` or explicit `AI_AGENT_MEMBER` operator role only |

## Immediate cleanup actions

1. Add explicit canonical URL strategy (`rel=canonical` and domain-level
   redirect policy).
2. Add edge auth gate in front of `poker.ai-arcade.xyz` operator controls.
3. Remove/retire stale preview references from docs/UI links.
4. Keep Cloudflare Pages as primary distribution surface for AI-ARCADE web
   frontend.
