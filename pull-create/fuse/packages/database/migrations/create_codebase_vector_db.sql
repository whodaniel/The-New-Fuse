-- Codebase Vectorization & Knowledge Graph Schema
-- Requires: PostgreSQL with pgvector extension

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Code Entities Table
-- Stores all code entities (files, functions, classes, etc.)
CREATE TABLE IF NOT EXISTS code_entities (
  id BIGSERIAL PRIMARY KEY,
  file_path TEXT NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'file', 'function', 'class', 'method', 'interface', 'type'
  entity_name TEXT NOT NULL,
  content TEXT NOT NULL,
  start_line INTEGER,
  end_line INTEGER,
  language VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  content_hash VARCHAR(64) UNIQUE -- SHA-256 hash for deduplication
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_code_entities_file_path ON code_entities(file_path);
CREATE INDEX IF NOT EXISTS idx_code_entities_type ON code_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_code_entities_name ON code_entities(entity_name);
CREATE INDEX IF NOT EXISTS idx_code_entities_hash ON code_entities(content_hash);
CREATE INDEX IF NOT EXISTS idx_code_entities_metadata ON code_entities USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_code_entities_language ON code_entities(language);

-- Vector Embeddings Table
-- Stores vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS code_embeddings (
  id BIGSERIAL PRIMARY KEY,
  entity_id BIGINT NOT NULL REFERENCES code_entities(id) ON DELETE CASCADE,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  model VARCHAR(100) DEFAULT 'text-embedding-3-small',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(entity_id)
);

-- pgvector index for fast cosine similarity search
-- Uses IVFFlat algorithm with 100 lists (good for 10k-1M vectors)
CREATE INDEX IF NOT EXISTS idx_code_embeddings_vector ON code_embeddings 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

-- Code Relationships Table (Knowledge Graph)
-- Stores relationships between code entities
CREATE TABLE IF NOT EXISTS code_relationships (
  id BIGSERIAL PRIMARY KEY,
  from_entity_id BIGINT NOT NULL REFERENCES code_entities(id) ON DELETE CASCADE,
  to_entity_id BIGINT NOT NULL REFERENCES code_entities(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL, -- 'imports', 'calls', 'extends', 'implements', 'uses'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(from_entity_id, to_entity_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_relationships_from ON code_relationships(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to ON code_relationships(to_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON code_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_relationships_metadata ON code_relationships USING GIN(metadata);

-- Codebase Snapshots Table
-- Tracks different versions/snapshots of the codebase
CREATE TABLE IF NOT EXISTS codebase_snapshots (
  id BIGSERIAL PRIMARY KEY,
  git_commit_hash VARCHAR(40),
  snapshot_date TIMESTAMP DEFAULT NOW(),
  total_entities INTEGER,
  total_files INTEGER,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_snapshots_commit ON codebase_snapshots(git_commit_hash);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON codebase_snapshots(snapshot_date);

-- Search Analytics Table
-- Tracks search queries for optimization
CREATE TABLE IF NOT EXISTS search_analytics (
  id BIGSERIAL PRIMARY KEY,
  query_text TEXT,
  query_type VARCHAR(50), -- 'semantic', 'structural', 'hybrid'
  results_count INTEGER,
  query_time_ms INTEGER,
  searched_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_analytics_type ON search_analytics(query_type);
CREATE INDEX IF NOT EXISTS idx_search_analytics_date ON search_analytics(searched_at);

-- Materialized View: Popular Search Queries
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_searches AS
SELECT 
  query_text,
  query_type,
  COUNT(*) as search_count,
  AVG(query_time_ms) as avg_time_ms,
  AVG(results_count) as avg_results
FROM search_analytics
WHERE searched_at > NOW() - INTERVAL '30 days'
GROUP BY query_text, query_type
ORDER BY search_count DESC
LIMIT 100;

CREATE INDEX IF NOT EXISTS idx_popular_searches_count ON popular_searches(search_count DESC);

-- Materialized View: Code Duplication Report
CREATE MATERIALIZED VIEW IF NOT EXISTS code_duplication_report AS
SELECT 
  ce1.entity_type,
  ce1.file_path as file_path_1,
  ce1.entity_name as entity_name_1,
  ce2.file_path as file_path_2,
  ce2.entity_name as entity_name_2,
  1 - (cem1.embedding <=> cem2.embedding) as similarity
FROM code_entities ce1
JOIN code_embeddings cem1 ON ce1.id = cem1.entity_id
JOIN code_embeddings cem2 ON ce1.id < cem2.entity_id
JOIN code_entities ce2 ON cem2.entity_id = ce2.id
WHERE 
  ce1.entity_type IN ('function', 'class', 'method')
  AND ce2.entity_type IN ('function', 'class', 'method')
  AND ce1.file_path != ce2.file_path
  AND 1 - (cem1.embedding <=> cem2.embedding) > 0.90
ORDER BY similarity DESC;

-- Function: Refresh materialized views
CREATE OR REPLACE FUNCTION refresh_codebase_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY popular_searches;
  REFRESH MATERIALIZED VIEW CONCURRENTLY code_duplication_report;
END;
$$ LANGUAGE plpgsql;

-- Function: Semantic search helper
CREATE OR REPLACE FUNCTION semantic_search(
  query_embedding vector(1536),
  result_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  id BIGINT,
  file_path TEXT,
  entity_type VARCHAR(50),
  entity_name TEXT,
  content TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.id,
    ce.file_path,
    ce.entity_type,
    ce.entity_name,
    ce.content,
    1 - (cem.embedding <=> query_embedding) as similarity
  FROM code_entities ce
  JOIN code_embeddings cem ON ce.id = cem.entity_id
  ORDER BY cem.embedding <=> query_embedding
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Find duplicates of a specific entity
CREATE OR REPLACE FUNCTION find_duplicate_code(
  source_entity_id BIGINT,
  similarity_threshold FLOAT DEFAULT 0.90
)
RETURNS TABLE(
  id BIGINT,
  file_path TEXT,
  entity_name TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.id,
    ce.file_path,
    ce.entity_name,
    1 - (cem.embedding <=> source.embedding) as similarity
  FROM code_embeddings source
  JOIN code_embeddings cem ON source.entity_id != cem.entity_id
  JOIN code_entities ce ON cem.entity_id = ce.id
  WHERE source.entity_id = source_entity_id
    AND 1 - (cem.embedding <=> source.embedding) > similarity_threshold
  ORDER BY cem.embedding <=> source.embedding
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Function: Get dependency tree
CREATE OR REPLACE FUNCTION get_dependency_tree(
  source_entity_id BIGINT,
  max_depth INTEGER DEFAULT 3
)
RETURNS TABLE(
  entity_id BIGINT,
  entity_name TEXT,
  file_path TEXT,
  relationship_type VARCHAR(50),
  depth INTEGER
) AS $$
WITH RECURSIVE deps AS (
  -- Base case: direct dependencies
  SELECT 
    ce.id as entity_id,
    ce.entity_name,
    ce.file_path,
    cr.relationship_type,
    1 as depth
  FROM code_relationships cr
  JOIN code_entities ce ON cr.to_entity_id = ce.id
  WHERE cr.from_entity_id = source_entity_id
  
  UNION
  
  -- Recursive case: transitive dependencies
  SELECT 
    ce.id,
    ce.entity_name,
    ce.file_path,
    cr.relationship_type,
    deps.depth + 1
  FROM code_relationships cr
  JOIN code_entities ce ON cr.to_entity_id = ce.id
  JOIN deps ON cr.from_entity_id = deps.entity_id
  WHERE deps.depth < max_depth
)
SELECT * FROM deps;
$$ LANGUAGE sql;

-- Trigger: Update updated_at on code_entities
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_code_entities_modtime
BEFORE UPDATE ON code_entities
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Comments for documentation
COMMENT ON TABLE code_entities IS 'Stores all code entities extracted from the codebase';
COMMENT ON TABLE code_embeddings IS 'Vector embeddings for semantic code search';
COMMENT ON TABLE code_relationships IS 'Knowledge graph of code dependencies and relationships';
COMMENT ON TABLE codebase_snapshots IS 'Historical snapshots of codebase state';
COMMENT ON TABLE search_analytics IS 'Analytics for search queries and performance';

COMMENT ON FUNCTION semantic_search IS 'Perform semantic search on codebase using vector similarity';
COMMENT ON FUNCTION find_duplicate_code IS 'Find duplicate or highly similar code entities';
COMMENT ON FUNCTION get_dependency_tree IS 'Get dependency tree for a code entity';
