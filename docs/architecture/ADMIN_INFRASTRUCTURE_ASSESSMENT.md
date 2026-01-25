# Admin Infrastructure Assessment & Remediation Plan

**Date:** January 25, 2026 **Status:** Critical Assessment Complete

## Executive Summary

The New Fuse has a **sophisticated multi-tenant admin infrastructure** that
supports three distinct permission tiers, but currently has **critical gaps in
routing, permission enforcement, and UI completeness**. This assessment covers
the current state and provides a comprehensive remediation plan.

---

## Permission Hierarchy

### 1. **Master Admin (SUPER_ADMIN)**

**Who:** You, the platform owner **Scope:** Global access to ALL data and
controls **Capabilities:**

- View/manage ALL agencies, users, agents, workflows across the entire platform
- System-level configuration (ports, services, database, security)
- Revenue monitoring and blockchain operations
- Feature flag management for entire platform
- Full audit log access

### 2. **Agency Admin Tier**

**Roles:** `AGENCY_OWNER`, `AGENCY_ADMIN`, `AGENCY_MANAGER` **Scope:**
White-label instance management **Capabilities:**

- Manage their agency's users (within agency user limits)
- Deploy/manage agents (within agency agent limits)
- Configure agency branding (colors, logo, custom domain)
- View agency-specific analytics and revenue
- Manage workflows within their agency
- **Isolation:** Cannot see or access other agencies' data

### 3. **Regular User**

**Roles:** `USER`, `AGENT_OPERATOR` **Scope:** Personal resource management
**Capabilities:**

- Create/manage own agents and workflows
- Participate in assigned workspaces
- Limited read access to public resources

---

## Current Database Schema (CORRECT)

### User Roles (from `packages/database/src/drizzle/schema/enums.ts`)

```typescript
export const userRoleEnum = pgEnum('UserRole', [
  'USER', // Regular user
  'ADMIN', // Legacy - being phased out
  'SUPER_ADMIN', // ✅ Master Admin (YOU)
  'AGENCY_OWNER', // ✅ White-label owner
  'AGENCY_ADMIN', // ✅ Agency administrator
  'AGENCY_MANAGER', // ✅ Agency manager
  'AGENT_OPERATOR', // Limited agent operations
]);
```

### Agency Infrastructure

- **Service:** `packages/core/src/services/agency.service.ts` ✅ Fully
  implemented
- **Controller:**
  `apps/api/src/modules/agency-hub/controllers/agency.controller.ts` ✅ Working
- **White-Label Features:**
  - Custom branding (colors, logo, favicon, domain)
  - Isolated agent/user limits
  - Revenue sharing configuration
  - Feature toggles per agency
  - Subdomain routing (`agency.thenewfuse.com`)

---

## Critical Issues Found

### Issue #1: Broken Admin Routing

**Severity:** 🔴 CRITICAL

**Problem:** The main
[/admin](apps/frontend/src/pages/Admin/ComprehensiveAdminDashboard.tsx:252) page
shows 10 admin sections, but **8 of them have no routes**:

| Component Link            | Has Route? | Component Exists?                                                                                 |
| ------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `/admin/user-management`  | ❌ NO      | ✅ Yes ([UserManagementFull.tsx](apps/frontend/src/pages/Admin/UserManagementFull.tsx))           |
| `/admin/system-metrics`   | ❌ NO      | ✅ Yes ([SystemMetricsDashboard.tsx](apps/frontend/src/pages/Admin/SystemMetricsDashboard.tsx))   |
| `/admin/agent-management` | ❌ NO      | ✅ Yes ([AgentManagementFull.tsx](apps/frontend/src/pages/Admin/AgentManagementFull.tsx))         |
| `/admin/database`         | ❌ NO      | ✅ Yes ([DatabaseAdminPanel.tsx](apps/frontend/src/pages/Admin/DatabaseAdminPanel.tsx))           |
| `/admin/api-analytics`    | ❌ NO      | ✅ Yes ([APIAnalyticsFull.tsx](apps/frontend/src/pages/Admin/APIAnalyticsFull.tsx))               |
| `/admin/configuration`    | ❌ NO      | ✅ Yes ([ConfigurationManagement.tsx](apps/frontend/src/pages/Admin/ConfigurationManagement.tsx)) |
| `/admin/audit-logs`       | ❌ NO      | ✅ Yes ([AuditLogViewer.tsx](apps/frontend/src/pages/Admin/AuditLogViewer.tsx))                   |
| `/admin/backup-restore`   | ❌ NO      | ✅ Yes ([BackupRestore.tsx](apps/frontend/src/pages/Admin/BackupRestore.tsx))                     |
| `/admin/system-health`    | ✅ YES     | ✅ Yes                                                                                            |
| `/admin/feature-flags`    | ✅ YES     | ✅ Yes                                                                                            |

**Impact:** Users clicking these sections get 404 errors.

### Issue #2: No Permission Guards on Admin Routes

**Severity:** 🟠 HIGH

**Problem:** Current routes in
[ComprehensiveRouter.tsx](apps/frontend/src/ComprehensiveRouter.tsx:334) don't
enforce role-based access:

```tsx
<Route path="/admin" element={<AdminPanel />} />
// ❌ NO permission check! Any authenticated user can access
```

**Required:**

```tsx
<Route
  path="/admin"
  element={
    <RequirePermission roles={['SUPER_ADMIN']}>
      <ComprehensiveAdminDashboard />
    </RequirePermission>
  }
/>
```

### Issue #3: Wrong Dashboard at `/admin`

**Severity:** 🟡 MEDIUM

Currently `/admin` loads
[AdminPanel.tsx](apps/frontend/src/pages/Admin/AdminPanel.tsx:40) (simpler
dashboard) instead of
[ComprehensiveAdminDashboard.tsx](apps/frontend/src/pages/Admin/ComprehensiveAdminDashboard.tsx:64)
(full-featured with charts, metrics, and 10 sections).

### Issue #4: No Agency Admin UI

**Severity:** 🟡 MEDIUM

Agency admins have **backend infrastructure** but **no dedicated frontend
pages**:

- Missing: `/agency-admin` route for `AGENCY_OWNER/AGENCY_ADMIN` users
- Missing: Agency settings UI (branding, limits, users)
- Missing: Agency analytics dashboard
- Existing:
  [AgencyDashboard.tsx](apps/frontend/src/pages/Agency/AgencyDashboard.tsx) and
  [AgencyOnboarding.tsx](apps/frontend/src/pages/Agency/AgencyOnboarding.tsx)
  exist but aren't routed properly

### Issue #5: Incomplete Authorization System

**Severity:** 🟡 MEDIUM

[useAuthorization.ts](apps/frontend/src/hooks/useAuthorization.ts:1) only checks
for legacy `ADMIN` role, missing:

- `SUPER_ADMIN` checks
- `AGENCY_OWNER/AGENCY_ADMIN/AGENCY_MANAGER` differentiation
- Tenant isolation enforcement

---

## Remediation Plan

### Phase 1: Master Admin Fixes (IMMEDIATE)

#### 1.1 Create Permission Guard Component

```tsx
// apps/frontend/src/components/auth/RequirePermission.tsx
import { Navigate } from 'react-router-dom';
import { useAuthorization } from '@/hooks/useAuthorization';

interface RequirePermissionProps {
  roles?: string[];
  permissions?: PermissionCheck;
  children: React.ReactNode;
  fallback?: string; // redirect path
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  roles,
  permissions,
  children,
  fallback = '/unauthorized',
}) => {
  const { hasRole, canAccess } = useAuthorization();

  if (roles && !hasRole(roles)) {
    return <Navigate to={fallback} replace />;
  }

  if (permissions && !canAccess(permissions)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};
```

#### 1.2 Add All Missing Routes

Update [ComprehensiveRouter.tsx](apps/frontend/src/ComprehensiveRouter.tsx):

```tsx
// Add lazy imports
const ComprehensiveAdminDashboard = lazy(() => import('./pages/Admin/ComprehensiveAdminDashboard'));
const UserManagementFull = lazy(() => import('./pages/Admin/UserManagementFull'));
const SystemMetricsDashboard = lazy(() => import('./pages/Admin/SystemMetricsDashboard'));
const AgentManagementFull = lazy(() => import('./pages/Admin/AgentManagementFull'));
const DatabaseAdminPanel = lazy(() => import('./pages/Admin/DatabaseAdminPanel'));
const APIAnalyticsFull = lazy(() => import('./pages/Admin/APIAnalyticsFull'));
const ConfigurationManagement = lazy(() => import('./pages/Admin/ConfigurationManagement'));
const AuditLogViewer = lazy(() => import('./pages/Admin/AuditLogViewer'));
const BackupRestore = lazy(() => import('./pages/Admin/BackupRestore'));

// Master Admin Routes (wrapped in permission guard)
<Route
  path="/admin"
  element={
    <RequirePermission roles={['SUPER_ADMIN']}>
      <ComprehensiveAdminDashboard />
    </RequirePermission>
  }
/>
<Route
  path="/admin/user-management"
  element={
    <RequirePermission roles={['SUPER_ADMIN']}>
      <UserManagementFull />
    </RequirePermission>
  }
/>
// ... (add all 10 routes)
```

#### 1.3 Update Authorization Hook

Enhance [useAuthorization.ts](apps/frontend/src/hooks/useAuthorization.ts):

```typescript
export const useAuthorization = () => {
  const { user } = useAuth();

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;

    // Check if user.roles array includes any of the required roles
    if (Array.isArray(user.roles)) {
      return roles.some((role) =>
        user.roles
          .map((r: string) => r.toUpperCase())
          .includes(role.toUpperCase())
      );
    }

    // Fallback to single role check
    return roles.map((r) => r.toUpperCase()).includes(user.role.toUpperCase());
  };

  return {
    hasRole,
    canAccess,
    isSuperAdmin: hasRole(['SUPER_ADMIN']),
    isAgencyOwner: hasRole(['AGENCY_OWNER']),
    isAgencyAdmin: hasRole(['AGENCY_ADMIN', 'AGENCY_MANAGER']),
    isAdmin: hasRole(['SUPER_ADMIN', 'ADMIN']),
    userRole: user?.role.toUpperCase(),
  };
};
```

### Phase 2: Agency Admin Interface

#### 2.1 Create Agency Admin Dashboard Route

```tsx
const AgencyAdminDashboard = lazy(
  () => import('./pages/AgencyAdmin/Dashboard')
);

<Route
  path="/agency-admin"
  element={
    <RequirePermission
      roles={['AGENCY_OWNER', 'AGENCY_ADMIN', 'AGENCY_MANAGER']}
    >
      <AgencyAdminDashboard />
    </RequirePermission>
  }
/>;
```

#### 2.2 Agency Admin Pages Structure

```
/agency-admin
  /dashboard       - Agency metrics, revenue, limits
  /users           - Manage agency users (within limits)
  /agents          - Agency agent management
  /branding        - Custom theme, logo, domain
  /settings        - Agency configuration
  /analytics       - Agency-specific analytics
```

### Phase 3: Backend Permission Enforcement

#### 3.1 Add Role Guards to Controllers

```typescript
// apps/api/src/modules/admin/admin.controller.ts
import { Roles } from '@/auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {

  @Get('system-metrics')
  @Roles('SUPER_ADMIN')  // ✅ Only master admin
  async getSystemMetrics() { ... }

  @Get('all-agencies')
  @Roles('SUPER_ADMIN')  // ✅ Only master admin
  async getAllAgencies() { ... }
}
```

#### 3.2 Agency Controller Isolation

```typescript
// apps/api/src/modules/agency-hub/controllers/agency.controller.ts
@Controller('agency')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class AgencyController {
  @Get('my-users')
  @Roles('AGENCY_OWNER', 'AGENCY_ADMIN')
  async getAgencyUsers(@CurrentUser() user) {
    // TenantGuard ensures they only see THEIR agency's users
    return this.agencyService.getUsersByAgency(user.agencyId);
  }
}
```

---

## Implementation Priority

| Task                                  | Severity    | Effort  | Priority |
| ------------------------------------- | ----------- | ------- | -------- |
| Fix broken admin routes               | 🔴 Critical | 2 hours | **P0**   |
| Add permission guards                 | 🟠 High     | 3 hours | **P0**   |
| Update useAuthorization               | 🟠 High     | 1 hour  | **P0**   |
| Switch to ComprehensiveAdminDashboard | 🟡 Medium   | 30 min  | **P1**   |
| Create Agency Admin UI                | 🟡 Medium   | 8 hours | **P1**   |
| Backend permission enforcement        | 🟠 High     | 4 hours | **P1**   |
| Comprehensive testing                 | 🟡 Medium   | 6 hours | **P2**   |

---

## Security Considerations

### Data Isolation

- ✅ **Master Admin:** Can see ALL agencies, ALL users, ALL data
- ✅ **Agency Admin:** Can ONLY see their agency's data (enforced by
  TenantGuard)
- ✅ **Regular User:** Can ONLY see their own resources

### Route Protection

- ✅ All `/admin/*` routes require `SUPER_ADMIN` role
- ✅ All `/agency-admin/*` routes require
  `AGENCY_OWNER/AGENCY_ADMIN/AGENCY_MANAGER`
- ✅ Fallback to `/unauthorized` page for unauthorized access

### API Endpoint Security

- ✅ JWT authentication on all endpoints
- ✅ Role guards on sensitive operations
- ✅ Tenant isolation middleware
- ✅ Audit logging for admin actions

---

## Next Steps

Would you like me to proceed with:

1. **Immediate fixes** (P0 tasks): Fix all broken routes, add permission guards
2. **Agency Admin UI creation** (P1): Build out the agency admin interface
3. **Both simultaneously** with parallel implementation

I recommend starting with **P0 tasks** to ensure the master admin interface is
fully functional, then moving to the Agency Admin UI.
