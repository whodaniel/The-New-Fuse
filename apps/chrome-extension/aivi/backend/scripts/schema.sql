-- AI Video Intelligence Suite Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  google_id VARCHAR(255) UNIQUE,
  youtube_refresh_token_encrypted TEXT,
  display_name VARCHAR(255),
  avatar_url TEXT,
  tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'tnf')),
  stripe_customer_id VARCHAR(255) UNIQUE,
  daily_usage INTEGER DEFAULT 0,
  daily_limit INTEGER DEFAULT 20,
  total_processed INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on email and google_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('pro', 'tnf')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  billing_period VARCHAR(20) CHECK (billing_period IN ('monthly', 'yearly')),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- Video queue table
CREATE TABLE IF NOT EXISTS video_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  youtube_video_id VARCHAR(20) NOT NULL,
  title VARCHAR(500),
  channel_name VARCHAR(255),
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 0,
  playlist_id VARCHAR(50),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  added_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_queue_user_id ON video_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_status ON video_queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_youtube_video_id ON video_queue(youtube_video_id);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_queue_id UUID REFERENCES video_queue(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  segment_index INTEGER DEFAULT 0,
  content_markdown TEXT NOT NULL,
  content_json JSONB,
  word_count INTEGER,
  key_topics TEXT[],
  ai_concepts TEXT[],
  tools_mentioned TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_video_queue_id ON reports(video_queue_id);
CREATE INDEX IF NOT EXISTS idx_reports_key_topics ON reports USING GIN(key_topics);
CREATE INDEX IF NOT EXISTS idx_reports_ai_concepts ON reports USING GIN(ai_concepts);

-- Knowledge base metadata table (for future RAG system)
CREATE TABLE IF NOT EXISTS knowledge_base_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  total_reports INTEGER DEFAULT 0,
  total_videos INTEGER DEFAULT 0,
  unique_topics TEXT[],
  unique_tools TEXT[],
  unique_concepts TEXT[],
  last_updated TIMESTAMP DEFAULT NOW(),
  consolidation_status VARCHAR(20) DEFAULT 'pending' CHECK (consolidation_status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_kb_metadata_user_id ON knowledge_base_metadata(user_id);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);

-- API keys table (for future API access)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  key_prefix VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to reset daily usage
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET daily_usage = 0, last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to check and update tier based on subscription
CREATE OR REPLACE FUNCTION sync_user_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE users SET tier = NEW.tier WHERE id = NEW.user_id;
  ELSIF NEW.status IN ('canceled', 'past_due', 'unpaid') THEN
    UPDATE users SET tier = 'free' WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync user tier when subscription changes
CREATE TRIGGER sync_user_tier_on_subscription_change
AFTER INSERT OR UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION sync_user_tier();

-- Views for analytics

-- Active users view
CREATE OR REPLACE VIEW active_users AS
SELECT
  tier,
  COUNT(*) as user_count,
  SUM(total_processed) as total_videos_processed,
  AVG(total_processed) as avg_videos_per_user
FROM users
GROUP BY tier;

-- Daily usage stats view
CREATE OR REPLACE VIEW daily_usage_stats AS
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) as total_actions
FROM usage_logs
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Queue status view
CREATE OR REPLACE VIEW queue_status_summary AS
SELECT
  user_id,
  status,
  COUNT(*) as count,
  AVG(
    CASE
      WHEN completed_at IS NOT NULL AND started_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (completed_at - started_at))
      ELSE NULL
    END
  ) as avg_processing_time_seconds
FROM video_queue
GROUP BY user_id, status;

COMMENT ON TABLE users IS 'User accounts with authentication and subscription information';
COMMENT ON TABLE subscriptions IS 'Active and historical subscription records';
COMMENT ON TABLE video_queue IS 'Queue of videos to be processed or already processed';
COMMENT ON TABLE reports IS 'AI-generated reports for video segments';
COMMENT ON TABLE knowledge_base_metadata IS 'Aggregated metadata about user knowledge bases';
COMMENT ON TABLE usage_logs IS 'Audit log of user actions for analytics and debugging';
COMMENT ON TABLE api_keys IS 'API keys for programmatic access (TNF tier)';
