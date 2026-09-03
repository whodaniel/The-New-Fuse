-- Agent Registry Schema
-- Generated at 2026-09-03T05:44:03.351Z

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  department TEXT,
  category TEXT,
  source_file TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS capabilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS agent_capabilities (
  agent_id TEXT REFERENCES agents(id),
  capability_id TEXT REFERENCES capabilities(id),
  PRIMARY KEY (agent_id, capability_id)
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS agent_tags (
  agent_id TEXT REFERENCES agents(id),
  tag_id TEXT REFERENCES tags(id),
  PRIMARY KEY (agent_id, tag_id)
);

CREATE TABLE IF NOT EXISTS relationships (
  from_agent_id TEXT REFERENCES agents(id),
  to_agent_id TEXT REFERENCES agents(id),
  type TEXT,
  PRIMARY KEY (from_agent_id, to_agent_id, type)
);