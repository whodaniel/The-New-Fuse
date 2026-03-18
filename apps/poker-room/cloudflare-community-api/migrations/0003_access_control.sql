CREATE TABLE IF NOT EXISTS registration_invite_codes (
  code TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  max_uses INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_registration_invite_codes_status
  ON registration_invite_codes(status);

CREATE TABLE IF NOT EXISTS game_access_rules (
  game_id TEXT PRIMARY KEY,
  label TEXT,
  description TEXT,
  required_tier TEXT NOT NULL DEFAULT 'STARTER',
  requires_membership INTEGER NOT NULL DEFAULT 0,
  required_nft_contract TEXT,
  required_nft_chain_id INTEGER,
  required_nft_token_id TEXT,
  required_nft_traits_json TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_game_access_rules_active
  ON game_access_rules(is_active);

CREATE TABLE IF NOT EXISTS game_entitlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_key TEXT NOT NULL,
  game_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'membership',
  tier_granted TEXT NOT NULL DEFAULT 'STARTER',
  expires_at TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (game_id) REFERENCES game_access_rules(game_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_game_entitlements_subject_game
  ON game_entitlements(subject_key, game_id, created_at DESC);
