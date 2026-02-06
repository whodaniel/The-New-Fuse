-- Agent Interaction Logs
CREATE TABLE IF NOT EXISTS agent_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  user_id TEXT,
  action_type TEXT NOT NULL,
  payload TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Asynchronous Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  result TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users (Edge Replica for fast auth)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  api_key TEXT UNIQUE,
  tier TEXT DEFAULT 'FREE', -- 'FREE', 'PRO', 'ENTERPRISE'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Invite Codes
CREATE TABLE IF NOT EXISTS invite_codes (
  code TEXT PRIMARY KEY,
  is_used BOOLEAN DEFAULT FALSE,
  used_by TEXT, -- User ID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Usage Tracking (for Rate Limiting/Billing)
CREATE TABLE IF NOT EXISTS daily_usage (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  service TEXT NOT NULL, -- 'ai', 'browser', 'storage'
  count INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, date, service)
);

