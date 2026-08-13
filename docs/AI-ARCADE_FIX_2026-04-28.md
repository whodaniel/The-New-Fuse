# AI-Arcade Landing Page Fix — 2026-04-28

## Summary

The ai-arcade.xyz landing page was completely blank. No React content rendered
inside the `#root` div. The page returned HTTP 200 and the HTML shell loaded
correctly, but the JavaScript application crashed silently during mount.

**There was no RevenueCat paywall integration.** The user's suspicion about
RevenueCat was incorrect — no such code exists in the ai-arcade codebase. The
actual cause was a missing Supabase configuration at build time.

## Root Cause

The Vite production build was compiled **without** `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` environment variables. These are required by
`AuthService.ts` to initialize the Supabase client.

In the deployed build, the config object resolved to:

```js
supabase: { url: void 0, anonKey: void 0 }
```

This caused `AuthService` to set `this.supabase = null as any` (line 21 of the
original code). When `AuthProvider` mounted and called
`authService.getCurrentUser()`, the method tried to call
`this.supabase.auth.getUser()` on `null`, throwing:

```
TypeError: Cannot read properties of null (reading 'auth')
```

Since there was **no React ErrorBoundary** anywhere in the component tree, this
unhandled error crashed the entire React render tree, resulting in a blank
white page with only `<div id="root"></div>` in the DOM.

## Fixes Applied

### Fix 1 — Add `.env.production` with Supabase Credentials

**File:** `apps/ai-arcade/.env.production` (new file)

```
VITE_SUPABASE_URL=https://wslydgtgindrywldatbv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Vite only reads `.env.production` when building with `--mode production`. The
`.env` file (which did have the vars) is only loaded in development mode.

### Fix 2 — Null-Guard All `this.supabase` Calls

**File:** `apps/ai-arcade/src/services/AuthService.ts`

Changed the type from `SupabaseClient` to `SupabaseClient | null` and added
early-return null guards to every method that accesses `this.supabase`:

- `login()` — returns `{ success: false, message: 'Auth is not configured.' }`
- `register()` — same
- `logout()` — skips Supabase signOut, still clears local session
- `getCurrentUser()` — returns `null` (no cached user, no Supabase lookup)

This ensures the app never crashes even if Supabase env vars are missing at
build time. Auth features gracefully degrade (login/register buttons won't
work) but the arcade catalog and browsing still render.

### Fix 3 — Add ErrorBoundary to Prevent Blank Page

**File:** `apps/ai-arcade/src/main.tsx`

Wrapped the entire `<App />` in a class-based `AppErrorBoundary` component
that catches any unhandled React render errors and displays a fallback UI
with:

- Error message in a `<pre>` block
- "Reload" button
- Dark theme matching the arcade aesthetic

This is a safety net: even if a future error slips through, users see a
recovery UI instead of a blank white page.

## Deployment

| Component | Platform | Deployment ID | Timestamp |
|-----------|----------|---------------|-----------|
| AI-Arcade SPA | Cloudflare Pages (`ai-arcade-main`) | `65b154c1` | 2026-04-28 ~20:30 UTC |

## Verification

| Check | Result |
|-------|--------|
| `curl -s https://ai-arcade.xyz/` returns 200 | Yes |
| HTML references `index-BV4XU3C8.js` (new build) | Yes |
| New JS bundle contains Supabase URL | Yes (`wslydgtgindrywldatbv.supabase.co`) |
| New JS bundle contains Supabase anon key | Yes |
| ErrorBoundary present ("Something went wrong" text) | Yes |
| `poker.ai-arcade.xyz` returns 200 | Yes |

## No RevenueCat Integration

Despite the user's suspicion, there is **no RevenueCat SDK, paywall component,
or subscription-gating code** anywhere in the ai-arcade codebase. The
monetization system uses:

- **PayPal Subscriptions** via `@paypal/react-paypal-js` (PayPalButton.tsx)
- **Token purchases** via the backend API (TokenService.ts)
- **Role-based access control** via `accessPolicy.ts`

These systems do not block page rendering. Unauthenticated users can browse
the full arcade catalog.

## Files Changed

| File | Change |
|------|--------|
| `apps/ai-arcade/.env.production` | New file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| `apps/ai-arcade/src/services/AuthService.ts` | Changed `this.supabase` type to `SupabaseClient \| null`; added null guards to `login()`, `register()`, `logout()`, `getCurrentUser()` |
| `apps/ai-arcade/src/main.tsx` | Added `AppErrorBoundary` class component wrapping `<App />` |
