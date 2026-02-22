# Site Audit - Action Plan

**Quick Reference Guide for Fixing Platform Issues**

---

## 🔴 CRITICAL - Fix Immediately

### 1. Remove ALL Mock Data from Admin Pages

**Affected Files (10 files):**

```
apps/frontend/src/pages/Admin/
├── ComprehensiveAdminDashboard.tsx   ← Remove setTimeout(1000)
├── UserManagementFull.tsx            ← Remove mockUsers array
├── SystemMetricsDashboard.tsx        ← Remove Math.random() metrics
├── AgentManagementFull.tsx           ← Remove mock agents
├── DatabaseAdminPanel.tsx            ← Remove hardcoded query results
├── APIAnalyticsFull.tsx              ← Remove fake analytics
├── AuditLogViewer.tsx                ← Remove mock logs
├── BackupRestore.tsx                 ← Remove mockBackups
├── ConfigurationManagement.tsx       ← Remove hardcoded config
└── WorkspaceManagement.tsx           ← Remove mock workspaces
```

**Search Pattern:**

```bash
# Find all mock data
grep -r "setTimeout.*1000" apps/frontend/src/pages/Admin/
grep -r "Math.random()" apps/frontend/src/pages/Admin/
grep -r "const mock" apps/frontend/src/pages/Admin/
grep -r "MOCK_" apps/frontend/src/pages/Admin/
```

---

### 2. Implement Backend API Endpoints

#### Priority 1: User Management

```typescript
// apps/api/src/controllers/admin-users.controller.ts
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminUsersController {
  @Get()
  @Roles('SUPER_ADMIN')
  async getAllUsers(@Query() query: UserQueryDto) {
    // Implement: Get all users with pagination, search, filter
  }

  @Put(':id/role')
  @Roles('SUPER_ADMIN')
  async updateUserRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    // Implement: Change user role
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  async deleteUser(@Param('id') id: string) {
    // Implement: Soft delete user
  }
}
```

#### Priority 2: System Metrics

```typescript
// apps/api/src/controllers/admin-metrics.controller.ts
@Controller('admin/metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminMetricsController {
  @Get('system')
  @Roles('SUPER_ADMIN')
  async getSystemMetrics() {
    const metrics = {
      cpuUsage: (os.loadavg()[0] * 100) / os.cpus().length,
      memoryUsage: (1 - os.freemem() / os.totalmem()) * 100,
      diskUsage: await this.getDiskUsage(),
      uptime: os.uptime(),
      // ... more real metrics
    };
    return metrics;
  }

  @Get('api')
  @Roles('SUPER_ADMIN')
  async getApiMetrics() {
    // Implement: Get API request stats from logs/Redis
  }
}
```

#### Priority 3: Audit Logging

```typescript
// apps/api/src/middleware/audit-log.middleware.ts
@Injectable()
export class AuditLogMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    // Log all admin actions
    if (
      req.path.startsWith('/admin') &&
      ['POST', 'PUT', 'DELETE'].includes(req.method)
    ) {
      await this.auditLogService.log({
        userId: req.user?.id,
        action: `${req.method} ${req.path}`,
        details: req.body,
        ip: req.ip,
        timestamp: new Date(),
      });
    }
    next();
  }
}

// apps/api/src/controllers/admin-audit.controller.ts
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminAuditController {
  @Get()
  @Roles('SUPER_ADMIN')
  async getAuditLogs(@Query() query: AuditLogQueryDto) {
    // Implement: Get audit logs with filtering
  }
}
```

#### Priority 4: Backup System

```typescript
// apps/api/src/services/backup.service.ts
@Injectable()
export class BackupService {
  async createBackup(): Promise<Backup> {
    // 1. Execute pg_dump
    const dumpFile = await this.pgDump();

    // 2. Upload to S3 or local storage
    const location = await this.uploadBackup(dumpFile);

    // 3. Record in database
    return await this.backupRepository.create({
      timestamp: new Date(),
      size: dumpFile.size,
      location,
      type: 'full',
      status: 'completed',
    });
  }

  async restoreBackup(backupId: string): Promise<void> {
    // Implement: Download and restore from backup
  }
}
```

---

## 🟠 HIGH - Fix Next

### 3. Security Hardening

#### Remove Hardcoded Secrets

**Files to Fix:**

- `apps/frontend/src/pages/Admin/ConfigurationManagement.tsx`

**Current Issue:**

```typescript
// SECURITY RISK: Hardcoded secrets in mock data
const mockConfigs = [
  { key: 'DATABASE_URL', value: 'postgresql://user:pass@localhost:5433/db' },
  { key: 'REDIS_URL', value: 'redis://localhost:6380' },
  { key: 'JWT_SECRET', value: '[REDACTED_SECRET]' }, // EXPOSED!
];
```

**Fix:**

```typescript
// Fetch from backend with proper masking
const configs = await fetch('/api/admin/config');
// Backend returns: { key: 'JWT_SECRET', value: '••••••••••' }
```

#### Add Role Guards

```typescript
// Ensure ALL admin endpoints have:
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
```

---

### 4. Database Migration for Audit Logs

```sql
-- packages/database/drizzle/0003_add_audit_logs.sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
```

---

## 🟡 MEDIUM - Fix After Critical Items

### 5. Complete Agency Features

**Files to Update:**

- `apps/frontend/src/pages/Agency/AgencyDashboard.tsx` - Remove MOCK_TENANTS
- `packages/core/src/services/agency.service.ts` - Complete implementation

### 6. Workflow Enhancements

- Complete workflow builder save/execute logic
- Implement workflow templates
- Enhance execution console

### 7. Authentication Improvements

- Complete 2FA implementation
- Full SSO integration
- Magic link authentication

---

## Quick Commands

### Run Audit Script

```bash
# Find all mock data usage
pnpm tsx scripts/find-mock-data.ts
```

### Database Setup

```bash
# Run new migrations
cd packages/database
pnpm drizzle:migrate

# Or push directly
pnpm drizzle:push
```

### Start Services

```bash
# Start infrastructure
pnpm run docker:start

# Start all services
pnpm run dev
```

### Testing

```bash
# Test admin endpoints
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/admin/metrics

# Test user management
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/admin/users
```

---

## Verification Checklist

After implementing fixes:

### Backend

- [ ] All admin API endpoints return real data
- [ ] No mock data in backend responses
- [ ] Audit logging middleware active
- [ ] Backup system tested
- [ ] Role guards on all admin routes

### Frontend

- [ ] All admin pages fetch from real APIs
- [ ] No setTimeout fake delays
- [ ] No Math.random() for metrics
- [ ] No hardcoded mock arrays
- [ ] Error handling for API failures

### Security

- [ ] No hardcoded secrets
- [ ] All sensitive data masked
- [ ] SQL injection prevention tested
- [ ] Role-based access working
- [ ] Audit trail verified

### Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Load testing completed
- [ ] Security scan clear

---

## Resources

- [Full Audit Report](./COMPREHENSIVE_SITE_AUDIT_2026-01-25.md)
- [Admin Infrastructure Assessment](./ADMIN_INFRASTRUCTURE_ASSESSMENT.md)
- [Admin Infrastructure Fixes](./ADMIN_INFRASTRUCTURE_FIXES_SUMMARY.md)
- [Set Master Admin Guide](./SET_MASTER_ADMIN_GUIDE.md)

---

## Get Help

If you encounter issues:

1. Check error logs: `pnpm run docker:logs`
2. Review API responses in browser DevTools
3. Check database connection: `psql $DATABASE_URL`
4. Verify services running: `docker ps`
