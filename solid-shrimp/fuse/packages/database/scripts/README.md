# Database Scripts

Utility scripts for database management.

## Set Super Admin

Sets `bisynth@gmail.com` as the SUPER_ADMIN (Master Admin) for the platform.

### Prerequisites

1. **User must exist**: The email must be registered in the database first
2. **Database connection**: Ensure `DATABASE_URL` is set in your `.env` file

### Option 1: Run TypeScript Script (Recommended)

```bash
# From project root
pnpm tsx packages/database/scripts/set-super-admin.ts

# Or from database package
cd packages/database
pnpm tsx scripts/set-super-admin.ts
```

### Option 2: Run SQL Migration

```bash
# Using psql
psql $DATABASE_URL -f packages/database/drizzle/0002_set_master_admin.sql

# Or using Drizzle Kit
cd packages/database
pnpm drizzle:push
```

### Option 3: Manual Database Update

Connect to your database and run:

```sql
UPDATE users
SET
  role = 'SUPER_ADMIN',
  roles = '["SUPER_ADMIN"]'::jsonb,
  updated_at = NOW()
WHERE email = 'bisynth@gmail.com';
```

### Verify the Update

Check that the role was set correctly:

```sql
SELECT id, email, role, roles, is_active, created_at, updated_at
FROM users
WHERE email = 'bisynth@gmail.com';
```

Expected output:

```
role: SUPER_ADMIN
roles: ["SUPER_ADMIN"]
is_active: true
```

## Troubleshooting

### User Not Found

If you get "User not found", you need to register first:

1. **Via Frontend**: Navigate to `/register` and create an account with
   `bisynth@gmail.com`
2. **Via API**: Use the registration endpoint
3. **Via Database**: Insert directly (not recommended)

### Database Connection Error

Check your `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5433/thenewfuse
```

### Permission Denied

Ensure your database user has UPDATE permissions on the `users` table.

## Testing Access

After setting SUPER_ADMIN:

1. **Login**: Navigate to `/login` and sign in with `bisynth@gmail.com`
2. **Access Admin**: Go to `/admin` - should see ComprehensiveAdminDashboard
3. **Verify Permissions**: Check all admin sections are accessible
4. **Check Role**: Open browser console and inspect user object

## Security Notes

- ⚠️ **SUPER_ADMIN has full platform access** - use carefully
- 🔒 Keep the master admin credentials secure
- 📝 This role bypasses all permission checks
- 🚫 Do not share SUPER_ADMIN access

## Additional Admin Roles

To create other admin types:

```sql
-- Agency Owner
UPDATE users SET role = 'AGENCY_OWNER', roles = '["AGENCY_OWNER"]'::jsonb WHERE email = 'agency@example.com';

-- Agency Admin
UPDATE users SET role = 'AGENCY_ADMIN', roles = '["AGENCY_ADMIN"]'::jsonb WHERE email = 'admin@example.com';

-- Agency Manager
UPDATE users SET role = 'AGENCY_MANAGER', roles = '["AGENCY_MANAGER"]'::jsonb WHERE email = 'manager@example.com';
```

## Role Hierarchy

1. **SUPER_ADMIN** - Platform owner (you) - Full access to everything
2. **AGENCY_OWNER** - White-label instance owner - Manage their agency
3. **AGENCY_ADMIN** - Agency administrator - Manage agency users/agents
4. **AGENCY_MANAGER** - Agency manager - Limited agency management
5. **USER** - Regular user - Personal resources only
