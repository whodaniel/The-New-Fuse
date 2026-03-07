CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID,
    category VARCHAR(100) NOT NULL,
    score NUMERIC(5,2) NOT NULL,
    weight NUMERIC(3,2) DEFAULT 1.0,
    trend VARCHAR(20),
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);