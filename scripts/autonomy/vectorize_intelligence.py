import hashlib
import json
import os
import re
import psycopg2
from psycopg2.extras import execute_values
import google.generativeai as genai
import time

# Configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..", "..")))
WORKSPACE_ROOT = os.path.abspath(os.getenv("TNF_WORKSPACE_DIR", os.path.join(PROJECT_ROOT, "..")))
KB_ROOT = os.path.abspath(os.getenv("TNF_KB_DIR", os.path.join(WORKSPACE_ROOT, "my-ai-knowledge-base")))

KB_PATH = os.path.join(KB_ROOT, "AI_Knowledge_Base.md")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://username:password@localhost:5432/postgres?sslmode=disable",
)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your-gemini-api-key")
NAMESPACE = "intelligence"
EMBEDDING_MODEL = "models/gemini-embedding-2-preview"
DIMENSION = 1536

def get_hash(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def get_indexed_ids():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("SELECT id FROM vector_embeddings WHERE namespace = %s", (NAMESPACE,))
        ids = {row[0] for row in cur.fetchall()}
        cur.close()
        conn.close()
        return ids
    except Exception as e:
        print(f"⚠️ Could not fetch existing IDs: {e}")
        return set()

def parse_knowledge_base():
    if not os.path.exists(KB_PATH):
        return []
    
    with open(KB_PATH, "r") as f:
        content = f.read()
    
    sections = content.split("---")
    artifacts = []
    
    for sec in sections:
        match = re.search(r"## #(\d+): (.*)", sec)
        if not match: continue
        idx = int(match.group(1))
        title = match.group(2).strip()
        
        url_match = re.search(r"\*\*URL\*\*: (https?://[^\s\n]+)", sec)
        url = url_match.group(1) if url_match else "#"
        
        summary_match = re.search(r"### Summary\n(.*?)(?=\n###|\n---|$)", sec, re.DOTALL)
        summary = summary_match.group(1).strip() if summary_match else ""
        
        insights_match = re.search(r"### Key Insights\n(.*?)(?=\n###|\n---|$)", sec, re.DOTALL)
        insights = insights_match.group(1).strip() if insights_match else ""
        
        cl = "Strategic"
        if "- **Procedural:**" in sec: cl = "Procedural"
        if "- **Governance:**" in sec: cl = "Governance"
        if "[STATUS:PURGE]" in sec: cl = "Purged"
        if "[STATUS:DUPLICATE]" in sec: cl = "Duplicate"
        
        vector_content = f"{title}\n\nSummary: {summary}\n\nInsights:\n{insights}"
        
        artifacts.append({
            "id": f"ID#:INTEL-{idx}",
            "content": vector_content,
            "metadata": {
                "index": idx,
                "title": title,
                "url": url,
                "class": cl,
                "source": "AI_Knowledge_Base.md"
            }
        })
            
    return artifacts

def vectorize_batch(artifacts):
    genai.configure(api_key=GEMINI_API_KEY)
    texts = [a["content"] for a in artifacts]
    try:
        response = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=texts,
            output_dimensionality=DIMENSION
        )
        return response["embedding"]
    except Exception as e:
        print(f"❌ Error generating embeddings: {e}")
        return None

def store_in_db(artifacts, embeddings):
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    data = []
    for art, emb in zip(artifacts, embeddings):
        meta = json.dumps(art["metadata"])
        emb_str = f"[{','.join(map(str, emb))}]"
        data.append((art["id"], emb_str, art["content"], meta, NAMESPACE))
    
    query = """
        INSERT INTO vector_embeddings (id, embedding, content, metadata, namespace)
        VALUES %s
        ON CONFLICT (id) DO UPDATE SET
            embedding = EXCLUDED.embedding,
            content = EXCLUDED.content,
            metadata = EXCLUDED.metadata,
            updated_at = NOW()
    """
    execute_values(cur, query, data)
    conn.commit()
    cur.close()
    conn.close()

def main():
    print("🧠 Starting Incremental Intelligence Vectorization...")
    all_artifacts = parse_knowledge_base()
    existing_ids = get_indexed_ids()
    
    pending = [a for a in all_artifacts if a["id"] not in existing_ids]
    
    if not pending:
        print("✅ All artifacts already indexed. Nothing to do.")
        return
        
    print(f"📊 Found {len(pending)} new/missing artifacts (out of {len(all_artifacts)}).")
    
    batch_size = 50
    total_indexed = 0
    
    for i in range(0, len(pending), batch_size):
        batch = pending[i:i + batch_size]
        print(f"🧠 Vectorizing batch {i//batch_size + 1}/{len(pending)//batch_size + 1}...")
        
        embeddings = vectorize_batch(batch)
        if embeddings:
            store_in_db(batch, embeddings)
            total_indexed += len(batch)
            print(f"✅ Indexed {total_indexed}/{len(pending)} artifacts.")
            # Sleep to avoid rate limits
            time.sleep(1)
        else:
            print(f"⚠️ Skipping batch {i//batch_size + 1} due to error.")
            
    print(f"🏁 Incremental Vectorization Complete. New: {total_indexed}")

if __name__ == "__main__":
    main()
