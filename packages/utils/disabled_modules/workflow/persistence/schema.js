"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCHEMA_SQL = void 0;
exports.SCHEMA_SQL = `
-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL,
  data TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

-- Workflow runs table
CREATE TABLE IF NOT EXISTS workflow_runs (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  status TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  node_statuses TEXT NOT NULL,
  node_outputs TEXT,
  errors TEXT,
  FOREIGN KEY (workflow_id) REFERENCES workflows (id)
);

-- Workflow variables table
CREATE TABLE IF NOT EXISTS workflow_variables (
  workflow_id TEXT NOT NULL,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (workflow_id, name),
  FOREIGN KEY (workflow_id) REFERENCES workflows (id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id ON workflow_runs (workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs (status);
CREATE INDEX IF NOT EXISTS idx_workflows_name ON workflows (name);
`;
export {};
//# sourceMappingURL=schema.js.map