#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FACTOIDS_FILE = path.join(__dirname, '..', 'data', 'factoids_to_embed.json');
const EMBED_BATCH_SIZE = 20;
const API_URL = 'https://integrate.api.nvidia.com/v1/embeddings';
const API_KEY = process.env.NVIDIA_API_KEY;
const DB_URL = process.env.DATABASE_URL;

async function nvidiaEmbed(texts) {
  const payload = JSON.stringify({
    model: 'nvidia/llama-3.2-nv-embedqa-1b-v2',
    input: texts,
    input_type: 'query',
    dimensions: 1536,
  });

  return new Promise((resolve, reject) => {
    const url = new URL(API_URL);
    const opts = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.data) {
            resolve(data.data.map(d => d.embedding));
          } else {
            reject(new Error(`Embedding API error: ${JSON.stringify(data).substring(0, 200)}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function pgInsert(records) {
  const { execSync } = await import('child_process');
  const values = records.map(r => {
    const id = r.id.replace(/'/g, "''");
    const content = r.content.replace(/'/g, "''");
    const metadata = JSON.stringify(r.metadata).replace(/'/g, "''");
    const embeddingStr = `[${r.embedding.join(',')}]`;
    return `('${id}', '${embeddingStr}'::vector, '${content}', '${metadata}'::jsonb, 'intelligence')`;
  });

  const sql = `INSERT INTO vector_embeddings (id, embedding, content, metadata, namespace) VALUES\n${values.join(',\n')}\nON CONFLICT (id) DO UPDATE SET embedding = EXCLUDED.embedding, content = EXCLUDED.content, metadata = EXCLUDED.metadata, updated_at = now();`;

  const tmpFile = path.join(__dirname, '..', 'data', '_tmp_insert.sql');
  fs.writeFileSync(tmpFile, sql);

  try {
    execSync(`psql "${DB_URL}" -f "${tmpFile}"`, { stdio: 'pipe', timeout: 30000 });
    return true;
  } catch (e) {
    console.error(`  DB insert error: ${e.stderr?.toString().substring(0, 200) || e.message}`);
    return false;
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

async function run() {
  const factoids = JSON.parse(fs.readFileSync(FACTOIDS_FILE, 'utf-8'));
  console.log(`Embedding ${factoids.length} actualized factoids...`);

  const startIndex = 100;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < factoids.length; i += EMBED_BATCH_SIZE) {
    const batch = factoids.slice(i, i + EMBED_BATCH_SIZE);
    const texts = batch.map(f => f.text.substring(0, 500));
    const batchNum = Math.floor(i / EMBED_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(factoids.length / EMBED_BATCH_SIZE);

    console.log(`  Batch ${batchNum}/${totalBatches}: embedding ${texts.length} factoids...`);

    try {
      const embeddings = await nvidiaEmbed(texts);

      const records = batch.map((f, j) => ({
        id: `ID#:INTEL-${startIndex + i + j}`,
        embedding: embeddings[j],
        content: f.text.substring(0, 2000),
        metadata: {
          source_type: 'youtube_gauntlet',
          source_url: f.source,
          video_title: f.video,
          directive: f.directive,
          implementation_density: f.density,
          gauntlet_version: '1.0.0',
          processed_at: new Date().toISOString(),
        },
      }));

      const ok = await pgInsert(records);
      if (ok) {
        successCount += batch.length;
        console.log(`    Inserted ${batch.length} embeddings`);
      } else {
        failCount += batch.length;
      }

      await new Promise(r => setTimeout(r, 300));

    } catch (e) {
      console.error(`  Batch ${batchNum} embedding error: ${e.message}`);
      failCount += batch.length;
    }
  }

  console.log(`\n=== VECTORIZATION COMPLETE ===`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`  Total: ${factoids.length}`);
}

run().catch(console.error);
