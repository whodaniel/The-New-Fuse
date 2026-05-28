# TNF Frontend Routing & Redirection

The New Fuse uses a dual-entry frontend architecture deployed on Cloudflare
Pages, with specialized routing handled by Cloudflare Functions.

## 1. Domain Architecture

- **Main Domain**: `thenewfuse.com`
  - Purpose: Static landing page, marketing, public docs.
  - Entry Point: `index.html` (root)
- **App Subdomain**: `app.thenewfuse.com`
  - Purpose: Authenticated SPA (Single Page Application).
  - Entry Point: `app.html` (for all functional routes)

## 2. Server-Side Routing (Cloudflare Functions)

Located at: `apps/frontend/functions/[[path]].js`

### Redirects (Main -> App)

Routes starting with these prefixes on the main domain are 301-redirected to the
app subdomain:

- `/auth/*`
- `/login`
- `/register`
- `/dashboard/*`
- `/app`
- `/app.html`

### SPA Fallback

On `app.thenewfuse.com`, any 404 for a path without an extension (e.g.,
`/dashboard/agents`) is served `app.html`.

## 3. Client-Side Routing (ComprehensiveRouter)

Located at: `apps/frontend/src/ComprehensiveRouter.tsx`

### Legacy /app Redirect

The route `/app` is explicitly redirected to `/dashboard` via
`<Navigate to="/dashboard" replace />`.

### Root Detection

`MarketplaceRootRoute` detects `isAppHost` and redirects `/` to `/dashboard` on
the app subdomain.
