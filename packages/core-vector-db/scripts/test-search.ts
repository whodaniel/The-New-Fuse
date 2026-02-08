import { OpenAI } from 'openai';
import { Pool } from 'pg';

/**
 * Test script for TNF Semantic Search
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fuse';
const COLLECTION_NAME = 'tnf_knowledge_base_v1';

const openai = new OpenAI({ 
  apiKey: OPENAI_API_KEY,
  baseURL: OPENAI_API_KEY.startsWith('sk-or') ? 'https://openrouter.ai/api/v1' : undefined
});

const pool = new Pool({ connectionString: DATABASE_URL });

async function search(query: string) {
  console.log(`🔍 Searching for: "${query}"`);

  // 1. Generate Query Embedding
  const response = await openai.embeddings.create({
    model: OPENAI_API_KEY.startsWith('sk-or') ? 'openai/text-embedding-3-small' : 'text-embedding-3-small',
    input: query,
  });
  const embedding = response.data[0].embedding;

  // 2. Perform Vector Search
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT 
        content, 
        metadata->>'path' as file_path,
        metadata->>'crumbtrail' as context,
        1 - (embedding <=> $1) as score
      FROM "${COLLECTION_NAME}"
      ORDER BY embedding <=> $1
      LIMIT 3
    `, [`[${embedding.join(',')}]`]);

    console.log('\n🎯 Top Results:');
    res.rows.forEach((row, i) => {
      console.log(`\n--- Result ${i+1} (Score: ${row.score.toFixed(4)}) ---`);
      console.log(`📍 Source: ${row.file_path}`);
      console.log(`🔗 Context: ${row.context}`);
      console.log(`📝 Snippet: ${row.content.substring(0, 300)}...`);
    });
  } finally {
    client.release();
    await pool.end();
  }
}

const query = process.argv[2] || "What is the mission and vision of The New Fuse?";
search(query).catch(console.error);
