-- D1 schema for TNF SharedState (v2): withdraw tracking + mirror pointers

CREATE TABLE IF NOT EXISTS withdraw_history (
  id TEXT PRIMARY KEY,
  runtime TEXT,
  created_at TEXT NOT NULL,
  query TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  r2_key TEXT
);

CREATE INDEX IF NOT EXISTS idx_withdraw_history_created
  ON withdraw_history(created_at);

CREATE TABLE IF NOT EXISTS mirror_latest (
  runtime TEXT PRIMARY KEY,
  updated_at TEXT NOT NULL,
  r2_prefix TEXT NOT NULL,
  manifest_key TEXT,
  sha256 TEXT,
  size_bytes INTEGER
);

CREATE TABLE IF NOT EXISTS mirror_history (
  id TEXT PRIMARY KEY,
  runtime TEXT NOT NULL,
  created_at TEXT NOT NULL,
  r2_prefix TEXT NOT NULL,
  manifest_key TEXT,
  sha256 TEXT,
  size_bytes INTEGER
);

CREATE INDEX IF NOT EXISTS idx_mirror_history_runtime_created
  ON mirror_history(runtime, created_at);
