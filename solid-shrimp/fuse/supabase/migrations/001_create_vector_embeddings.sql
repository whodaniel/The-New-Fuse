-- Enable the pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the vector_embeddings table for storing document embeddings
CREATE TABLE IF NOT EXISTS vector_embeddings (
    id TEXT PRIMARY KEY,
    embedding vector(1536),  -- OpenAI ada-002 / text-embedding-3-small dimension
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    namespace TEXT DEFAULT 'default'::text,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_namespace
    ON vector_embeddings(namespace);

CREATE INDEX IF NOT EXISTS idx_vector_embeddings_created_at
    ON vector_embeddings(created_at DESC);

-- Create a vector similarity search index using HNSW (Hierarchical Navigable Small World)
-- This dramatically speeds up similarity searches
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_embedding
    ON vector_embeddings
    USING hnsw (embedding vector_cosine_ops);

-- Alternative: IVFFlat index (use this if HNSW is not available in your Supabase version)
-- CREATE INDEX IF NOT EXISTS idx_vector_embeddings_embedding
--     ON vector_embeddings
--     USING ivfflat (embedding vector_cosine_ops)
--     WITH (lists = 100);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_vector_embeddings_updated_at
    BEFORE UPDATE ON vector_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create the match_documents function for similarity search
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10,
    filter_namespace text DEFAULT NULL
)
RETURNS TABLE (
    id text,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        vector_embeddings.id,
        vector_embeddings.content,
        vector_embeddings.metadata,
        1 - (vector_embeddings.embedding <=> query_embedding) as similarity
    FROM vector_embeddings
    WHERE
        (filter_namespace IS NULL OR vector_embeddings.namespace = filter_namespace)
        AND 1 - (vector_embeddings.embedding <=> query_embedding) > match_threshold
    ORDER BY vector_embeddings.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Grant necessary permissions (adjust based on your Supabase setup)
-- These might need to be adjusted based on your authentication setup
ALTER TABLE vector_embeddings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read embeddings
CREATE POLICY "Allow authenticated read access"
    ON vector_embeddings
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy to allow authenticated users to insert embeddings
CREATE POLICY "Allow authenticated insert access"
    ON vector_embeddings
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create policy to allow authenticated users to update their own embeddings
CREATE POLICY "Allow authenticated update access"
    ON vector_embeddings
    FOR UPDATE
    TO authenticated
    USING (true);

-- Create policy to allow authenticated users to delete embeddings
CREATE POLICY "Allow authenticated delete access"
    ON vector_embeddings
    FOR DELETE
    TO authenticated
    USING (true);

-- For service role or anon access (use with caution in production)
-- CREATE POLICY "Allow service role full access"
--     ON vector_embeddings
--     FOR ALL
--     TO service_role
--     USING (true);
