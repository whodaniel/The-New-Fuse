CREATE TABLE prime_directive_priorities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    directive VARCHAR(255) NOT NULL UNIQUE,
    weight NUMERIC(3,2) NOT NULL,
    adaptive BOOLEAN DEFAULT true,
    adjustment_history JSONB DEFAULT '[]',
    last_updated TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);