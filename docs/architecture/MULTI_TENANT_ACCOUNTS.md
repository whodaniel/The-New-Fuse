# TNF Multi-Tenant Account System

## Overview

The New Fuse (TNF) framework operates as a multi-tenant system with distinct
account tiers, each with specific privileges and resource quotas. This document
defines the account hierarchy and associated quotas.

## Account Hierarchy

```
                    ┌─────────────────────┐
                    │    MASTER_DEV       │
                    │  (Daniel Goldberg)  │
                    │  Unlimited Access   │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │    SUPER_ADMIN      │
                    │  System-wide admin  │
                    │  100 Jules/day      │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │      ADMIN          │
                    │  Project/Team admin │
                    │  10 Jules/day       │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │       USER          │
                    │  Standard user      │
                    │  0 Jules/day        │
                    └─────────────────────┘
```

## Account Tiers

### 1. MASTER_DEV

**Owner:** Daniel Goldberg (Admin and Master Developer)

| Resource          | Quota |
| ----------------- | ----- |
| API Calls/Day     | ∞     |
| Jules Tasks/Day   | ∞     |
| Concurrent Agents | ∞     |
| Storage           | ∞     |

**Special Privileges:**

- Full system access
- Can create/modify Super Admin accounts
- Access to all tenant data
- Override any quota limits
- Direct database access
- Deployment control

### 2. SUPER_ADMIN

**Purpose:** System-wide administrators

| Resource          | Quota   |
| ----------------- | ------- |
| API Calls/Day     | 100,000 |
| Jules Tasks/Day   | 100     |
| Concurrent Agents | 50      |
| Storage           | 10 GB   |

**Privileges:**

- Manage Admin accounts
- View cross-tenant metrics
- System configuration
- Bulk operations
- Audit log access

### 3. ADMIN

**Purpose:** Project or team administrators

| Resource          | Quota  |
| ----------------- | ------ |
| API Calls/Day     | 10,000 |
| Jules Tasks/Day   | 10     |
| Concurrent Agents | 10     |
| Storage           | 1 GB   |

**Privileges:**

- Manage team users
- Project configuration
- View team metrics
- Limited API access

### 4. USER

**Purpose:** Standard end users

| Resource          | Quota  |
| ----------------- | ------ |
| API Calls/Day     | 1,000  |
| Jules Tasks/Day   | 0      |
| Concurrent Agents | 2      |
| Storage           | 100 MB |

**Privileges:**

- Basic API access
- Personal agent deployment
- Read-only system metrics

## Implementation

### TypeScript Definitions

```typescript
// packages/security/src/admin/SuperAdminTypes.ts

export enum AccountTier {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  MASTER_DEV = 'master_dev',
}

export interface AccountQuota {
  apiCallsPerDay: number;
  julesTasksPerDay: number;
  maxConcurrentAgents: number;
  maxStorageBytes: number;
}

export interface AccountProfile {
  id: string;
  email: string;
  tier: AccountTier;
  quotas: AccountQuota;
  customQuotas?: Partial<AccountQuota>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Account ID that created this account
  tenantId?: string; // For multi-tenant isolation
}
```

### Quota Enforcement

Quotas are enforced at multiple levels:

1. **API Gateway** - Rate limiting per tier
2. **Jules Integration** - Task submission limits
3. **Agent Registry** - Concurrent agent limits
4. **Storage Service** - Capacity limits

### Reserved Accounts

| Account ID   | Email           | Tier       | Purpose                   |
| ------------ | --------------- | ---------- | ------------------------- |
| `master-001` | dan@thefuse.app | MASTER_DEV | Primary developer account |

## Security Considerations

1. **Tier Escalation Prevention**
   - Only MASTER_DEV can create SUPER_ADMIN accounts
   - Only SUPER_ADMIN+ can create ADMIN accounts
   - Tier cannot be self-modified

2. **Quota Override**
   - Custom quotas can only increase limits, not change tier
   - MASTER_DEV can override any quota
   - All overrides are logged

3. **Audit Trail**
   - All tier changes logged
   - Quota usage tracked per account
   - Access attempts recorded

## Integration Points

### API Middleware

```typescript
// Verify account tier and quota before processing
app.use(async (req, res, next) => {
  const account = await getAccountFromToken(req);
  const quota = await quotaEnforcer.checkQuota(
    account.id,
    account.tier,
    'apiCallsPerDay'
  );
  if (!quota.allowed) {
    return res.status(429).json({ error: 'Quota exceeded' });
  }
  await quotaEnforcer.incrementUsage(account.id, 'apiCall');
  next();
});
```

### Jules Task Submission

```typescript
// Check Jules quota before submission
async function submitJulesTask(
  accountId: string,
  task: JulesTask
): Promise<void> {
  const account = await getAccount(accountId);
  const allowed = await quotaEnforcer.checkQuota(
    accountId,
    account.tier,
    'julesTasksPerDay'
  );

  if (!allowed) {
    throw new QuotaExceededError('Daily Jules task quota exceeded');
  }

  await julesClient.submit(task);
  await quotaEnforcer.incrementUsage(accountId, 'julesTask');
}
```

## Future Enhancements

1. **Usage Analytics Dashboard**
   - Real-time quota visualization
   - Usage trends and predictions
   - Cost allocation per tenant

2. **Dynamic Quotas**
   - Time-based quota adjustments
   - Usage-based auto-scaling
   - Pay-per-use overages

3. **Federated Identity**
   - SSO integration
   - External identity providers
   - Role mapping from external systems

---

_Document Version: 1.0.0_  
_Last Updated: 2026-01-17_  
_Owner: MASTER_DEV (Daniel Goldberg)_
