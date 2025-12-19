#!/bin/bash

# Simple database reset script for The New Fuse
echo "Resetting The New Fuse database..."

# Check if Docker and PostgreSQL are running
if ! docker ps | grep -q "fuse-postgres"; then
  echo "Error: PostgreSQL container not running. Please start it first:"
  echo "docker run --name fuse-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=fuse -p 5432:5432 -d postgres:13-alpine"
  exit 1
fi

# Database connection parameters
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_NAME="fuse"
DB_HOST="localhost"
DB_PORT="5432"

echo "Applying database schema..."

# Create essential tables
cat <<EOF | docker exec -i fuse-postgres psql -U ${DB_USER} -d ${DB_NAME}
-- Drop existing tables if they exist
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS capabilities CASCADE;
DROP TABLE IF EXISTS workflows CASCADE;
DROP TABLE IF EXISTS workflow_steps CASCADE;
DROP TABLE IF EXISTS workflow_executions CASCADE;
DROP TABLE IF EXISTS contexts CASCADE;
DROP TABLE IF EXISTS messages CASCADE;

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create agents table
CREATE TABLE agents (
  id SERIAL PRIMARY KEY,
  agent_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create capabilities table
CREATE TABLE capabilities (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  capability_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_id, capability_id)
);

-- Create workflows table
CREATE TABLE workflows (
  id SERIAL PRIMARY KEY,
  workflow_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create workflow steps table
CREATE TABLE workflow_steps (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER REFERENCES workflows(id) ON DELETE CASCADE,
  step_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  agent_id INTEGER REFERENCES agents(id),
  action VARCHAR(255),
  step_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workflow_id, step_id)
);

-- Create workflow executions table
CREATE TABLE workflow_executions (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER REFERENCES workflows(id) ON DELETE CASCADE,
  execution_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  input_data JSONB,
  output_data JSONB
);

-- Create contexts table
CREATE TABLE contexts (
  id SERIAL PRIMARY KEY,
  context_id VARCHAR(255) UNIQUE NOT NULL,
  context_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

-- Create messages table
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  context_id INTEGER REFERENCES contexts(id) ON DELETE CASCADE,
  message_id VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

-- Create indexes
CREATE INDEX idx_agents_agent_id ON agents(agent_id);
CREATE INDEX idx_capabilities_capability_id ON capabilities(capability_id);
CREATE INDEX idx_workflows_workflow_id ON workflows(workflow_id);
CREATE INDEX idx_workflow_executions_execution_id ON workflow_executions(execution_id);
CREATE INDEX idx_contexts_context_id ON contexts(context_id);
CREATE INDEX idx_messages_context_id ON messages(context_id);

-- Insert demo data - a sample agent
INSERT INTO agents (agent_id, name, description) 
VALUES ('text-analysis-agent', 'Text Analysis Agent', 'Analyzes text for sentiment and entities');

-- Insert demo capabilities
INSERT INTO capabilities (agent_id, capability_id, name, description, version) 
VALUES (1, 'text-analysis', 'Text Analysis', 'General text analysis capabilities', '1.0');

-- Insert a demo workflow
INSERT INTO workflows (workflow_id, name, description) 
VALUES ('text-processing-workflow', 'Text Processing', 'Process and analyze text content');

-- Insert workflow steps
INSERT INTO workflow_steps (workflow_id, step_id, name, agent_id, action, step_order) 
VALUES (1, 'extract-text', 'Extract Text', 1, 'extract-text', 1);

INSERT INTO workflow_steps (workflow_id, step_id, name, agent_id, action, step_order) 
VALUES (1, 'analyze-sentiment', 'Analyze Sentiment', 1, 'analyze-sentiment', 2);

EOF

echo "✓ Database schema applied successfully!"
