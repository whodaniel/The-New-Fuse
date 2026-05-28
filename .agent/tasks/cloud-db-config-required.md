# Cloud Database Configuration Required

## Issue

TNF Doctor shows:
`DATABASE_URL is local while TNF requires cloud-rooted execution`

## Current State

- `.env.local` has:
  `DATABASE_URL=postgresql://username:password@localhost:5432/the_new_fuse`
- This is a placeholder, not a real cloud DB

## Solution Options

### Option 1: Use Railway Production DB

```bash
# Get DATABASE_URL from Railway dashboard
# Or run: railway env list

# Add to .env.local:
DATABASE_URL="postgresql://user:pass@host:port/dbname"
```

### Option 2: Use Cloudflare D1

```bash
# Configure D1 database
wrangler d1 create tnf-db
```

### Option 3: Use Supabase/Neon

```bash
# Create cloud DB at supabase.com or neon.tech
# Update DATABASE_URL
```

## Quick Override (Development Only)

```bash
export TNF_ALLOW_LOCAL_DB=1
tnf doctor
```

## Verification

After setting cloud DATABASE_URL:

```bash
tnf doctor
# Should show: Cloud-Rooted DB Policy: OK
```

---

_Action needed: User must provide cloud DATABASE_URL_ _Created: 2026-03-23_
