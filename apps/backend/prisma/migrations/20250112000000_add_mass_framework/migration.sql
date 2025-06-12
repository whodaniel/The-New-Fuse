-- Add MASS-related fields to existing Agent table
ALTER TABLE agents ADD COLUMN mass_optimized BOOLEAN DEFAULT false;
ALTER TABLE agents ADD COLUMN parent_agent_id TEXT;
ALTER TABLE agents ADD COLUMN optimization_metrics JSONB;

-- Create new MASS-specific tables
CREATE TABLE agent_prompt_versions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  exemplars JSONB,
  performance_metrics JSONB,
  mass_stage TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agent_id, version_number)
);

CREATE TABLE workflow_topologies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  performance_metrics JSONB,
  mass_optimized BOOLEAN DEFAULT false,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE optimization_jobs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('block_level', 'topology', 'workflow_level')),
  target_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  config JSONB NOT NULL,
  results JSONB,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE validation_datasets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_agent_prompt_versions_agent_id ON agent_prompt_versions(agent_id);
CREATE INDEX idx_workflow_topologies_user_id ON workflow_topologies(user_id);
CREATE INDEX idx_optimization_jobs_user_id ON optimization_jobs(user_id);
CREATE INDEX idx_optimization_jobs_status ON optimization_jobs(status);
CREATE INDEX idx_validation_datasets_user_id ON validation_datasets(user_id);
