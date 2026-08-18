CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, video_url TEXT, host_name TEXT, start_time DATETIME);
CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, session_id TEXT, name TEXT, price REAL, weight REAL, timestamp TEXT);
CREATE TABLE IF NOT EXISTS claims (id TEXT PRIMARY KEY, session_id TEXT, item_id TEXT, buyer_name TEXT, status TEXT, claim_time DATETIME);
