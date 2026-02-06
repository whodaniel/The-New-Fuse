# Admin Dashboard - Complete Guide

## Overview

The Admin Dashboard provides comprehensive platform management tools for
administrators. It includes user management, system monitoring, agent control,
database administration, API analytics, configuration management, audit logging,
and backup/restore capabilities.

## Table of Contents

1. [Features Overview](#features-overview)
2. [Setup Instructions](#setup-instructions)
3. [User Management](#user-management)
4. [System Metrics Dashboard](#system-metrics-dashboard)
5. [Agent Management](#agent-management)
6. [Database Admin Panel](#database-admin-panel)
7. [API Usage Analytics](#api-usage-analytics)
8. [Configuration Management](#configuration-management)
9. [Audit Log Viewer](#audit-log-viewer)
10. [Backup & Restore](#backup--restore)
11. [System Health Monitoring](#system-health-monitoring)
12. [Feature Flag Management](#feature-flag-management)
13. [API Reference](#api-reference)
14. [Security Considerations](#security-considerations)

## Features Overview

### 1. User Management

- CRUD operations for users
- Role and permission management
- Bulk actions (activate, suspend, delete)
- User activity tracking
- Advanced filtering and search

### 2. System Metrics Dashboard

- Real-time CPU, memory, disk, and network monitoring
- Performance graphs and charts
- Request volume tracking
- Response time analysis
- Error rate monitoring

### 3. Agent Management Interface

- View all AI agents
- Start/stop/restart agents
- Monitor agent performance
- Track agent requests and errors
- Resource usage monitoring

### 4. Database Admin Panel

- Execute SQL queries (SELECT only for safety)
- Browse database tables
- View table information and statistics
- Database health monitoring
- Export/import capabilities

### 5. API Usage Analytics

- Request volume tracking
- Endpoint performance analysis
- HTTP status code distribution
- Method distribution (GET, POST, etc.)
- Error rate tracking

### 6. Configuration Management

- View and edit system configurations
- Environment variable management
- Secure handling of sensitive values
- Configuration export/import
- Change tracking

### 7. Audit Log Viewer

- View all system activities
- Filter by type, user, date range
- Security event tracking
- Export audit logs
- Detailed event information

### 8. Backup & Restore Interface

- Create full and incremental backups
- Restore from backups
- Schedule automated backups
- Backup management (download, delete)
- Backup health monitoring

### 9. System Health Monitoring

- Overall system status
- Service health checks
- Alert management
- Uptime tracking
- Resource usage alerts

### 10. Feature Flag Management

- Toggle features on/off
- Environment-specific flags
- Change tracking
- Rollback capabilities

## Setup Instructions

### Frontend Setup

1. **Add Routes** - Update your router configuration:

```typescript
// In your router config file
import ComprehensiveAdminDashboard from './pages/Admin/ComprehensiveAdminDashboard';
import UserManagementFull from './pages/Admin/UserManagementFull';
import SystemMetricsDashboard from './pages/Admin/SystemMetricsDashboard';
import AgentManagementFull from './pages/Admin/AgentManagementFull';
import DatabaseAdminPanel from './pages/Admin/DatabaseAdminPanel';
import APIAnalyticsFull from './pages/Admin/APIAnalyticsFull';
import ConfigurationManagement from './pages/Admin/ConfigurationManagement';
import AuditLogViewer from './pages/Admin/AuditLogViewer';
import BackupRestore from './pages/Admin/BackupRestore';

// Add routes
{
  path: '/admin',
  element: <ComprehensiveAdminDashboard />,
},
{
  path: '/admin/user-management',
  element: <UserManagementFull />,
},
{
  path: '/admin/system-metrics',
  element: <SystemMetricsDashboard />,
},
{
  path: '/admin/agent-management',
  element: <AgentManagementFull />,
},
{
  path: '/admin/database',
  element: <DatabaseAdminPanel />,
},
{
  path: '/admin/api-analytics',
  element: <APIAnalyticsFull />,
},
{
  path: '/admin/configuration',
  element: <ConfigurationManagement />,
},
{
  path: '/admin/audit-logs',
  element: <AuditLogViewer />,
},
{
  path: '/admin/backup-restore',
  element: <BackupRestore />,
},
```

2. **Install Dependencies** (if not already installed):

```bash
npm install recharts lucide-react
```

### Backend Setup

1. **Add Admin Module to App Module**:

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

2. **Implement Authentication Guards**:

Create an admin guard to protect routes:

```typescript
// apps/backend/src/modules/admin/guards/admin.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user has admin role
    return user && user.role === 'admin';
  }
}
```

Then apply it to the controller:

```typescript
import { UseGuards } from '@nestjs/common';
import { AdminGuard } from './guards/admin.guard';

@UseGuards(AdminGuard)
@Controller('api/admin')
export class AdminController {
  // ... routes
}
```

## User Management

### Features

- View all users with pagination
- Filter by role and status
- Search by name or email
- Create, edit, and delete users
- Bulk actions for multiple users
- Export user data

### Usage

Navigate to `/admin/user-management`

**Creating a User:**

1. Click "Add User" button
2. Fill in user details (name, email, role)
3. Click "Save"

**Bulk Actions:**

1. Select users using checkboxes
2. Choose action (Activate, Suspend, Delete)
3. Confirm the action

**Filtering:**

- Use the search bar to find users by name or email
- Use dropdowns to filter by role or status

## System Metrics Dashboard

### Features

- Real-time system metrics
- CPU, memory, disk, and network usage
- Request volume and response time charts
- Historical performance data
- Auto-refresh capability

### Usage

Navigate to `/admin/system-metrics`

**Auto-refresh:**

- Enable the "Auto-refresh (5s)" checkbox for real-time updates

**Time Range:**

- Select time range from dropdown (1h, 6h, 24h, 7d)

**Metrics Displayed:**

- CPU Usage (%)
- Memory Usage (%)
- Disk Usage (%)
- Network Traffic (GB/s)
- Requests per second
- Average response time
- Active connections
- Error rate

## Agent Management

### Features

- View all AI agents
- Start, stop, and restart agents
- Monitor agent performance
- View agent logs
- Resource usage tracking

### Usage

Navigate to `/admin/agent-management`

**Starting an Agent:**

1. Find the agent in the list
2. Click the "Play" icon
3. Agent status will update to "running"

**Stopping an Agent:**

1. Find the running agent
2. Click the "Pause" icon
3. Agent status will update to "stopped"

**Viewing Performance:**

- Performance charts show request volume and response time
- Error tracking displays error counts over time

## Database Admin Panel

### Features

- Execute SQL queries (SELECT only for safety)
- Browse database tables
- View table schema and statistics
- Database health monitoring
- Query history

### Usage

Navigate to `/admin/database`

**Executing Queries:**

1. Select a table from the sidebar (optional)
2. Write your SQL query in the editor
3. Click "Execute Query"
4. Results appear below

**Important Security Note:**

- Only SELECT queries are allowed by default
- Modify the backend to allow other queries if needed (with extreme caution)

**Viewing Table Information:**

- Click on a table name in the sidebar
- View row count and size information

## API Usage Analytics

### Features

- Total request tracking
- Endpoint performance analysis
- HTTP status code distribution
- Method distribution
- Error rate monitoring
- Response time tracking

### Usage

Navigate to `/admin/api-analytics`

**Viewing Analytics:**

- Select time range from dropdown
- View key metrics in cards
- Analyze charts for trends
- Check top endpoints table

**Exporting Reports:**

- Click "Export Report" to download analytics data

## Configuration Management

### Features

- View all system configurations
- Edit configuration values
- Secure sensitive value display
- Configuration export/import
- Change tracking

### Usage

Navigate to `/admin/configuration`

**Editing Configuration:**

1. Find the configuration key
2. Click the "Edit" icon
3. Modify the value
4. Click "Save" (checkmark icon)

**Sensitive Values:**

- Sensitive values are hidden by default
- Click the "Eye" icon to reveal
- Click again to hide

**Exporting/Importing:**

- Use "Export" button to download all configs
- Use "Import" button to upload configuration file

## Audit Log Viewer

### Features

- View all system activities
- Filter by type, status, and date
- Search logs by action, user, or resource
- View detailed log information
- Export logs

### Usage

Navigate to `/admin/audit-logs`

**Filtering Logs:**

- Use the search bar to find specific logs
- Select type filter (User, System, Security, Admin)
- Choose date range

**Viewing Details:**

- Click the "Eye" icon on any log entry
- Modal shows complete log information

**Exporting Logs:**

- Click "Export Logs" to download audit data

## Backup & Restore

### Features

- Create full and incremental backups
- Restore from backups
- Schedule automated backups
- Backup management
- Backup health monitoring

### Usage

Navigate to `/admin/backup-restore`

**Creating a Backup:**

1. Click "Create Backup" button
2. Backup will start immediately
3. Progress bar shows completion status

**Restoring a Backup:**

1. Find the backup in the list
2. Click the "Play" icon
3. Confirm the restore operation
4. **Warning:** This will overwrite current data

**Managing Schedules:**

- View backup schedules in the "Backup Schedules" section
- Toggle schedules on/off using the "Enabled" checkbox
- Click settings icon to modify schedule

## System Health Monitoring

The main dashboard (`/admin`) provides system health monitoring:

- Overall system status (Healthy, Warning, Critical)
- System uptime
- Active users and agents
- Resource usage
- Recent alerts

## Feature Flag Management

Feature flags are managed through the existing `/admin/feature-flags` route:

- View all feature flags
- Toggle flags on/off
- Environment-specific management
- Change tracking

## API Reference

### Base URL

```
/api/admin
```

### Endpoints

#### User Management

```
GET    /api/admin/users              - Get all users
GET    /api/admin/users/:id          - Get user by ID
POST   /api/admin/users              - Create user
PUT    /api/admin/users/:id          - Update user
DELETE /api/admin/users/:id          - Delete user
POST   /api/admin/users/bulk-action  - Bulk user actions
```

#### System Metrics

```
GET    /api/admin/metrics/system      - Get system metrics
GET    /api/admin/metrics/performance - Get performance metrics
GET    /api/admin/metrics/api         - Get API metrics
```

#### Agent Management

```
GET    /api/admin/agents              - Get all agents
GET    /api/admin/agents/:id          - Get agent by ID
POST   /api/admin/agents/:id/start    - Start agent
POST   /api/admin/agents/:id/stop     - Stop agent
POST   /api/admin/agents/:id/restart  - Restart agent
DELETE /api/admin/agents/:id          - Delete agent
```

#### Database Admin

```
POST   /api/admin/database/query      - Execute query
GET    /api/admin/database/tables     - Get all tables
GET    /api/admin/database/table/:name - Get table info
GET    /api/admin/database/health     - Get database health
```

#### API Analytics

```
GET    /api/admin/analytics/api/overview     - Get API overview
GET    /api/admin/analytics/api/endpoints    - Get top endpoints
GET    /api/admin/analytics/api/status-codes - Get status codes
GET    /api/admin/analytics/api/methods      - Get methods
```

#### Configuration

```
GET    /api/admin/config              - Get all configurations
GET    /api/admin/config/:key         - Get configuration by key
PUT    /api/admin/config/:key         - Update configuration
POST   /api/admin/config              - Create configuration
DELETE /api/admin/config/:key         - Delete configuration
```

#### Audit Logs

```
GET    /api/admin/audit-logs          - Get audit logs
GET    /api/admin/audit-logs/:id      - Get audit log by ID
POST   /api/admin/audit-logs/export   - Export audit logs
```

#### Backup & Restore

```
GET    /api/admin/backups             - Get all backups
POST   /api/admin/backups/create      - Create backup
POST   /api/admin/backups/:id/restore - Restore backup
DELETE /api/admin/backups/:id         - Delete backup
GET    /api/admin/backups/schedules   - Get backup schedules
POST   /api/admin/backups/schedules   - Create schedule
PUT    /api/admin/backups/schedules/:id - Update schedule
DELETE /api/admin/backups/schedules/:id - Delete schedule
```

#### Feature Flags

```
GET    /api/admin/feature-flags       - Get all feature flags
PUT    /api/admin/feature-flags/:name - Update feature flag
POST   /api/admin/feature-flags       - Create feature flag
```

#### Dashboard

```
GET    /api/admin/dashboard/stats     - Get dashboard stats
GET    /api/admin/dashboard/recent-activity - Get recent activity
GET    /api/admin/dashboard/alerts    - Get system alerts
```

## Security Considerations

### Authentication & Authorization

1. **Admin Guard**: All admin routes must be protected with admin authentication
2. **Role-Based Access**: Implement role-based access control (RBAC)
3. **Session Management**: Use secure session handling

### Data Protection

1. **Sensitive Data**:
   - Never log sensitive configuration values
   - Use environment variables for secrets
   - Mask sensitive data in UI

2. **SQL Injection Prevention**:
   - Only allow SELECT queries by default
   - Use parameterized queries
   - Implement query validation

3. **Audit Logging**:
   - Log all admin actions
   - Include user, timestamp, and IP address
   - Store logs securely

### Best Practices

1. **Backup Safety**:
   - Always create a backup before restoring
   - Test backups in staging environment
   - Verify backup integrity

2. **Configuration Changes**:
   - Test configuration changes in staging first
   - Document all changes
   - Have rollback plan ready

3. **Access Control**:
   - Limit admin access to necessary personnel
   - Use multi-factor authentication
   - Regularly review admin access logs

## Troubleshooting

### Common Issues

**Issue: Admin routes return 404**

- Ensure AdminModule is imported in app.module.ts
- Check that routes are properly configured
- Verify backend is running

**Issue: Unauthorized errors**

- Verify admin guard is implemented
- Check user authentication
- Ensure user has admin role

**Issue: Metrics not updating**

- Check auto-refresh setting
- Verify API endpoints are responding
- Check browser console for errors

**Issue: Database queries failing**

- Verify query syntax
- Check database connection
- Ensure SELECT-only restriction (if applicable)

**Issue: Backup creation fails**

- Check disk space
- Verify database connection
- Check backup directory permissions

## Support

For additional support:

- Review the codebase in `/apps/frontend/src/pages/Admin/`
- Check backend implementation in `/apps/backend/src/modules/admin/`
- Refer to API documentation above
- Check system logs for errors

## Future Enhancements

Potential improvements:

- Real-time WebSocket updates for metrics
- Advanced query builder for database admin
- Scheduled report generation
- Custom dashboard widgets
- Multi-tenant admin support
- Advanced analytics and insights
- Machine learning-based anomaly detection
- Integration with external monitoring tools
