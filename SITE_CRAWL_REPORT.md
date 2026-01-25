# Site Crawl Report: Missing & Incomplete Functionality

**Date:** 2026-01-25 **Status:** Comprehensive Audit Completed

## 1. Executive Summary

The application frontend is visually polished and largely implemented, but
significant portions of the administrative and analytical dashboards are
currently powered by **mock data** or **missing backend endpoints**. While the
core `AgentService` logic is robust, the integration between the frontend and
real system metrics/logs is incomplete.

## 2. Missing Backend Endpoints

The following frontend components attempt to call API endpoints that **do not
exist** in the backend `AdminModule`. These will currently result in 404 errors
or fallback states.

| Frontend Component            | Target Endpoint                      | Status      | Action Required                   |
| :---------------------------- | :----------------------------------- | :---------- | :-------------------------------- |
| `AuditLogViewer.tsx`          | `/api/admin/audit-logs`              | **MISSING** | Create `AdminAuditLogsController` |
| `ConfigurationManagement.tsx` | `/api/admin/config`                  | **MISSING** | Create `AdminConfigController`    |
| `AdminSettings.tsx`           | `/api/admin/settings`                | **MISSING** | Create `AdminSettingsController`  |
| `APIAnalyticsFull.tsx`        | `/api/admin/api-analytics` (implied) | **MISSING** | Create `AdminMetricsController`   |

## 3. Frontend Components Using Mocks

These components render UI correctly but use hardcoded or random data instead of
fetching from the backend.

| Component                    | Feature                  | Details                                                                  |
| :--------------------------- | :----------------------- | :----------------------------------------------------------------------- |
| `Analytics.tsx`              | **All Charts & Data**    | Uses `mockData` object. API calls are made but ignored. Charts disabled. |
| `AgencyDashboard.tsx`        | **Tenants & Revenue**    | Uses `MOCK_TENANTS` and hardcoded revenue strings.                       |
| `AgentDetail.tsx`            | **Actions (Start/Stop)** | Uses `setTimeout` simulation instead of calling `AgentService`.          |
| `AgentDetail.tsx`            | **Identity Tab**         | Static/Placeholder content.                                              |
| `SystemMetricsDashboard.tsx` | **Service Health**       | Backend service returns hardcoded static list.                           |

## 4. Incomplete Backend Services

While some services are real, `SystemMetricsService` relies heavily on mock data
for critical observability features.

| Service                 | Method               | Current Implementation                                                  |
| :---------------------- | :------------------- | :---------------------------------------------------------------------- |
| `SystemMetricsService`  | `getDatabaseMetrics` | **MOCK**: Returns random query counts and connection numbers.           |
| `SystemMetricsService`  | `getApiMetrics`      | **MOCK**: Returns random request rates and error counts.                |
| `SystemMetricsService`  | `getServicesHealth`  | **MOCK**: Returns static list (Database, Redis, etc. always "healthy"). |
| `AdminBackupController` | All Methods          | **STUB**: Endpoints exist but perform no actual backup operations.      |

## 5. Recommended Action Plan

### Phase 1: Critical Connectivity (High Priority)

1.  **Implement Missing Controllers**: Create `AdminAuditLogsController`,
    `AdminConfigController`, and `AdminSettingsController`.
2.  **Connect Agent Actions**: Update `AgentDetail.tsx` to use
    `agentService.startAgent/stopAgent/deleteAgent` instead of mocks.

### Phase 2: Real Data Integration (Medium Priority)

3.  **Implement Real System Metrics**:
    - Connect `getDatabaseMetrics` to Prisma/Drizzle connection pool stats.
    - Connect `getServicesHealth` to actual Redis/DB ping checks.
4.  **Enable Analytics**: Wire up `Analytics.tsx` to real aggregated data from
    the database.

### Phase 3: Advanced Features (Low Priority)

5.  **Backup System**: Implement valid `pg_dump` wrapper for
    `AdminBackupController`.
6.  **Agency Tenants**: Create proper `Tenant` entity and relationship
    management for `AgencyDashboard`.

## 6. Detailed File Audit

- **`apps/frontend/src/pages/Admin/APIAnalyticsFull.tsx`**: Completely mocked.
- **`apps/frontend/src/pages/Admin/AuditLogViewer.tsx`**: Fetch logic exists,
  backend missing.
- **`apps/frontend/src/pages/Admin/ConfigurationManagement.tsx`**: Fetch logic
  exists, backend missing.
- **`apps/frontend/src/pages/Admin/AdminSettings.tsx`**: Fetch logic exists,
  backend missing.
- **`apps/frontend/src/pages/dashboard/Analytics.tsx`**: Fetch logic exists but
  ignored; mocks used.
- **`apps/frontend/src/pages/Agency/AgencyDashboard.tsx`**: Mixed real (agents)
  and mock (revenue/tenants).
- **`apps/frontend/src/pages/Agents/Detail.tsx`**: Mixed real (data) and mock
  (actions).
