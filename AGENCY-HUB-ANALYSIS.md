# Agency Hub - Deep Gap Analysis & Implementation Plan

## Executive Summary

Based on comprehensive codebase analysis, The New Fuse has excellent foundational infrastructure but requires significant multi-tenant architecture additions to support the Agency Hub vision. This document outlines the gaps, technical requirements, and implementation roadmap.

## Vision Statement

Transform The New Fuse into a master platform that can spawn independent agency instances with:
- **Agency Isolation**: Each agency operates as an independent tenant with its own admin, users, agents, and data
- **Subdomain Routing**: `agency1.thenewfuse.com`, `agency2.thenewfuse.com` 
- **Progressive Feature Unlocking**: Tiered access to platform capabilities
- **White-label Options**: Custom branding and themes per agency
- **Master Admin Control**: Central oversight and management of all agencies

---

## Current Infrastructure Strengths

### ✅ Strong Foundation Components

1. **Admin Infrastructure** (`/apps/frontend/src/pages/Admin/`)
   - Comprehensive admin panels (Users, Workspaces, SystemHealth)
   - Role-based UI components (RoleManager, UserManagement)
   - Admin layout and routing structure

2. **Authorization System** (`/packages/core/src/security/AuthorizationService.tsx`)
   - Role-based access control (RBAC)
   - Permission management with policies
   - User role assignment/revocation
   - Cached authorization decisions

3. **Marketplace & Billing** (`/packages/core/src/marketplace/`)
   - Subscription management system
   - Multiple pricing models (FREE, ONE_TIME, SUBSCRIPTION, USAGE_BASED)
   - Payment processing integration
   - Tiered pricing structures

4. **Message Routing** (`/packages/core/src/communication/router.tsx`)
   - Pattern-based message routing
   - Channel management
   - Redis-backed routing tables

5. **Configuration Management** (`/packages/core/src/config/ConfigurationService.tsx`)
   - Environment-based configuration
   - Service configuration management

6. **Database Infrastructure**
   - Multiple Prisma schemas across packages
   - User, Agent, Session, Task models
   - Code execution tracking and billing

---

## Critical Gaps Analysis

### 🚫 Missing Components for Agency Hub

#### 1. **Multi-Tenant Database Architecture**

**Current State:**
```typescript
// Current User model - no tenant isolation
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String?
  role         UserRole  @default(USER)
  // ... no agency/tenant reference
}
```

**Required:**
- Agency-level tenant isolation
- Scoped data access patterns
- Cross-tenant data segregation
- Agency-specific agent armies

#### 2. **Subdomain-Based Tenant Routing**

**Current State:**
- Basic message routing with patterns
- Workspace-based routing
- No subdomain tenant resolution

**Required:**
- Subdomain-to-agency resolution middleware
- Tenant context injection
- Per-agency routing tables
- Domain validation and security

#### 3. **Agency Provisioning Workflows**

**Current State:**
- Manual user/workspace creation
- No automated agency setup

**Required:**
- Agency creation wizard
- Automated resource provisioning
- Template-based agency setup
- Billing integration for new agencies

#### 4. **Master vs Agency Admin Hierarchy**

**Current State:**
```typescript
enum UserRole {
  USER
  ADMIN  // Single admin level
}
```

**Required:**
- `MASTER_ADMIN` - Platform-wide control
- `AGENCY_ADMIN` - Tenant-scoped control
- `AGENCY_USER` - Tenant-scoped user
- Role inheritance and delegation

#### 5. **Agency-Scoped Agent Isolation**

**Current State:**
```typescript
model Agent {
  id                String              @id @default(uuid())
  name              String
  type              AgentType
  // ... no agency/tenant scoping
}
```

**Required:**
- Agency-owned agent armies
- Cross-agency agent restrictions
- Per-agency agent billing
- Agency-specific agent capabilities

#### 6. **Progressive Feature Unlocking**

**Current State:**
- Basic subscription tiers
- Simple feature flags

**Required:**
- Agency-tier based feature gates
- Dynamic capability unlocking
- Progressive onboarding flows
- Usage-based restrictions

---

## Technical Architecture Design

### 🏗️ Multi-Tenant Database Schema

#### Core Agency Model
```typescript
model Agency {
  id          String   @id @default(uuid())
  name        String   @unique
  subdomain   String   @unique
  slug        String   @unique
  
  // Billing & Subscription
  subscriptionTier    AgencyTier     @default(STARTER)
  subscriptionStatus  SubscriptionStatus @default(TRIAL)
  billingEmail       String
  
  // Customization
  branding    Json?    // Logo, colors, themes
  settings    Json?    // Agency-specific configurations
  
  // Limits & Features
  userLimit       Int     @default(5)
  agentLimit      Int     @default(10)
  storageLimit    Int     @default(1000) // MB
  
  // Lifecycle
  isActive        Boolean  @default(true)
  trialEndsAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  users           User[]
  agents          Agent[]
  workspaces      Workspace[]
  subscriptions   AgencySubscription[]
  
  @@map("agencies")
}

enum AgencyTier {
  TRIAL
  STARTER
  PROFESSIONAL  
  ENTERPRISE
  WHITE_LABEL
}
```

#### Enhanced User Model
```typescript
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String?
  
  // Agency Scoping
  agencyId     String
  agency       Agency    @relation(fields: [agencyId], references: [id])
  
  // Enhanced Roles
  role         EnhancedUserRole  @default(AGENCY_USER)
  permissions  Json?     // Agency-specific permissions
  
  // ... existing fields
  
  @@unique([email, agencyId]) // Allow same email across agencies
  @@map("users")
}

enum EnhancedUserRole {
  MASTER_ADMIN      // Platform-wide control
  AGENCY_ADMIN      // Agency management
  AGENCY_MANAGER    // Limited agency oversight  
  AGENCY_USER       // Standard user
  AGENCY_VIEWER     // Read-only access
}
```

#### Agency-Scoped Agent Model
```typescript
model Agent {
  id                String              @id @default(uuid())
  name              String
  type              AgentType
  
  // Agency Scoping
  agencyId          String
  agency            Agency              @relation(fields: [agencyId], references: [id])
  
  // Agency-specific capabilities
  allowedFeatures   String[]            @default([])
  resourceLimits    Json?               // CPU, memory, API calls
  
  // ... existing fields
  
  @@map("agents")
}
```

### 🌐 Subdomain Routing Architecture

#### Tenant Resolution Middleware
```typescript
@Injectable()
export class TenantResolutionMiddleware implements NestMiddleware {
  constructor(
    private readonly agencyService: AgencyService,
    private readonly cacheService: CacheService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const subdomain = this.extractSubdomain(req.get('host'));
    
    if (subdomain && subdomain !== 'www') {
      // Resolve agency from subdomain
      const agency = await this.resolveAgencyBySubdomain(subdomain);
      
      if (!agency) {
        return res.status(404).json({ error: 'Agency not found' });
      }
      
      if (!agency.isActive) {
        return res.status(403).json({ error: 'Agency suspended' });
      }
      
      // Inject tenant context
      req['tenantContext'] = {
        agencyId: agency.id,
        agency: agency,
        tier: agency.subscriptionTier,
        features: this.getAgencyFeatures(agency.subscriptionTier)
      };
    }
    
    next();
  }
  
  private async resolveAgencyBySubdomain(subdomain: string): Promise<Agency | null> {
    // Check cache first
    const cached = await this.cacheService.get(`agency:subdomain:${subdomain}`);
    if (cached) return cached;
    
    // Database lookup
    const agency = await this.agencyService.findBySubdomain(subdomain);
    
    // Cache for 5 minutes
    if (agency) {
      await this.cacheService.set(`agency:subdomain:${subdomain}`, agency, 300);
    }
    
    return agency;
  }
}
```

### 🎛️ Agency Management Service

```typescript
@Injectable()
export class AgencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
    private readonly templateService: AgencyTemplateService
  ) {}

  async createAgency(data: CreateAgencyDto): Promise<Agency> {
    // Validate subdomain availability
    await this.validateSubdomain(data.subdomain);
    
    // Create agency with transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Create agency
      const agency = await tx.agency.create({
        data: {
          name: data.name,
          subdomain: data.subdomain,
          slug: data.slug,
          subscriptionTier: data.tier || AgencyTier.TRIAL,
          billingEmail: data.billingEmail,
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          settings: this.getDefaultSettings(data.tier),
          branding: this.getDefaultBranding()
        }
      });

      // 2. Create master admin user
      const adminUser = await tx.user.create({
        data: {
          email: data.adminEmail,
          name: data.adminName,
          agencyId: agency.id,
          role: EnhancedUserRole.AGENCY_ADMIN,
          passwordHash: await this.hashPassword(data.adminPassword)
        }
      });

      // 3. Provision default resources
      await this.provisionDefaultResources(tx, agency.id, data.template);

      // 4. Set up billing if not trial
      if (data.tier !== AgencyTier.TRIAL) {
        await this.billingService.createAgencySubscription(agency.id, data.tier);
      }

      return agency;
    });
  }

  private async provisionDefaultResources(
    tx: PrismaTransaction, 
    agencyId: string, 
    template?: string
  ) {
    const templateData = await this.templateService.getTemplate(template || 'basic');
    
    // Create default workspace
    await tx.workspace.create({
      data: {
        name: 'Default Workspace',
        agencyId,
        settings: templateData.workspaceSettings
      }
    });

    // Create starter agents
    for (const agentTemplate of templateData.agents) {
      await tx.agent.create({
        data: {
          ...agentTemplate,
          agencyId
        }
      });
    }
  }
}
```

### 🎨 White-Label Theme System

```typescript
@Injectable()
export class AgencyThemeService {
  async getAgencyTheme(agencyId: string): Promise<AgencyTheme> {
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      select: { branding: true, subscriptionTier: true }
    });

    const defaultTheme = this.getDefaultTheme();
    const customBranding = agency?.branding as AgencyBranding || {};

    // White-label features only for higher tiers
    const allowCustomBranding = [
      AgencyTier.ENTERPRISE, 
      AgencyTier.WHITE_LABEL
    ].includes(agency?.subscriptionTier);

    return {
      ...defaultTheme,
      ...(allowCustomBranding ? customBranding : {}),
      features: {
        customLogo: allowCustomBranding,
        customColors: allowCustomBranding,
        customFonts: agency?.subscriptionTier === AgencyTier.WHITE_LABEL,
        removeBranding: agency?.subscriptionTier === AgencyTier.WHITE_LABEL
      }
    };
  }
}

interface AgencyTheme {
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  favicon?: string;
  fonts?: {
    primary: string;
    secondary: string;
  };
  features: {
    customLogo: boolean;
    customColors: boolean;
    customFonts: boolean;
    removeBranding: boolean;
  };
}
```

---

## Implementation Roadmap

### 📋 Phase 1: Foundation (Weeks 1-3)

#### Database Schema Migration
1. **Create Agency model and relationships**
   - Add `Agency` table with subdomain, billing, branding
   - Add `agencyId` foreign keys to User, Agent, Workspace
   - Create migration scripts with data preservation

2. **Enhanced Role System**
   - Extend `UserRole` enum with agency hierarchy
   - Update authorization service for agency scoping
   - Create role inheritance logic

3. **Basic Tenant Context**
   - Create tenant context injection
   - Update existing services for agency scoping
   - Add tenant validation middleware

#### Deliverables:
- [ ] Database schema migrations
- [ ] Agency model implementation
- [ ] Basic tenant context system
- [ ] Updated authorization service

### 📋 Phase 2: Agency Management (Weeks 4-6)

#### Agency Creation & Management
1. **Agency Service Implementation**
   - Agency CRUD operations
   - Subdomain validation and reservation
   - Agency provisioning workflows

2. **Master Admin Interface**
   - Agency creation wizard
   - Agency management dashboard
   - Billing integration for agencies

3. **Agency Admin Interface**
   - Agency-scoped admin panel
   - User management within agency
   - Agent management within agency

#### Deliverables:
- [ ] Agency service implementation
- [ ] Master admin interface
- [ ] Agency admin interface
- [ ] Agency provisioning workflows

### 📋 Phase 3: Subdomain Routing (Weeks 7-8)

#### Multi-Tenant Routing
1. **Subdomain Resolution**
   - Tenant resolution middleware
   - Subdomain-to-agency mapping
   - Caching for performance

2. **Frontend Routing Updates**
   - Agency-aware routing in React
   - Dynamic theme loading per agency
   - Tenant context in frontend state

#### Deliverables:
- [ ] Subdomain routing middleware
- [ ] Frontend tenant awareness
- [ ] Performance optimization with caching

### 📋 Phase 4: Progressive Features (Weeks 9-10)

#### Feature Gate System
1. **Subscription Tier Management**
   - Feature flag system per agency tier
   - Dynamic capability unlocking
   - Usage limit enforcement

2. **Progressive Onboarding**
   - Tier-based onboarding flows
   - Feature discovery experiences
   - Upgrade prompts and flows

#### Deliverables:
- [ ] Feature gate system
- [ ] Progressive onboarding
- [ ] Subscription management

### 📋 Phase 5: White-Label & Polish (Weeks 11-12)

#### White-Label Customization
1. **Theme System**
   - Per-agency theme management
   - Custom branding upload and storage
   - Dynamic theme injection

2. **Final Integration**
   - End-to-end testing
   - Performance optimization
   - Documentation and training

#### Deliverables:
- [ ] White-label theme system
- [ ] Complete Agency Hub feature
- [ ] Documentation and testing

---

## Technical Specifications

### 🔧 API Endpoints

#### Master Admin APIs
```typescript
// Agency Management
POST   /api/master/agencies                 // Create new agency
GET    /api/master/agencies                 // List all agencies
GET    /api/master/agencies/:id             // Get agency details
PUT    /api/master/agencies/:id             // Update agency
DELETE /api/master/agencies/:id             // Delete agency

// Agency Monitoring
GET    /api/master/agencies/:id/metrics     // Agency usage metrics
GET    /api/master/agencies/:id/health      // Agency health status
POST   /api/master/agencies/:id/suspend     // Suspend agency
POST   /api/master/agencies/:id/activate    // Activate agency
```

#### Agency Admin APIs
```typescript
// Agency-Scoped Management (requires agency context)
GET    /api/agency/users                    // List agency users
POST   /api/agency/users                    // Create agency user
PUT    /api/agency/users/:id                // Update agency user
DELETE /api/agency/users/:id                // Delete agency user

GET    /api/agency/agents                   // List agency agents
POST   /api/agency/agents                   // Create agency agent
PUT    /api/agency/agents/:id               // Update agency agent

GET    /api/agency/settings                 // Get agency settings
PUT    /api/agency/settings                 // Update agency settings
PUT    /api/agency/branding                 // Update agency branding
```

### 🗄️ Database Indexes

```sql
-- Performance indexes for multi-tenant queries
CREATE INDEX idx_users_agency_id ON users(agency_id);
CREATE INDEX idx_users_agency_id_role ON users(agency_id, role);
CREATE INDEX idx_agents_agency_id ON agents(agency_id);
CREATE INDEX idx_workspaces_agency_id ON workspaces(agency_id);

-- Subdomain resolution
CREATE UNIQUE INDEX idx_agencies_subdomain ON agencies(subdomain) WHERE is_active = true;
CREATE INDEX idx_agencies_slug ON agencies(slug);

-- Billing and subscriptions
CREATE INDEX idx_agencies_subscription_status ON agencies(subscription_status);
CREATE INDEX idx_agencies_trial_ends_at ON agencies(trial_ends_at) WHERE subscription_tier = 'TRIAL';
```

### 🔒 Security Considerations

1. **Tenant Isolation**
   - All database queries must include `agencyId` filtering
   - Cross-tenant data access prevention
   - Agency-scoped API rate limiting

2. **Subdomain Security**
   - Subdomain validation against reserved words
   - SSL certificate management per subdomain
   - CSRF protection with agency context

3. **Master Admin Protection**
   - Two-factor authentication requirement
   - IP whitelisting options
   - Audit logging for all master admin actions

---

## Risk Assessment & Mitigation

### ⚠️ High-Risk Areas

1. **Data Migration Complexity**
   - **Risk**: Existing data corruption during agency assignment
   - **Mitigation**: Phased migration with rollback plans, extensive testing

2. **Performance Impact**
   - **Risk**: Additional database joins and filtering overhead
   - **Mitigation**: Strategic indexing, caching, query optimization

3. **Subdomain Management**
   - **Risk**: DNS complexity and SSL certificate management
   - **Mitigation**: Automated DNS/SSL management, wildcard certificates

### 🛡️ Monitoring & Observability

1. **Agency Health Metrics**
   - Per-agency performance monitoring
   - Resource usage tracking
   - User activity analytics

2. **Cross-Tenant Security Monitoring**
   - Data access audit logs
   - Anomaly detection for cross-tenant access attempts
   - Agency admin action logging

---

## Success Metrics

### 📊 Key Performance Indicators

1. **Technical Metrics**
   - Agency provisioning time < 2 minutes
   - Subdomain resolution time < 100ms
   - Database query performance within 10% of current
   - Zero cross-tenant data leaks

2. **Business Metrics**
   - Agency creation conversion rate
   - Time to first agent deployment per agency
   - Agency retention rate
   - Upgrade conversion from trial to paid tiers

---

## Conclusion

The New Fuse has a solid foundation for implementing the Agency Hub feature. The existing marketplace, authorization, and admin infrastructure provide excellent building blocks. The main technical challenges lie in:

1. **Database architecture transformation** for true multi-tenancy
2. **Subdomain routing implementation** for agency isolation  
3. **Progressive feature system** for tier-based capabilities

With the proposed 12-week implementation plan, The New Fuse can successfully transform into a master platform capable of spawning and managing independent agency instances while maintaining the performance and reliability of the current system.

The Agency Hub will position The New Fuse as a unique platform in the AI agent space, offering both the flexibility of independent agency operations and the power of a centralized management system.
