#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '../..');
const DEFAULT_OUTPUT_DIR = path.join(ROOT, 'data/agent-registry');

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { outputDir: DEFAULT_OUTPUT_DIR };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out' && i + 1 < args.length) {
      result.outputDir = path.resolve(args[i + 1]);
      i++;
    }
  }
  return result;
}

async function findAgentFiles() {
  const patterns = [
    'packages/**/agents/*.md',
    '.agent/agents/*.md',
    'apps/**/agents/*.md',
  ];
  const files = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, { cwd: ROOT, absolute: true });
    files.push(...matches);
  }
  return files;
}

async function parseAgentFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const agent = {
    id: '',
    name: '',
    description: '',
    department: '',
    category: '',
    capabilities: [],
    tags: [],
    relationships: [],
    sourceFile: path.relative(ROOT, filePath),
  };

  let inFrontmatter = false;
  let frontmatterEnd = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (i === 0 && line === '---') {
      inFrontmatter = true;
      continue;
    }
    if (inFrontmatter) {
      if (line === '---') {
        frontmatterEnd = i;
        break;
      }
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      const k = key.trim().toLowerCase();
      if (k === 'id') agent.id = value.replace(/^["']|["']$/g, '');
      else if (k === 'name') agent.name = value.replace(/^["']|["']$/g, '');
      else if (k === 'description') agent.description = value.replace(/^["']|["']$/g, '');
      else if (k === 'department') agent.department = value.replace(/^["']|["']$/g, '');
      else if (k === 'category') agent.category = value.replace(/^["']|["']$/g, '');
      else if (k === 'capabilities') {
        try {
          agent.capabilities = JSON.parse(value);
        } catch {
          agent.capabilities = value.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        }
      }
      else if (k === 'tags') {
        try {
          agent.tags = JSON.parse(value);
        } catch {
          agent.tags = value.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        }
      }
      else if (k === 'relationships') {
        try {
          agent.relationships = JSON.parse(value);
        } catch {
          agent.relationships = value.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        }
      }
    }
  }

  if (!agent.id) {
    agent.id = path.basename(filePath, '.md').toLowerCase().replace(/[^a-z0-9]/g, '-');
  }
  if (!agent.name) {
    agent.name = agent.id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  return agent;
}

async function main() {
  const { outputDir } = parseArgs();
  
  console.log(`[build-agent-registry] Scanning for agent files...`);
  const agentFiles = await findAgentFiles();
  console.log(`[build-agent-registry] Found ${agentFiles.length} agent files`);

  const agents = [];
  const capabilities = new Map();
  const tags = new Map();
  const relationships = [];

  for (const file of agentFiles) {
    try {
      const agent = await parseAgentFile(file);
      agents.push(agent);
      
      for (const cap of agent.capabilities) {
        if (!capabilities.has(cap)) capabilities.set(cap, []);
        capabilities.get(cap).push(agent.id);
      }
      for (const tag of agent.tags) {
        if (!tags.has(tag)) tags.set(tag, []);
        tags.get(tag).push(agent.id);
      }
      for (const rel of agent.relationships) {
        relationships.push({ from: agent.id, to: rel, type: 'related' });
      }
    } catch (err) {
      console.warn(`[build-agent-registry] Failed to parse ${file}:`, err.message);
    }
  }

  await fs.mkdir(outputDir, { recursive: true });

  const timestamp = new Date().toISOString();

  // 1. agents.json
  await fs.writeFile(
    path.join(outputDir, 'agents.json'),
    JSON.stringify({ agents, generatedAt: timestamp, count: agents.length }, null, 2)
  );

  // 2. agent_capabilities.json
  const capObj = {};
  for (const [cap, agentIds] of capabilities) {
    capObj[cap] = agentIds;
  }
  await fs.writeFile(
    path.join(outputDir, 'agent_capabilities.json'),
    JSON.stringify({ capabilities: capObj, generatedAt: timestamp }, null, 2)
  );

  // 3. agent_tags.json
  const tagObj = {};
  for (const [tag, agentIds] of tags) {
    tagObj[tag] = agentIds;
  }
  await fs.writeFile(
    path.join(outputDir, 'agent_tags.json'),
    JSON.stringify({ tags: tagObj, generatedAt: timestamp }, null, 2)
  );

  // 4. agent_relationships.json
  await fs.writeFile(
    path.join(outputDir, 'agent_relationships.json'),
    JSON.stringify({ relationships, generatedAt: timestamp }, null, 2)
  );

  // 5. registry_summary.json
  const departments = new Set();
  const categories = new Set();
  for (const a of agents) {
    if (a.department) departments.add(a.department);
    if (a.category) categories.add(a.category);
  }
  await fs.writeFile(
    path.join(outputDir, 'registry_summary.json'),
    JSON.stringify({
      totalAgents: agents.length,
      totalCapabilities: capabilities.size,
      totalTags: tags.size,
      totalRelationships: relationships.length,
      departments: Array.from(departments).sort(),
      categories: Array.from(categories).sort(),
      generatedAt: timestamp,
    }, null, 2)
  );

  // 6. master_user_agents.json
  const userAgents = agents.map(a => ({
    id: a.id,
    name: a.name,
    description: a.description,
    department: a.department,
    category: a.category,
    capabilities: a.capabilities,
    tags: a.tags,
  }));
  await fs.writeFile(
    path.join(outputDir, 'master_user_agents.json'),
    JSON.stringify({ agents: userAgents, generatedAt: timestamp }, null, 2)
  );

  // 7. agent-cards.json
  const agentCards = agents.map(a => ({
    id: a.id,
    name: a.name,
    description: a.description,
    department: a.department,
    category: a.category,
    capabilities: a.capabilities,
    tags: a.tags,
    relationships: a.relationships,
    sourceFile: a.sourceFile,
  }));
  await fs.writeFile(
    path.join(outputDir, 'agent-cards.json'),
    JSON.stringify({ agentCards, generatedAt: timestamp }, null, 2)
  );

  // 8. agent-card.schema.json
  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    required: ['id', 'name'],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      department: { type: 'string' },
      category: { type: 'string' },
      capabilities: { type: 'array', items: { type: 'string' } },
      tags: { type: 'array', items: { type: 'string' } },
      relationships: { type: 'array', items: { type: 'string' } },
      sourceFile: { type: 'string' },
    },
    additionalProperties: false,
  };
  await fs.writeFile(
    path.join(outputDir, 'agent-card.schema.json'),
    JSON.stringify(schema, null, 2)
  );

  // 9. schema.sql
  const sql = `-- Agent Registry Schema
-- Generated at ${timestamp}

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  department TEXT,
  category TEXT,
  source_file TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS capabilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS agent_capabilities (
  agent_id TEXT REFERENCES agents(id),
  capability_id TEXT REFERENCES capabilities(id),
  PRIMARY KEY (agent_id, capability_id)
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS agent_tags (
  agent_id TEXT REFERENCES agents(id),
  tag_id TEXT REFERENCES tags(id),
  PRIMARY KEY (agent_id, tag_id)
);

CREATE TABLE IF NOT EXISTS relationships (
  from_agent_id TEXT REFERENCES agents(id),
  to_agent_id TEXT REFERENCES agents(id),
  type TEXT,
  PRIMARY KEY (from_agent_id, to_agent_id, type)
);`;
  await fs.writeFile(
    path.join(outputDir, 'schema.sql'),
    sql
  );

  console.log(`[build-agent-registry] Generated 9 canonical files in ${outputDir}`);
}

main().catch(err => {
  console.error('[build-agent-registry] Fatal error:', err);
  process.exit(1);
});
