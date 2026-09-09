# Consolidation kit audit and implementation

Source: operator-supplied `tnf-consolidation-kit.zip`, including its September 6
live-audit README. Audited against freshly fetched canonical `origin/main` at
`467d6f9d6434c79011454c711c1b44479b5473d6`. Implementation branch:
`tnf/worktree/consolidation-kit-20260906`. Classification: core / oss_runtime /
product_state / public.

The ZIP's production observations are supplied evidence, not a new live
production audit. Source inspection confirms the auth failure mechanisms and CSS
cascade conflict. Changes extend the existing frontend authorities; the ZIP is
not imported as a second auth or component library.

## Implemented

- `services/authRequest.ts`: six-second deadlines include body consumption, not
  just headers. Shared by bootstrap requests and session validation. Refresh has
  one six-second budget across backend refresh, provider refresh, and backend
  exchange, with abort and late-result checks.
- `services/authSession.ts`: retains single-flight refresh and HttpOnly cookie
  support; transient HTTP, network, timeout, and malformed-response failures
  preserve credentials. Stops recursive validation after one refresh. An access
  token copied into a refresh slot is not submitted as a refresh credential.
  Resource bearer candidates and refresh outcomes no longer silently adopt a raw
  Supabase token. API URL resolution uses the existing configured API base.
- `hooks/useAuth.tsx`: a failed session check returns anonymous only for a
  confirmed 401; other failures produce a retryable unavailable state. Bootstrap
  attempts refresh before discarding a rejected access token. Removes the timer
  that ended loading before bootstrap settled, and client-only authentication
  fallbacks after backend exchange failure. Provider session discovery is
  bounded. Protected pages require backend-verified identity.
- `components/RequireAuth.tsx`: unavailable sessions render a retry screen
  without mounting protected children or redirecting to login; preserves
  pathname, search and hash at redirect time; redirect-loop exhaustion renders
  an error instead of a blank page.
- `utils/authToken.ts`: permission-denied 403 responses no longer initiate token
  refresh.
- `components/auth/AuthConnectionChip.tsx`: removes duplicate mount validation
  and avoids automatic refresh/session probes while unauthenticated.
- `styles/globals.css`: imports the existing design system in
  `layer(components)`, allowing Tailwind utilities to override legacy `.card`
  defaults.
- `pages/auth/Register.tsx`: removes the literal timestamp/identity debug panel
  and implementation-facing copy; adds a main landmark, error alert, and
  password-manager autocomplete fields.
- `pages/Suggestions/index.tsx`: gives vote controls descriptive accessible
  names and minimum 44px hit areas.

## Kit disposition

| Recommendation                                                                | Source finding and disposition                                                                                                                                                                                                                                                                         |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Replace all auth files                                                        | Adapted into existing `authSession`, `useAuth`, and `RequireAuth`. The supplied `RequireSession` imports a provider the kit does not include and mounts protected children while degraded; that would preserve the failing resource-query behavior.                                                    |
| Skip refresh without a JS refresh token                                       | Rejected: `apps/api/src/controllers/auth.controller.ts` accepts `tnf_refresh_token` from an HttpOnly cookie.                                                                                                                                                                                           |
| Clear only rejected credentials                                               | Implemented for the changed recovery paths. The kit itself returns null on network/5xx refresh failure, then clears credentials; this behavior was not copied.                                                                                                                                         |
| Delete every token alias immediately                                          | Not adopted: existing direct readers still use legacy keys (`useApi`, `useAuthContext`, onboarding-admin, terminalGraph and others). Compatibility mirrors stay until those consumers migrate together. The central service remains their writer.                                                      |
| New primitives and page wrappers                                              | Existing Card/Button/Badge/Skeleton components and Suggestions loading/error/empty states already cover these responsibilities. No duplicate library added. A broader visual migration is not required to repair the verified cascade failure.                                                         |
| Force dark-only or rebuild light theme                                        | Product/design decision remains: ThemeProvider already synchronizes class and data-theme; hardcoded dark surfaces and light preference support still coexist. No stored user preference was overwritten.                                                                                               |
| Replace sidebar groups                                                        | Current Nexus links include distinct layer parameters, consumed by SynapticNexus; its layer buttons have accessible names. The reported four identical destinations/unnamed controls do not describe current source. No broad sidebar rewrite.                                                         |
| Curation 404                                                                  | Current inspected sidebar does not contain `/curation`; do not reintroduce or invent a destination based on an older deployed observation.                                                                                                                                                             |
| Three.js/d3/fonts bundle overhaul                                             | Multiple font imports and visualization dependencies exist, but source inventory alone does not prove duplicate runtime instances or wasted initial chunks. Production bundle inspection remains blocked by missing workspace build artifacts. Font selection and dependency removal were not guessed. |
| Full route blank/spinner inventory                                            | Refresh deadlock addressed and regression-tested. This is not a new authenticated walkthrough of every production route; remaining page-specific behavior requires live verification after integration.                                                                                                |
| Auth provider choices, marketplace/footer/navigation information architecture | Separate product/layout changes; preserved existing implementations. Signup's directly verifiable accessibility/debug defects were fixed.                                                                                                                                                              |

## Verification

- Focused Vitest suites: session recovery, Supabase exchange, AuthProvider
  recovery, existing RequireAuth behavior, and API URL resolution. Final results
  recorded in the session handoff.
- Real local HTTP smoke: actual successful JSON fetch plus a server that sends
  headers/partial JSON and never ends the body. The stalled request rejected in
  6005ms; no fetch replacement or fake timer was used for this check.
- Actual Tailwind/PostCSS compilation of `globals.css`: PASS; generated 532228
  bytes; `.card` emitted in the components layer. This proves compilation/layer
  placement, not a full visual regression sweep.
- `git diff --check`: PASS.
- Full frontend Vite build: blocked after 1510 transformed modules by missing
  `packages/workflow-builder/dist` imported from
  `pages/workflow-pages/Builder.tsx` in this isolated checkout.
- Full frontend typecheck: workspace-wide failures include missing a2a/types
  package declarations and unrelated existing source errors. Do not treat
  focused checks as repository-wide readiness. Changed-path diagnostics were
  checked separately after correcting the newly introduced nullable provider
  reference.

## Integration and remaining work

All edits are isolated from the dirty canonical checkout. No production
deployment, merge, or downstream publication was performed. Review the branch
against the recorded base, provision/build its workspace dependencies, rerun the
frontend build and typecheck, then perform a signed-in browser check of refresh
recovery, navigation, and card styling before deploying. Preserve unrelated
canonical changes. Token-consumer migration, theme policy, and bundle
optimization remain separate follow-up work with the evidence requirements
above.
