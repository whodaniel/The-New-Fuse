-- Agency Hub Database Migration Plan
-- This file contains the database schema changes needed for multi-tenant agency architecture

-- =====================================================
-- PHASE 1: Core Agency Infrastructure
-- =====================================================

-- 1. Create Agency table (core tenant entity)
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  
  -- Subscription & Billing
  subscription_tier VARCHAR(50) NOT NULL DEFAULT 'TRIAL',
  subscription_status VARCHAR(50) NOT NULL DEFAULT 'TRIAL',
  billing_email VARCHAR(255) NOT NULL,
  
  -- Customization & Settings
  branding JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  
  -- Limits & Quotas
  user_limit INTEGER DEFAULT 5,
  agent_limit INTEGER DEFAULT 10,
  storage_limit INTEGER DEFAULT 1000, -- MB
  
  -- Lifecycle Management
  is_active BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_subdomain UNIQUE (subdomain),
  CONSTRAINT unique_slug UNIQUE (slug),
  CONSTRAINT valid_subscription_tier CHECK (subscription_tier IN ('TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'WHITE_LABEL')),
  CONSTRAINT valid_subscription_status CHECK (subscription_status IN ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'OVERDUE'))
);

-- 2. Create Agency Subscriptions table
CREATE TABLE agency_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Subscription Details
  tier VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  billing_cycle VARCHAR(20) DEFAULT 'MONTHLY', -- MONTHLY, YEARLY
  
  -- Pricing
  price_per_month DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Lifecycle
  started_at TIMESTAMP DEFAULT NOW(),
  ends_at TIMESTAMP,
  renewed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Payment Integration
  stripe_subscription_id VARCHAR(255),
  payment_method_id VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- PHASE 2: Update Existing Tables for Multi-Tenancy
-- =====================================================

-- 3. Add agency_id to existing tables (with migration strategy)

-- Users table - add agency scoping
ALTER TABLE users ADD COLUMN agency_id UUID;
ALTER TABLE users ADD COLUMN enhanced_role VARCHAR(50) DEFAULT 'AGENCY_USER';

-- Add constraint after data migration
-- ALTER TABLE users ADD CONSTRAINT fk_users_agency FOREIGN KEY (agency_id) REFERENCES agencies(id);

-- Agents table - add agency scoping  
ALTER TABLE agents ADD COLUMN agency_id UUID;
ALTER TABLE agents ADD COLUMN allowed_features TEXT[] DEFAULT '{}';
ALTER TABLE agents ADD COLUMN resource_limits JSONB DEFAULT '{}';

-- Chats table - add agency scoping
ALTER TABLE chats ADD COLUMN agency_id UUID;

-- Sessions table - add agency scoping
ALTER TABLE sessions ADD COLUMN agency_id UUID;

-- Tasks table - add agency scoping (if using the core schema)
-- ALTER TABLE tasks ADD COLUMN agency_id UUID;

-- =====================================================
-- PHASE 3: Performance Indexes
-- =====================================================

-- Agency lookup indexes
CREATE INDEX idx_agencies_subdomain ON agencies(subdomain) WHERE is_active = true;
CREATE INDEX idx_agencies_slug ON agencies(slug);
CREATE INDEX idx_agencies_subscription_status ON agencies(subscription_status);
CREATE INDEX idx_agencies_trial_expires ON agencies(trial_ends_at) WHERE subscription_tier = 'TRIAL';

-- Multi-tenant query optimization indexes
CREATE INDEX idx_users_agency_id ON users(agency_id);
CREATE INDEX idx_users_agency_role ON users(agency_id, enhanced_role);
CREATE INDEX idx_agents_agency_id ON agents(agency_id);
CREATE INDEX idx_chats_agency_id ON chats(agency_id);
CREATE INDEX idx_sessions_agency_id ON sessions(agency_id);

-- Agency subscription indexes
CREATE INDEX idx_agency_subscriptions_agency_id ON agency_subscriptions(agency_id);
CREATE INDEX idx_agency_subscriptions_status ON agency_subscriptions(status);
CREATE INDEX idx_agency_subscriptions_stripe ON agency_subscriptions(stripe_subscription_id);

-- =====================================================
-- PHASE 4: Audit and Security Tables
-- =====================================================

-- 4. Agency audit log for master admin actions
CREATE TABLE agency_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id),
  
  -- Action Details
  action VARCHAR(100) NOT NULL, -- CREATE_AGENCY, SUSPEND_AGENCY, etc.
  actor_id UUID, -- User who performed the action
  actor_role VARCHAR(50),
  
  -- Context
  resource_type VARCHAR(50), -- USER, AGENT, AGENCY, etc.
  resource_id UUID,
  
  -- Details
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  
  -- Request Info
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Cross-tenant access monitoring
CREATE TABLE cross_tenant_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Access Details
  requesting_agency_id UUID,
  target_agency_id UUID,
  user_id UUID,
  
  -- Request Details
  endpoint VARCHAR(255),
  method VARCHAR(10),
  resource_type VARCHAR(50),
  resource_id UUID,
  
  -- Result
  access_granted BOOLEAN DEFAULT false,
  denial_reason VARCHAR(255),
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for audit tables
CREATE INDEX idx_agency_audit_logs_agency_id ON agency_audit_logs(agency_id);
CREATE INDEX idx_agency_audit_logs_created_at ON agency_audit_logs(created_at);
CREATE INDEX idx_cross_tenant_logs_requesting_agency ON cross_tenant_access_logs(requesting_agency_id);
CREATE INDEX idx_cross_tenant_logs_target_agency ON cross_tenant_access_logs(target_agency_id);

-- =====================================================
-- PHASE 5: Data Migration Helpers
-- =====================================================

-- Function to create default agency for existing data
CREATE OR REPLACE FUNCTION migrate_to_agency_structure() 
RETURNS void AS $$
DECLARE
  default_agency_id UUID;
BEGIN
  -- Create a default agency for existing data
  INSERT INTO agencies (
    name,
    subdomain, 
    slug,
    subscription_tier,
    subscription_status,
    billing_email,
    user_limit,
    agent_limit,
    is_active
  ) VALUES (
    'Default Agency',
    'default',
    'default-agency',
    'PROFESSIONAL',
    'ACTIVE', 
    'admin@thenewfuse.com',
    1000, -- High limits for migration
    1000,
    true
  ) RETURNING id INTO default_agency_id;
  
  -- Assign all existing users to default agency
  UPDATE users SET agency_id = default_agency_id WHERE agency_id IS NULL;
  
  -- Assign all existing agents to default agency  
  UPDATE agents SET agency_id = default_agency_id WHERE agency_id IS NULL;
  
  -- Assign all existing chats to default agency
  UPDATE chats SET agency_id = default_agency_id WHERE agency_id IS NULL;
  
  -- Assign all existing sessions to default agency
  UPDATE sessions SET agency_id = default_agency_id WHERE agency_id IS NULL;
  
  -- Update admin users to have master admin role
  UPDATE users 
  SET enhanced_role = 'MASTER_ADMIN' 
  WHERE role = 'ADMIN' AND agency_id = default_agency_id;
  
  -- Update regular users
  UPDATE users 
  SET enhanced_role = 'AGENCY_USER' 
  WHERE role = 'USER' AND agency_id = default_agency_id;
  
  RAISE NOTICE 'Migration completed. Default agency ID: %', default_agency_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PHASE 6: Rollback Strategy
-- =====================================================

-- Function to rollback agency structure (for emergencies)
CREATE OR REPLACE FUNCTION rollback_agency_structure()
RETURNS void AS $$
BEGIN
  -- Remove foreign key constraints first
  ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_agency;
  ALTER TABLE agents DROP CONSTRAINT IF EXISTS fk_agents_agency;
  ALTER TABLE chats DROP CONSTRAINT IF EXISTS fk_chats_agency;
  ALTER TABLE sessions DROP CONSTRAINT IF EXISTS fk_sessions_agency;
  
  -- Remove agency columns
  ALTER TABLE users DROP COLUMN IF EXISTS agency_id;
  ALTER TABLE users DROP COLUMN IF EXISTS enhanced_role;
  ALTER TABLE agents DROP COLUMN IF EXISTS agency_id;
  ALTER TABLE agents DROP COLUMN IF EXISTS allowed_features;
  ALTER TABLE agents DROP COLUMN IF EXISTS resource_limits;
  ALTER TABLE chats DROP COLUMN IF EXISTS agency_id;
  ALTER TABLE sessions DROP COLUMN IF EXISTS agency_id;
  
  -- Drop agency-related tables
  DROP TABLE IF EXISTS cross_tenant_access_logs;
  DROP TABLE IF EXISTS agency_audit_logs;
  DROP TABLE IF EXISTS agency_subscriptions;
  DROP TABLE IF EXISTS agencies;
  
  -- Drop migration function
  DROP FUNCTION IF EXISTS migrate_to_agency_structure();
  
  RAISE NOTICE 'Agency structure rollback completed';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- EXECUTION PLAN
-- =====================================================

/*
MIGRATION EXECUTION STEPS:

1. BACKUP DATABASE
   pg_dump your_database > backup_before_agency_migration.sql

2. RUN PHASE 1 (Core Tables)
   Execute Agency and subscription table creation

3. RUN PHASE 2 (Add Columns)  
   Add agency_id columns to existing tables

4. RUN PHASE 3 (Indexes)
   Create performance indexes

5. RUN PHASE 4 (Audit Tables)
   Create audit and security monitoring tables

6. RUN MIGRATION FUNCTION
   SELECT migrate_to_agency_structure();

7. ADD FOREIGN KEY CONSTRAINTS
   ALTER TABLE users ADD CONSTRAINT fk_users_agency FOREIGN KEY (agency_id) REFERENCES agencies(id);
   ALTER TABLE agents ADD CONSTRAINT fk_agents_agency FOREIGN KEY (agency_id) REFERENCES agencies(id);
   ALTER TABLE chats ADD CONSTRAINT fk_chats_agency FOREIGN KEY (agency_id) REFERENCES agencies(id);
   ALTER TABLE sessions ADD CONSTRAINT fk_sessions_agency FOREIGN KEY (agency_id) REFERENCES agencies(id);

8. VERIFY MIGRATION
   Check data integrity and test agency scoping

9. UPDATE APPLICATION CODE
   Deploy agency-aware application code

ROLLBACK (if needed):
   SELECT rollback_agency_structure();
   Restore from backup if necessary

*/
