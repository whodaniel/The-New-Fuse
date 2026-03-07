CREATE TABLE collective_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID,
    contribution_type VARCHAR(100) NOT NULL,
    description TEXT,
    impact_score NUMERIC(5,2),
    status VARCHAR(50) DEFAULT 'PROPOSED',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);