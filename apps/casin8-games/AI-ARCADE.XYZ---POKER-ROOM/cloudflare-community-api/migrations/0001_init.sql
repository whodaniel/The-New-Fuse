CREATE TABLE IF NOT EXISTS community_apps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  summary TEXT NOT NULL,
  creator TEXT NOT NULL,
  category TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending',
  featured INTEGER NOT NULL DEFAULT 0,
  votes INTEGER NOT NULL DEFAULT 0,
  total_views INTEGER NOT NULL DEFAULT 0,
  total_launches INTEGER NOT NULL DEFAULT 0,
  total_submissions INTEGER NOT NULL DEFAULT 0,
  cloudflare_option TEXT NOT NULL DEFAULT 'workers',
  cloudflare_project_name TEXT,
  cloudflare_deployment_url TEXT,
  play_url TEXT,
  source_url TEXT,
  cover_image_url TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_community_apps_status ON community_apps(status);
CREATE INDEX IF NOT EXISTS idx_community_apps_votes_created ON community_apps(votes DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS community_votes (
  app_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (app_id, user_id),
  FOREIGN KEY (app_id) REFERENCES community_apps(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_community_votes_created ON community_votes(created_at DESC);

CREATE TABLE IF NOT EXISTS community_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id TEXT NOT NULL,
  type TEXT NOT NULL,
  user_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (app_id) REFERENCES community_apps(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_community_events_app_time ON community_events(app_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_community_events_time ON community_events(timestamp DESC);

CREATE TABLE IF NOT EXISTS community_comments (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (app_id) REFERENCES community_apps(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_community_comments_app_time ON community_comments(app_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_time ON community_comments(created_at DESC);
