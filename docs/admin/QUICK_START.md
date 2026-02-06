# Admin Dashboard - Quick Start Guide

## Installation

### 1. Frontend Dependencies

Ensure you have the required dependencies installed:

```bash
cd apps/frontend
npm install recharts lucide-react
```

### 2. Backend Setup

Add the Admin module to your backend:

```typescript
// apps/backend/src/app.module.ts
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    // ... other modules
    AdminModule,
  ],
})
export class AppModule {}
```

### 3. Router Configuration

Add admin routes to your frontend router:

```typescript
// In your router configuration file
import { lazy } from 'react';

const ComprehensiveAdminDashboard = lazy(() => import('./pages/Admin/ComprehensiveAdminDashboard'));
const UserManagementFull = lazy(() => import('./pages/Admin/UserManagementFull'));
const SystemMetricsDashboard = lazy(() => import('./pages/Admin/SystemMetricsDashboard'));
const AgentManagementFull = lazy(() => import('./pages/Admin/AgentManagementFull'));
const DatabaseAdminPanel = lazy(() => import('./pages/Admin/DatabaseAdminPanel'));
const APIAnalyticsFull = lazy(() => import('./pages/Admin/APIAnalyticsFull'));
const ConfigurationManagement = lazy(() => import('./pages/Admin/ConfigurationManagement'));
const AuditLogViewer = lazy(() => import('./pages/Admin/AuditLogViewer'));
const BackupRestore = lazy(() => import('./pages/Admin/BackupRestore'));

// Add routes
const adminRoutes = [
  { path: '/admin', element: <ComprehensiveAdminDashboard /> },
  { path: '/admin/user-management', element: <UserManagementFull /> },
  { path: '/admin/system-metrics', element: <SystemMetricsDashboard /> },
  { path: '/admin/agent-management', element: <AgentManagementFull /> },
  { path: '/admin/database', element: <DatabaseAdminPanel /> },
  { path: '/admin/api-analytics', element: <APIAnalyticsFull /> },
  { path: '/admin/configuration', element: <ConfigurationManagement /> },
  { path: '/admin/audit-logs', element: <AuditLogViewer /> },
  { path: '/admin/backup-restore', element: <BackupRestore /> },
];
```

### 4. Add Admin Guard (Security)

Create an admin guard to protect routes:

```typescript
// apps/backend/src/modules/admin/guards/admin.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
```

Apply the guard to the controller:

```typescript
// apps/backend/src/modules/admin/admin.controller.ts
import { UseGuards } from '@nestjs/common';
import { AdminGuard } from './guards/admin.guard';

@UseGuards(AdminGuard)
@Controller('api/admin')
export class AdminController {
  // ... controller code
}
```

## Quick Access

Once set up, access the admin dashboard at:

```
http://localhost:3000/admin
```

## Features Overview

| Feature          | Route                     | Description                                  |
| ---------------- | ------------------------- | -------------------------------------------- |
| Main Dashboard   | `/admin`                  | Overview of system metrics and quick actions |
| User Management  | `/admin/user-management`  | Manage users, roles, and permissions         |
| System Metrics   | `/admin/system-metrics`   | Real-time performance monitoring             |
| Agent Management | `/admin/agent-management` | Control and monitor AI agents                |
| Database Admin   | `/admin/database`         | Execute queries and manage database          |
| API Analytics    | `/admin/api-analytics`    | API usage and performance metrics            |
| Configuration    | `/admin/configuration`    | System configuration management              |
| Audit Logs       | `/admin/audit-logs`       | View system activity logs                    |
| Backup & Restore | `/admin/backup-restore`   | Database backup and recovery                 |

## First Steps

1. **Navigate to Dashboard**: Go to `/admin` to see the overview
2. **Check System Health**: Review system metrics and alerts
3. **Manage Users**: Visit `/admin/user-management` to add or modify users
4. **Monitor Performance**: Check `/admin/system-metrics` for real-time data
5. **Create Backup**: Go to `/admin/backup-restore` and create your first backup

## Default Credentials

**Important**: Make sure to change default credentials immediately after setup!

The authentication system uses your existing user management. Ensure you have a
user with `role: 'admin'`.

## Customization

### Modify Metrics Refresh Rate

In `SystemMetricsDashboard.tsx`:

```typescript
useEffect(() => {
  loadMetrics();
  if (autoRefresh) {
    const interval = setInterval(loadMetrics, 5000); // Change this value
    return () => clearInterval(interval);
  }
}, [autoRefresh, timeRange]);
```

### Add New Admin Sections

1. Create a new component in `/apps/frontend/src/pages/Admin/`
2. Add route to router configuration
3. Add link in `ComprehensiveAdminDashboard.tsx`
4. Create corresponding backend API endpoints

### Customize Colors

All admin pages use Tailwind CSS. Update colors in component files:

```typescript
// Example: Change primary color from blue to purple
className = 'bg-blue-600'; // Change to "bg-purple-600"
```

## Troubleshooting

### Routes not working

- Verify AdminModule is imported in app.module.ts
- Check that routes are added to your router
- Ensure backend server is running

### Unauthorized errors

- Implement AdminGuard
- Verify user has admin role
- Check authentication middleware

### Metrics not loading

- Check API endpoints are responding
- Verify CORS settings
- Check browser console for errors

## Next Steps

- Read the [Complete Admin Dashboard Guide](./ADMIN_DASHBOARD_GUIDE.md)
- Review the [API Reference](./ADMIN_DASHBOARD_GUIDE.md#api-reference)
- Check
  [Security Considerations](./ADMIN_DASHBOARD_GUIDE.md#security-considerations)

## Support

For detailed documentation, see:

- [ADMIN_DASHBOARD_GUIDE.md](./ADMIN_DASHBOARD_GUIDE.md) - Complete feature
  documentation
- Backend: `/apps/backend/src/modules/admin/`
- Frontend: `/apps/frontend/src/pages/Admin/`
