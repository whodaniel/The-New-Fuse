-- Migration: Add Feedback Table
-- Date: 2026-05-03
-- Purpose: Beta developer feedback system for TNF

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL DEFAULT 'other',
  message TEXT NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'beta',
  
  -- Context
  context_url TEXT,
  user_agent TEXT,
  screen_resolution VARCHAR(50),
  screenshot_url TEXT,
  steps_to_reproduce TEXT,
  
  -- Metadata
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  tags TEXT[],
  
  -- Linking
  linked_task_id UUID,
  linked_commits TEXT[],
  
  -- Reporter
  reporter_name VARCHAR(255),
  reporter_email VARCHAR(255),
  
  -- System
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback Comments Table
CREATE TABLE IF NOT EXISTS feedback_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  author_id UUID,
  author_name VARCHAR(255),
  content TEXT NOT NULL,
  is_internal VARCHAR(10) DEFAULT 'false',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback to Tasks Link Table
CREATE TABLE IF NOT EXISTS feedback_to_tasks (
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  task_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (feedback_id, task_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_source ON feedback(source);
CREATE INDEX IF NOT EXISTS idx_feedback_comments_feedback_id ON feedback_comments(feedback_id);

-- Comments
COMMENT ON TABLE feedback IS 'Beta developer feedback for TNF development';
COMMENT ON TABLE feedback_comments IS 'Discussion on feedback items';
COMMENT ON TABLE feedback_to_tasks IS 'Links feedback to tasks for traceability';