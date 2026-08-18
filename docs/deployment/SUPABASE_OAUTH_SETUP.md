# 🔐 Supabase OAuth Configuration Guide for thenewfuse.com & app.thenewfuse.com

[CLASS:PRIME] [STATUS:ACTIVE]

This guide provides the exact configuration required in the **Supabase
Dashboard** and **Google Cloud Console** to enable Google / OAuth authentication
across `https://thenewfuse.com` and `https://app.thenewfuse.com`.

---

## 1. Supabase Dashboard URL Configuration

In your Supabase Project Settings -> **Authentication** -> **URL
Configuration**:

- **Site URL**: `https://app.thenewfuse.com`

- **Redirect URLs (Allow List)**:
  - `https://thenewfuse.com/*`
  - `https://app.thenewfuse.com/*`
  - `https://app.thenewfuse.com/auth/callback`
  - `http://localhost:1420/*` (For desktop/local app dev)
  - `http://localhost:3000/*`

---

## 2. Google Cloud Console Credentials (OAuth 2.0 Client ID)

In Google Cloud Console -> **APIs & Services** -> **Credentials**:

1. Create / Edit an **OAuth 2.0 Client ID** (Web application).
2. **Authorized JavaScript origins**:
   - `https://thenewfuse.com`
   - `https://app.thenewfuse.com`
   - `https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co`
3. **Authorized redirect URIs**:
   - `https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback`

---

## 3. Enable Provider in Supabase

In Supabase Project Settings -> **Authentication** -> **Providers** ->
**Google**:

1. Enable **Google Provider**.
2. Input **Client ID** (from Google Cloud Console).
3. Input **Client Secret** (from Google Cloud Console).
4. Save Changes.

---

## 4. Frontend Environment Variables

Ensure the production build environment (Vercel, Cloudflare, or Docker)
includes:

```env
VITE_SUPABASE_URL=https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```
