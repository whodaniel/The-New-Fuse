-- D1 schema for TNF SharedState (v1)

-- Latest context pack pointer per runtime
CREATE TABLE IF NOT EXISTS context_latest (
  runtime TEXT PRIMARY KEY,
  updated_at TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  sha256 TEXT,
  size_bytes INTEGER
);

-- Optional history table for audit/query
CREATE TABLE IF NOT EXISTS context_history (
  id TEXT PRIMARY KEY,
  runtime TEXT NOT NULL,
  created_at TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  sha256 TEXT,
  size_bytes INTEGER
);

CREATE INDEX IF NOT EXISTS idx_context_history_runtime_created
  ON context_history(runtime, created_at);
