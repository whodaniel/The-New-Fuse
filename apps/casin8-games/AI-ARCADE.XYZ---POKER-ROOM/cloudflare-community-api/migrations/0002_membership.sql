CREATE TABLE IF NOT EXISTS community_members (
  username TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'active',
  role TEXT,
  added_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_community_members_status ON community_members(status);

INSERT OR IGNORE INTO community_members (username, status, role, added_at)
VALUES
  ('tnf-core', 'active', 'founding', datetime('now')),
  ('community-labs', 'active', 'producer', datetime('now'));
