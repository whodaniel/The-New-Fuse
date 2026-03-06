import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';

const CODEX_SESSIONS_DIR = path.join(os.homedir(), '.codex/sessions');
const OPENCLAW_SESSIONS_DIR = path.join(os.homedir(), '.openclaw/agents/main/sessions');
const SESSIONS_JSON_PATH = path.join(OPENCLAW_SESSIONS_DIR, 'sessions.json');

async function findJsonlFiles(dir) {
  let results = [];
  const list = await fs.readdir(dir, { withFileTypes: true });
  for (const file of list) {
    const res = path.resolve(dir, file.name);
    if (file.isDirectory()) {
      results = results.concat(await findJsonlFiles(res));
    } else if (file.name.endsWith('.jsonl')) {
      results.push(res);
    }
  }
  return results;
}

function convertCodexToOpenClaw(lines) {
  const converted = [];
  let sessionId = null;
  let timestamp = null;
  let cwd = null;

  for (const line of lines) {
    if (!line.trim()) continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch (e) {
      continue;
    }

    if (record.type === 'session_meta') {
      sessionId = record.payload.id;
      timestamp = record.payload.timestamp;
      cwd = record.payload.cwd;
      converted.push({
        type: 'session',
        version: 3,
        id: sessionId,
        timestamp: timestamp,
        cwd: cwd
      });
    } else if (record.type === 'response_item') {
      const payload = record.payload;
      if (payload.type === 'message') {
        const role = payload.role === 'developer' ? 'assistant' : payload.role;
        const content = payload.content.map(c => {
          if (c.type === 'input_text') return { type: 'text', text: c.text };
          if (c.type === 'text') return { type: 'text', text: c.text };
          return c;
        });
        
        converted.push({
          type: 'message',
          id: crypto.randomBytes(4).toString('hex'),
          parentId: converted.length > 1 ? converted[converted.length - 1].id : null,
          timestamp: record.timestamp,
          message: {
            role: role,
            content: content,
            timestamp: new Date(record.timestamp).getTime()
          }
        });
      }
    }
  }

  return { converted, sessionId, timestamp, cwd };
}

async function main() {
  const files = await findJsonlFiles(CODEX_SESSIONS_DIR);
  console.log(`Found ${files.length} Codex session files.`);

  let sessionsJson = {};
  try {
    const raw = await fs.readFile(SESSIONS_JSON_PATH, 'utf-8');
    sessionsJson = JSON.parse(raw);
  } catch (e) {
    console.log('sessions.json not found or invalid, starting fresh.');
  }

  for (const file of files) {
    const raw = await fs.readFile(file, 'utf-8');
    const lines = raw.split('\n');
    const { converted, sessionId, timestamp } = convertCodexToOpenClaw(lines);

    if (!sessionId) {
      console.log(`Skipping ${file}: no session_meta found.`);
      continue;
    }

    const outputFilename = `${sessionId}.jsonl`;
    const outputPath = path.join(OPENCLAW_SESSIONS_DIR, outputFilename);
    
    await fs.writeFile(outputPath, converted.map(obj => JSON.stringify(obj)).join('\n') + '\n');
    console.log(`Converted ${file} -> ${outputPath}`);

    const key = `imported:codex:${sessionId}`;
    if (!sessionsJson[key]) {
      sessionsJson[key] = {
        sessionId: sessionId,
        updatedAt: new Date(timestamp).getTime(),
        provider: 'imported',
        model: 'imported',
        origin: {
          label: 'Codex Import',
          provider: 'codex',
          surface: 'cli'
        }
      };
    }
  }

  await fs.writeFile(SESSIONS_JSON_PATH, JSON.stringify(sessionsJson, null, 2));
  console.log(`Updated ${SESSIONS_JSON_PATH}`);
}

main().catch(console.error);
