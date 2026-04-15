CREATE TABLE prompt_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID,
    generated_prompt TEXT NOT NULL,
    assessment_results JSONB,
    overall_score NUMERIC(5,2),
    prime_directive_score NUMERIC(5,2),
    execution_status VARCHAR(50) DEFAULT 'PENDING',
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);