-- ═══════════════════════════════════════════════════════════════
-- DANIEL WHO MEDIA EMPIRE — Traversable Graph Data Model
-- ═══════════════════════════════════════════════════════════════
-- Design Principles:
--   1. TRAVERSABLE: Every entity and relationship queryable by AI agents
--   2. PERSISTENT: Supabase PostgreSQL — survives sessions, survives reboots
--   3. PIPELINE-AWARE: Lifecycle stages with verification checkpoints
--   4. USER-FRIENDLY: Clean types, no weird join tables, simple CRUD
--   5. AI-READABLE: JSONB metadata, structured enums, graph-ready edges
-- ═══════════════════════════════════════════════════════════════

-- ─── LIFECYCLE STAGES ───────────────────────────────────────────
-- The production pipeline: ideation → monetization
-- Each stage has verification criteria that must be met to advance
CREATE TYPE empire_lifecycle_stage AS ENUM (
  'ideation',        -- Idea exists, no code, no design
  'concept',         -- Design doc, spec, or mockup created
  'prototype',       -- Working proof-of-concept exists
  'development',     -- Active coding/building
  'alpha',           -- Internal testing, feature incomplete
  'beta',            -- External testing, feature complete
  'launch',          -- Publicly available as product/service
  'growth',          -- Active users, revenue < break-even
  'monetization',    -- Generating revenue >= break-even
  'mature',          -- Stable revenue, maintained, optimizing
  'sunset',          -- End-of-life, winding down
  'archived'         -- Dead/stopped, kept for reference
);

-- ─── ENTITY TYPES ───────────────────────────────────────────────
-- What kinds of things are in the empire
CREATE TYPE empire_entity_type AS ENUM (
  'project',         -- Software project, app, platform
  'domain',          -- Owned domain name
  'ip',              -- Intellectual property (patent, trademark, copyright, design)
  'brand',           -- Brand identity, logo, name system
  'venture',         -- Business entity, DAO, company
  'service',         -- SaaS/API/service offering
  'content',         -- Blog, video, podcast, music, art
  'skill',           -- Reusable capability, agent skill, workflow
  'infrastructure',  -- Server, database, CDN, tooling
  'community',       -- Discord, Telegram, social group
  'relationship',    -- Partnership, client, vendor
  'asset',           -- Catch-all for other owned things
);

-- ─── RELATIONSHIP TYPES ─────────────────────────────────────────
-- How entities connect to each other
CREATE TYPE empire_relation_type AS ENUM (
  'depends_on',      -- A requires B to function
  'produces',        -- A creates/generates B
  'owns',            -- A owns B (person→domain, venture→project)
  'contains',        -- A is parent of B (project→feature)
  'derives_from',    -- A evolved/spun off from B
  'enables',         -- A makes B possible
  'monetizes_via',   -- A generates revenue through B
  'competes_with',   -- A competes in same space as B
  'supports',        -- A provides support/infrastructure for B
  'brand_of',        -- A is the brand identity for B
  'hosted_on',       -- A is deployed on B
  'uses_tech',       -- A is built with technology B
  'related_to',      -- Generic relationship
);

-- ─── VERIFICATION CHECKPOINT STATUS ────────────────────────────
CREATE TYPE checkpoint_status AS ENUM (
  'pending',         -- Not yet verified
  'passed',          -- Verification criteria met
  'failed',          -- Verification failed, needs work
  'waived',          -- Explicitly waived by super_admin
  'blocked',         -- Blocked by external dependency
);

-- ═══════════════════════════════════════════════════════════════
-- TABLE: empire_entities
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE empire_entities (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,  -- URL-safe identifier
  type            empire_entity_type NOT NULL,
  stage           empire_lifecycle_stage NOT NULL DEFAULT 'ideation',
  
  -- Core metadata
  description     TEXT DEFAULT '',
  url             TEXT DEFAULT '',          -- Primary URL if applicable
  repo_url        TEXT DEFAULT '',          -- GitHub repo if applicable
  
  -- Rich metadata (AI-traversable JSONB)
  metadata        JSONB DEFAULT '{}'::jsonb,
  -- Common metadata keys:
  --   domains: string[]         -- Associated domain names
  --   tech_stack: string[]      -- Technologies used
  --   revenue_model: string     -- How it makes money
  --   target_audience: string   -- Who it's for
  --   key_features: string[]    -- Main capabilities
  --   dependencies: string[]    -- External service dependencies
  --   social_links: object      -- {discord, telegram, twitter, etc}
  --   tier: string              -- 'free'|'pro'|'enterprise'
  --   pricing: object           -- {monthly, annual, lifetime}
  --   metrics: object           -- {users, revenue, mrr, etc}
  
  -- Pipeline tracking
  stage_entered_at  TIMESTAMPTZ DEFAULT NOW(),
  stage_deadline    TIMESTAMPTZ,           -- Target date for next stage
  last_verified_at  TIMESTAMPTZ,
  
  -- Ownership & access
  owner_email     TEXT DEFAULT 'owner@example.com',
  created_by      TEXT DEFAULT 'owner@example.com',
  
  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete
  is_archived     BOOLEAN DEFAULT FALSE
);

-- Indexes for AI traversal queries
CREATE INDEX idx_empire_entities_type ON empire_entities(type);
CREATE INDEX idx_empire_entities_stage ON empire_entities(stage);
CREATE INDEX idx_empire_entities_slug ON empire_entities(slug);
CREATE INDEX idx_empire_entities_owner ON empire_entities(owner_email);
CREATE INDEX idx_empire_entities_metadata ON empire_entities USING GIN(metadata);

-- ═══════════════════════════════════════════════════════════════
-- TABLE: empire_relations
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE empire_relations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id       UUID NOT NULL REFERENCES empire_entities(id) ON DELETE CASCADE,
  target_id       UUID NOT NULL REFERENCES empire_entities(id) ON DELETE CASCADE,
  type            empire_relation_type NOT NULL,
  
  -- Edge metadata
  label           TEXT DEFAULT '',          -- Human-readable edge label
  strength        SMALLINT DEFAULT 5,       -- 1-10 how strong/critical
  metadata        JSONB DEFAULT '{}'::jsonb,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate edges
  UNIQUE(source_id, target_id, type)
);

CREATE INDEX idx_empire_relations_source ON empire_relations(source_id);
CREATE INDEX idx_empire_relations_target ON empire_relations(target_id);
CREATE INDEX idx_empire_relations_type ON empire_relations(type);

-- ═══════════════════════════════════════════════════════════════
-- TABLE: empire_checkpoints
-- ═══════════════════════════════════════════════════════════════
-- Verification checkpoints for the production pipeline
-- Each lifecycle stage has required checkpoints that must PASS
-- before the entity can advance to the next stage
CREATE TABLE empire_checkpoints (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id       UUID NOT NULL REFERENCES empire_entities(id) ON DELETE CASCADE,
  
  -- What stage this checkpoint guards
  from_stage      empire_lifecycle_stage NOT NULL,
  to_stage        empire_lifecycle_stage NOT NULL,
  
  -- Checkpoint definition
  name            TEXT NOT NULL,              -- e.g. "Working demo exists"
  description     TEXT DEFAULT '',            -- Detailed criteria
  verification_fn TEXT DEFAULT '',            -- AI-callable verification procedure
  
  -- Checkpoint state
  status          checkpoint_status NOT NULL DEFAULT 'pending',
  verified_by     TEXT DEFAULT '',            -- Who/what verified it
  verified_at     TIMESTAMPTZ,
  notes           TEXT DEFAULT '',            -- Evidence, reasoning
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_empire_checkpoints_entity ON empire_checkpoints(entity_id);
CREATE INDEX idx_empire_checkpoints_status ON empire_checkpoints(status);
CREATE INDEX idx_empire_checkpoints_transition ON empire_checkpoints(from_stage, to_stage);

-- ═══════════════════════════════════════════════════════════════
-- TABLE: empire_stage_history
-- ═══════════════════════════════════════════════════════════════
-- Audit trail — every stage transition is recorded
-- This makes the graph fully traversable over time
CREATE TABLE empire_stage_history (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id       UUID NOT NULL REFERENCES empire_entities(id) ON DELETE CASCADE,
  from_stage      empire_lifecycle_stage,
  to_stage        empire_lifecycle_stage NOT NULL,
  changed_by      TEXT NOT NULL DEFAULT 'system',  -- who/what triggered
  reason          TEXT DEFAULT '',
  all_checkpoints_passed BOOLEAN DEFAULT FALSE,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_empire_stage_history_entity ON empire_stage_history(entity_id);
CREATE INDEX idx_empire_stage_history_time ON empire_stage_history(created_at);

-- ═══════════════════════════════════════════════════════════════
-- DEFAULT CHECKPOINT TEMPLATES
-- ═══════════════════════════════════════════════════════════════
-- Pre-seed the verification criteria for each stage transition
-- These are automatically applied when an entity is created

INSERT INTO empire_checkpoints (entity_id, from_stage, to_stage, name, description) 
SELECT 
  e.id,
  'ideation', 
  'concept',
  'Design document created',
  'A written spec, design doc, mockup, or PRD exists for this idea'
FROM empire_entities e
WHERE e.stage = 'ideation'
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- HELPER: Recursive graph traversal function
-- ═══════════════════════════════════════════════════════════════
-- AI agents call this to traverse the entire empire graph
-- from any starting node, up to N hops deep
CREATE OR REPLACE FUNCTION traverse_empire(
  start_entity_id UUID,
  max_depth INT DEFAULT 3,
  direction TEXT DEFAULT 'both'  -- 'outgoing', 'incoming', 'both'
)
RETURNS TABLE (
  entity_id UUID,
  entity_name TEXT,
  entity_type empire_entity_type,
  entity_stage empire_lifecycle_stage,
  relation_type empire_relation_type,
  depth INT,
  path TEXT[]
) AS $$
WITH RECURSIVE graph AS (
  -- Base case: starting node
  SELECT 
    e.id AS entity_id,
    e.name AS entity_name,
    e.type AS entity_type,
    e.stage AS entity_stage,
    NULL::empire_relation_type AS relation_type,
    0 AS depth,
    ARRAY[e.name]::TEXT[] AS path
  
  FROM empire_entities e
  WHERE e.id = start_entity_id AND e.is_archived = FALSE
  
  UNION ALL
  
  -- Recursive: follow edges
  SELECT 
    CASE WHEN r.source_id = g.entity_id THEN r.target_id ELSE r.source_id END,
    CASE WHEN r.source_id = g.entity_id THEN te.name ELSE se.name END,
    CASE WHEN r.source_id = g.entity_id THEN te.type ELSE se.type END,
    CASE WHEN r.source_id = g.entity_id THEN te.stage ELSE se.stage END,
    r.type,
    g.depth + 1,
    g.path || CASE WHEN r.source_id = g.entity_id THEN te.name ELSE se.name END
  FROM graph g
  JOIN empire_relations r ON (
    (direction IN ('outgoing', 'both') AND r.source_id = g.entity_id) OR
    (direction IN ('incoming', 'both') AND r.target_id = g.entity_id)
  )
  JOIN empire_entities se ON r.source_id = se.id AND se.is_archived = FALSE
  JOIN empire_entities te ON r.target_id = te.id AND te.is_archived = FALSE
  WHERE g.depth < max_depth
)
SELECT * FROM graph;
$$ LANGUAGE sql;

-- ═══════════════════════════════════════════════════════════════
-- HELPER: Pipeline health check
-- ═══════════════════════════════════════════════════════════════
-- Returns all entities stuck at a stage past their deadline
CREATE OR REPLACE FUNCTION pipeline_stuck_entities()
RETURNS TABLE (
  entity_id UUID,
  entity_name TEXT,
  entity_type empire_entity_type,
  current_stage empire_lifecycle_stage,
  stage_entered_at TIMESTAMPTZ,
  stage_deadline TIMESTAMPTZ,
  days_overdue INT,
  pending_checkpoints INT
) AS $$
SELECT 
  e.id,
  e.name,
  e.type,
  e.stage,
  e.stage_entered_at,
  e.stage_deadline,
  EXTRACT(DAY FROM NOW() - e.stage_deadline)::INT AS days_overdue,
  (SELECT COUNT(*) FROM empire_checkpoints c 
   WHERE c.entity_id = e.id AND c.status = 'pending'
   AND c.from_stage = e.stage) AS pending_checkpoints
FROM empire_entities e
WHERE e.is_archived = FALSE
  AND e.stage_deadline IS NOT NULL
  AND e.stage_deadline < NOW()
  AND e.stage NOT IN ('monetization', 'mature', 'sunset', 'archived')
ORDER BY days_overdue DESC;
$$ LANGUAGE sql;

-- ═══════════════════════════════════════════════════════════════
-- RLS (Row Level Security) — Super Admin access
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE empire_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE empire_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE empire_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE empire_stage_history ENABLE ROW LEVEL SECURITY;

-- Super admin (owner@example.com) can do everything
CREATE POLICY "super_admin_full_access" ON empire_entities
  FOR ALL USING (auth.jwt()->>'email' = 'owner@example.com' OR owner_email = 'owner@example.com');

CREATE POLICY "super_admin_full_access_relations" ON empire_relations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM empire_entities WHERE id = source_id AND (owner_email = 'owner@example.com' OR auth.jwt()->>'email' = 'owner@example.com'))
  );

CREATE POLICY "super_admin_full_access_checkpoints" ON empire_checkpoints
  FOR ALL USING (
    EXISTS (SELECT 1 FROM empire_entities WHERE id = entity_id AND (owner_email = 'owner@example.com' OR auth.jwt()->>'email' = 'owner@example.com'))
  );

CREATE POLICY "super_admin_full_access_history" ON empire_stage_history
  FOR ALL USING (
    EXISTS (SELECT 1 FROM empire_entities WHERE id = entity_id AND (owner_email = 'owner@example.com' OR auth.jwt()->>'email' = 'owner@example.com'))
  );

-- Read access for authenticated users (view-only)
CREATE POLICY "authenticated_read" ON empire_entities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_read_relations" ON empire_relations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_read_checkpoints" ON empire_checkpoints FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_read_history" ON empire_stage_history FOR SELECT USING (auth.role() = 'authenticated');
