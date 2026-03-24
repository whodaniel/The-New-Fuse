-- Agent Registry bootstrap schema (PostgreSQL compatible)
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT,
  description TEXT,
  system_prompt TEXT,
  agent_type TEXT NOT NULL DEFAULT 'local',
  source_file TEXT,
  categories_normalized TEXT[] DEFAULT '{}',
  classification JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  version TEXT DEFAULT '1.0.0',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_capabilities (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  capability_type TEXT NOT NULL,
  capability_name TEXT NOT NULL,
  capability_level TEXT DEFAULT 'intermediate'
);

CREATE TABLE IF NOT EXISTS agent_relationships (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  related_agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  strength_score NUMERIC(3,2) DEFAULT 0.50
);

CREATE TABLE IF NOT EXISTS agent_tags (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  tag_category TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  confidence_score NUMERIC(3,2) DEFAULT 1.00
);

