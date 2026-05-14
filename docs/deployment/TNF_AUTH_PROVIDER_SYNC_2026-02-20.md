# TNF Auth Provider Sync (Google + Email + Unstoppable Domains)

## What Was Fixed

1. Google + email auth now converge on backend JWT issuance instead of diverging
   between Firebase-only and backend-only sessions.
2. Unstoppable Domains account linking now avoids duplicate/conflicting records
   by linking on wallet and deterministic UD email.
3. Google OAuth callback route mismatch was fixed (`/auth/google/callback` now
   routed in frontend).
4. Unstoppable Domains SDK loading is now controlled by
   `VITE_ENABLE_UNSTOPPABLE_DOMAINS` and no longer hard-disabled for all builds.

## Changed Files

- `apps/frontend/src/hooks/useAuth.tsx`
- `apps/frontend/src/hooks/useUnstoppableDomains.ts`
- `apps/frontend/src/services/unstoppableDomains.service.ts`
- `apps/frontend/src/pages/auth/GoogleCallback.tsx`
- `apps/frontend/src/ComprehensiveRouter.tsx`
- `apps/frontend/src/main.tsx`
- `apps/frontend/vite.config.ts`
- `apps/backend/src/auth/auth.controller.ts`
- `apps/backend/src/auth/auth.service.ts`

## Required Environment Variables

### Frontend

- `VITE_API_URL` (example: `https://api-production-48f1.thenewfuse.com`)
- Firebase (if using Firebase sign-in/register):
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
- Unstoppable Domains:
  - `VITE_ENABLE_UNSTOPPABLE_DOMAINS=true`
  - `VITE_UNSTOPPABLE_DOMAINS_CLIENT_ID=<your ud client id>`
  - `VITE_UNSTOPPABLE_DOMAINS_REDIRECT_URI=https://thenewfuse.com/auth/unstoppable-callback`

### Backend

- JWT:
  - `JWT_SECRET`
- Google OAuth:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_CALLBACK_URL=https://api.thenewfuse.com/auth/google/callback`
  - `FRONTEND_URL=https://thenewfuse.com`
- Firebase Admin (if using Firebase token verification):
  - `FIREBASE_PROJECT_ID`
  - plus platform credentials for `applicationDefault()` in runtime

## Post-Deploy Verification

1. Email register on `/auth/register` creates account and lands on authenticated
   dashboard.
2. Email login on `/auth/login` returns backend JWT and `/auth/me` resolves.
3. Google login works from `/auth/login` and `/auth/register`.
4. Google OAuth callback URL resolves on frontend route:
   - `/auth/google/callback?token=...`
5. Unstoppable Domains login button works only when enabled + configured.
6. UD callback route succeeds:
   - `/auth/unstoppable-callback`
7. Backend UD endpoint returns token + user:
   - `POST /auth/unstoppable-domains`
