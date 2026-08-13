# Authentication & Authorization Fixes

## Summary

Fixed critical authentication and authorization issues:

1. **Logout button not working** - Fixed logout functionality and added redirect
2. **Admin panel 404 error** - Fixed "Cannot read properties of null (reading
   'roles')" error
3. **User roles not loading** - Implemented proper backend authentication to
   fetch user roles from database

## Files Modified

### Frontend Changes

1. **[apps/frontend/src/hooks/useAuth.tsx](apps/frontend/src/hooks/useAuth.tsx)**
   - Added `roles`, `agencyId`, and `tenantId` to User interface
   - Implemented `fetchUserDetails()` function to call `/api/auth/me` after
     Firebase authentication
   - Updated `onAuthStateChanged`, `login`, `register`, and `signInWithGoogle`
     to fetch actual user roles from backend
   - Enhanced `logout()` to properly clear localStorage and redirect

2. **[apps/frontend/src/hooks/useAuthorization.ts](apps/frontend/src/hooks/useAuthorization.ts)**
   - Added null safety checks in `hasRole()` to prevent "Cannot read properties
     of null" errors
   - Fixed `userRole` and `userRoles` to handle null/undefined values safely

3. **[apps/frontend/src/components/layout/Header.tsx](apps/frontend/src/components/layout/Header.tsx)**
   - Fixed to use `user.name` instead of `user.displayName` (matching User
     interface)
   - Added navigation to `/login` after logout
   - Added role display in user dropdown menu
   - Added error handling in logout function

### Backend Changes

4. **[apps/api/src/guards/auth.guard.ts](apps/api/src/guards/auth.guard.ts)**
   - **CRITICAL FIX**: Replaced mock implementation with real JWT authentication
   - Validates JWT tokens from Authorization header
   - Fetches user from database and attaches to request
   - Properly handles authentication errors

5. **[apps/api/src/services/auth.service.ts](apps/api/src/services/auth.service.ts)**
   - Updated `getCurrentUser()` to accept userId parameter
   - Added proper implementation to fetch user from database

6. **[apps/api/src/controllers/auth.controller.ts](apps/api/src/controllers/auth.controller.ts)**
   - Updated `/api/auth/me` endpoint to return authenticated user from request
   - Added `@Request()` decorator to access user attached by AuthGuard

### Database Changes

7. **[packages/database/drizzle/0003_fix_master_admin_email.sql](packages/database/drizzle/0003_fix_master_admin_email.sql)**
   - New migration to fix email typo: `owner@example.com` → `owner@example.com`
   - Sets SUPER_ADMIN role and roles array for the correct email

## How to Apply the Fixes

### Step 1: Stop Running Services

```bash
pnpm run docker:stop
```

### Step 2: Run Database Migration

```bash
# Option A: Using pnpm scripts (if configured)
pnpm run db:migrate

# Option B: Manually with psql
psql -d your_database_name -f packages/database/drizzle/0003_fix_master_admin_email.sql
```

### Step 3: Rebuild Backend

```bash
cd apps/api
pnpm run build
```

### Step 4: Rebuild Frontend

```bash
cd apps/frontend
pnpm run build
```

### Step 5: Restart Services

```bash
# Start infrastructure
pnpm run docker:start

# Wait for PostgreSQL and Redis to be ready
sleep 5

# Start all services
pnpm run dev
```

### Step 6: Clear Browser State

1. Open browser DevTools (F12)
2. Go to Application → Storage
3. Click "Clear site data"
4. Close and reopen the browser

### Step 7: Login Again

1. Go to https://thenewfuse.com/login
2. Login with `owner@example.com`
3. Your SUPER_ADMIN role should now load from the database
4. You should be able to access `/admin` and all admin routes

## What Changed

### Before

- Frontend always set user role to 'user' (hardcoded)
- AuthGuard was a mock that always returned `true`
- `/api/auth/me` endpoint returned `null`
- Logout didn't clear auth token or redirect
- Clicking logout button did nothing

### After

- Frontend fetches actual user role from backend after Firebase authentication
- AuthGuard validates JWT tokens and attaches authenticated user to request
- `/api/auth/me` returns full user object with roles from database
- Logout clears Firebase session, localStorage, and redirects to login
- Admin panel access works based on actual SUPER_ADMIN role from database

## Testing Checklist

- [ ] Logout button successfully logs out and redirects to `/login`
- [ ] Login with `owner@example.com` loads SUPER_ADMIN role
- [ ] User role is displayed in header dropdown menu
- [ ] Can access `/admin` route without 404 error
- [ ] Can access all admin subroutes:
  - [ ] `/admin/user-management`
  - [ ] `/admin/system-metrics`
  - [ ] `/admin/agent-management`
  - [ ] `/admin/database`
  - [ ] `/admin/api-analytics`
  - [ ] `/admin/configuration`
  - [ ] `/admin/audit-logs`
  - [ ] `/admin/backup-restore`
  - [ ] `/admin/system-health`
  - [ ] `/admin/feature-flags`
- [ ] No more "Cannot read properties of null (reading 'roles')" errors
- [ ] Profile and Settings links in header work correctly

## Environment Variables Required

Ensure these are set in your `.env` file:

```env
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
DATABASE_URL=postgresql://user:password@localhost:5433/database_name
```

## Troubleshooting

### Issue: Still getting 404 on /admin

**Solution:** Clear browser cache and localStorage, then login again

### Issue: Role is still showing as 'user'

**Solution:**

1. Verify the database migration ran successfully:
   ```sql
   SELECT id, email, role, roles FROM users WHERE email = 'owner@example.com';
   ```
2. Should show role='SUPER_ADMIN' and roles='["SUPER_ADMIN"]'

### Issue: Logout button does nothing

**Solution:** Check browser console for errors. Ensure backend is running and
AuthGuard dependencies are installed.

### Issue: Backend errors about JwtService or ConfigService

**Solution:** Ensure these are properly provided in your AuthModule:

```typescript
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
```

## Security Notes

- JWT tokens now expire after 15 minutes (access token)
- Refresh tokens expire after 7 days
- All authenticated endpoints now properly validate tokens
- User role is fetched fresh from database on each authentication
- SUPER_ADMIN has access to all routes and resources
