# Database Scripts

> ⚠️ **RETIRED DEPLOYMENT PATH — do not run these commands.** This guide targets
> Railway. The `cloud_runtime` spelling is the result of a blind `railway` →
> `cloud_runtime` string-replace (commit 62b2a3e2f); no `cloud_runtime` CLI has
> ever existed, so every such command below will fail. TNF deploys on **GCP
> Cloud Run + Cloudflare + Supabase + Upstash**: use
> `scripts/deployment/gcp-deploy.sh` for services (via
> `scripts/deployment/cloudbuild.yaml`) and
> `npx wrangler pages deploy dist --project-name=thenewfuse-main --branch=main`
> for the frontend. Retained for historical reference only.

## Upgrade User to Pro Tier

To upgrade owner@example.com to pro tier, run:

```bash
cd backend
node scripts/upgrade-user.js
```

**Note**: This requires a valid database connection. Make sure your `.env` file
has the correct `DATABASE_URL`.

### Production Deployment

If running on CloudRuntime or another hosted environment:

```bash
# SSH into production or use CloudRuntime CLI
cloud_runtime run node scripts/upgrade-user.js
```

### Manual SQL (Alternative)

If you prefer to run SQL directly, use the migration file:

```bash
psql $DATABASE_URL < migrations/update-bizsynth-to-pro.sql
```

Or copy the SQL and run it in your database GUI:

```sql
UPDATE users
SET tier = 'pro', daily_limit = 999999, updated_at = NOW()
WHERE email = 'owner@example.com';
```

### Verify the Upgrade

After running, the user should have:

- **Tier**: pro
- **Daily Limit**: 999999 (unlimited)
- **Features**: All pro features unlocked
