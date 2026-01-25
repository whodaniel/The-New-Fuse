# Set Master Admin Guide

**Email:** bisynth@gmail.com **Role:** SUPER_ADMIN (Master Admin)

## Quick Start

Run this command from the project root to set your email as SUPER_ADMIN:

```bash
pnpm --filter @the-new-fuse/database run admin:set-super
```

## Prerequisites

### 1. Account Must Exist First

You need to have already registered an account with `bisynth@gmail.com`:

**Option A: Register via Frontend**

1. Navigate to https://thenewfuse.com/register
2. Create account with:
   - Email: `bisynth@gmail.com`
   - Password: (your secure password)
   - Other required fields

**Option B: Check if account exists**

```sql
SELECT id, email, role, roles, is_active, created_at
FROM users
WHERE email = 'bisynth@gmail.com';
```

### 2. Database Connection

Ensure your `.env` file (at project root) has:

```env
DATABASE_URL=postgresql://user:password@localhost:5433/thenewfuse
```

Or for Railway/production:

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

## Running the Script

### Method 1: Via Package Script (Recommended)

From project root:

```bash
pnpm --filter @the-new-fuse/database run admin:set-super
```

Or from the database package:

```bash
cd packages/database
pnpm run admin:set-super
```

### Method 2: Direct TypeScript Execution

```bash
pnpm tsx packages/database/scripts/set-super-admin.ts
```

### Method 3: SQL Migration

```bash
psql $DATABASE_URL -f packages/database/drizzle/0002_set_master_admin.sql
```

### Method 4: Manual Database Update

Connect to PostgreSQL and run:

```sql
UPDATE users
SET
  role = 'SUPER_ADMIN',
  roles = '["SUPER_ADMIN"]'::jsonb,
  updated_at = NOW()
WHERE email = 'bisynth@gmail.com';
```

## Expected Output

Successful execution will show:

```
🔧 Setting SUPER_ADMIN role for bisynth@gmail.com
📊 Connecting to database...
🔍 Looking for user: bisynth@gmail.com
✅ User found: {
  id: 'uuid-here',
  email: 'bisynth@gmail.com',
  currentRole: 'USER',
  currentRoles: [ 'USER' ]
}
🔄 Updating user role to SUPER_ADMIN...
✅ SUCCESS! User updated to SUPER_ADMIN

📋 Updated user details:
{
  id: 'uuid-here',
  email: 'bisynth@gmail.com',
  role: 'SUPER_ADMIN',
  roles: [ 'SUPER_ADMIN' ],
  isActive: true,
  updatedAt: 2026-01-25T...
}

🎉 All done! You can now log in as SUPER_ADMIN
   Email: bisynth@gmail.com
   Access: Full admin dashboard at /admin
```

## Verification

### 1. Check Database

```sql
SELECT id, email, role, roles, is_active
FROM users
WHERE email = 'bisynth@gmail.com';
```

Expected:

```
role: SUPER_ADMIN
roles: ["SUPER_ADMIN"]
is_active: true
```

### 2. Test Login

1. Navigate to `/login`
2. Sign in with `bisynth@gmail.com`
3. Should redirect to dashboard

### 3. Test Admin Access

Navigate to these URLs (all should work):

- ✅ `/admin` - Comprehensive admin dashboard
- ✅ `/admin/user-management` - Manage all users
- ✅ `/admin/system-metrics` - System performance
- ✅ `/admin/agent-management` - All agents
- ✅ `/admin/database` - Database admin
- ✅ `/admin/api-analytics` - API metrics
- ✅ `/admin/configuration` - System config
- ✅ `/admin/audit-logs` - Full audit logs
- ✅ `/admin/backup-restore` - Backups
- ✅ `/admin/system-health` - Health monitoring
- ✅ `/admin/feature-flags` - Feature toggles
- ✅ `/admin/port-management` - Port config
- ✅ `/admin/workspaces` - All workspaces
- ✅ `/admin/settings` - Admin settings

### 4. Check Browser Console

Open DevTools console and check:

```javascript
// Should show SUPER_ADMIN
console.log(user.role);
console.log(user.roles);
```

## Troubleshooting

### Error: User Not Found

**Solution:** Register the account first via `/register`

### Error: DATABASE_URL not found

**Solution:** Create/update `.env` file in project root:

```env
DATABASE_URL=postgresql://user:password@localhost:5433/thenewfuse
```

### Error: Connection refused

**Solution:** Start the database:

```bash
# Check if Docker is running
docker ps

# Start database
pnpm run docker:start
```

### Error: Permission denied

**Solution:** Ensure database user has UPDATE permission:

```sql
GRANT UPDATE ON users TO your_db_user;
```

### Script runs but role not changing

**Check 1:** Verify email is exact match (case-sensitive) **Check 2:** Check for
multiple users with same email **Check 3:** Verify database is correct
environment (dev/prod)

## What SUPER_ADMIN Can Do

As SUPER_ADMIN, you have:

### ✅ Platform-Wide Access

- View and manage ALL users across ALL agencies
- View and manage ALL agents and workflows
- Access ALL data regardless of tenant/agency

### ✅ System Administration

- Configure system-level settings
- Manage database
- View audit logs
- System health monitoring
- Port management
- Backup/restore operations

### ✅ Agency Management

- Create new agencies (white-label instances)
- View revenue across all agencies
- Manage agency limits and quotas
- Configure blockchain/revenue sharing

### ✅ Feature Control

- Enable/disable features globally
- Manage feature flags
- Control experimental features

### ✅ Security & Compliance

- Full audit log access
- Security dashboard
- API analytics
- User activity monitoring

## Security Best Practices

### 🔒 Protect Your Credentials

- Use a strong, unique password
- Enable 2FA when available
- Never share SUPER_ADMIN access

### 📝 Audit Trail

- All SUPER_ADMIN actions are logged
- Review audit logs regularly
- Monitor for suspicious activity

### 👥 Limited Access

- Only ONE SUPER_ADMIN (you)
- Create AGENCY_OWNER roles for delegated admin
- Use least-privilege principle

### 🔐 Environment Separation

- Different credentials for dev/staging/prod
- Never use production DB for testing
- Keep backups secure

## Next Steps

After setting SUPER_ADMIN:

1. ✅ **Test Admin Access** - Verify all 14 admin routes work
2. ✅ **Configure System** - Set up initial system settings
3. ✅ **Create First Agency** - Set up your first white-label instance
   (optional)
4. ✅ **Review Security** - Check security dashboard and logs
5. ✅ **Set Up Monitoring** - Configure alerts and monitoring

## Related Documentation

- [Admin Infrastructure Assessment](./ADMIN_INFRASTRUCTURE_ASSESSMENT.md)
- [Admin Infrastructure Fixes Summary](./ADMIN_INFRASTRUCTURE_FIXES_SUMMARY.md)
- [Database Scripts README](../../packages/database/scripts/README.md)

## Support

If you encounter issues:

1. Check [Database Scripts README](../../packages/database/scripts/README.md)
2. Review error messages carefully
3. Verify database connection
4. Check that account exists in database
