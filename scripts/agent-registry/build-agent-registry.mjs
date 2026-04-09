#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function parseFrontMatter(raw) {
  const text = raw.replace(/^\uFEFF/, '');
  if (!text.startsWith('---\n')) return { frontmatter: {}, body: text };
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) return { frontmatter: {}, body: text };

  const fmText = text.slice(4, end);
  const body = text.slice(end + 5).trim();
  const frontmatter = {};
  let currentKey = null;

  for (const line of fmText.split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      const rawValue = kv[2].trim();
      if (!rawValue) {
        frontmatter[currentKey] = [];
      } else if (
        (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
        (rawValue.startsWith("'") && rawValue.endsWith("'"))
      ) {
        frontmatter[currentKey] = rawValue.slice(1, -1);
      } else {
        frontmatter[currentKey] = rawValue;
      }
      continue;
    }

    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem && currentKey) {
      if (!Array.isArray(frontmatter[currentKey])) frontmatter[currentKey] = [];
      frontmatter[currentKey].push(listItem[1].trim());
    }
  }

  return { frontmatter, body };
}

function inferAgentType(id, metadata) {
  const hint = `${id} ${JSON.stringify(metadata || {})}`.toLowerCase();
  if (hint.includes('mcp')) return 'mcp';
  if (hint.includes('api')) return 'api';
  if (hint.includes('gemini') || hint.includes('openai') || hint.includes('external')) return 'external';
  return 'local';
}

function extractCapabilities(body) {
  const lines = body.split(/\r?\n/);
  const capabilities = new Set();
  const tools = new Set();

  for (const line of lines) {
    const bullet = line.match(/^\s*-\s+(.*)$/);
    if (!bullet) continue;
    const item = bullet[1].replace(/[`*]/g, '').trim();
    if (!item) continue;
    if (item.toLowerCase().includes('api') || item.toLowerCase().includes('tool')) {
      tools.add(item);
    } else {
      capabilities.add(item);
    }
  }

  return {
    capabilities: [...capabilities].slice(0, 24),
    inferredTools: [...tools].slice(0, 24),
  };
}

function tokenizeTags(input) {
  return [...new Set(
    input
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter((t) => t.length >= 3 && !['agent', 'the', 'and', 'for', 'with', 'from'].includes(t))
  )];
}

function relationshipScore(a, b) {
  const ta = new Set(a.tags);
  const tb = new Set(b.tags);
  const union = new Set([...ta, ...tb]);
  let intersect = 0;
  for (const t of ta) if (tb.has(t)) intersect += 1;
  if (union.size === 0) return 0;
  return intersect / union.size;
}

async function listJsonFiles(dir) {
  try {
    const files = await fs.readdir(dir);
    return files.filter((f) => f.endsWith('.json')).map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

async function main() {
  const repoRoot = process.cwd();
  const agentsDir = path.join(repoRoot, '.claude', 'agents');
  const externalConfigDir = path.join(repoRoot, 'config', 'ai-agents');
  const outputDir = path.join(repoRoot, 'data', 'agent-registry');

  await fs.mkdir(outputDir, { recursive: true });

  const agentFiles = (await fs.readdir(agentsDir))
    .filter((f) => f.endsWith('.md'))
    .sort();

  const externalFiles = await listJsonFiles(externalConfigDir);
  const agents = [];

  for (const file of agentFiles) {
    const relPath = path.posix.join('.claude', 'agents', file);
    const fullPath = path.join(agentsDir, file);
    const raw = await fs.readFile(fullPath, 'utf8');
    const { frontmatter, body } = parseFrontMatter(raw);

    const id = slugify(path.basename(file, '.md'));
    const tools = Array.isArray(frontmatter.tools) ? frontmatter.tools : [];
    const { capabilities, inferredTools } = extractCapabilities(body);
    const description = frontmatter.description || '';
    const tags = tokenizeTags(`${id} ${description} ${(tools || []).join(' ')} ${capabilities.join(' ')}`);

    agents.push({
      id,
      name: frontmatter.name || id,
      displayName: String(frontmatter.name || id)
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      description,
      agentType: inferAgentType(id, frontmatter),
      sourceFile: relPath,
      tools,
      inferredTools,
      capabilities,
      tags,
      systemPrompt: body,
      status: 'active',
      version: '1.0.0',
    });
  }

  for (const fullPath of externalFiles) {
    const relPath = path.posix.join('config', 'ai-agents', path.basename(fullPath));
    const raw = await fs.readFile(fullPath, 'utf8');
    const parsed = JSON.parse(raw);
    const id = slugify(parsed.name || path.basename(fullPath, '.json'));
    const tags = tokenizeTags(`${parsed.name || ''} ${parsed.description || ''}`);

    agents.push({
      id,
      name: parsed.name || id,
      displayName: parsed.displayName || parsed.name || id,
      description: parsed.description || 'External agent profile',
      agentType: 'external',
      sourceFile: relPath,
      tools: Array.isArray(parsed.tools) ? parsed.tools : [],
      inferredTools: [],
      capabilities: Array.isArray(parsed.capabilities) ? parsed.capabilities : [],
      tags,
      systemPrompt: parsed.systemPrompt || '',
      status: 'active',
      version: parsed.version || '1.0.0',
    });
  }

  const capabilities = [];
  const tags = [];
  const relationships = [];

  for (const a of agents) {
    for (const cap of a.capabilities) {
      capabilities.push({
        id: crypto.randomUUID(),
        agentId: a.id,
        capabilityType: 'domain',
        capabilityName: cap,
        capabilityLevel: 'intermediate',
      });
    }
    for (const t of a.tags) {
      tags.push({
        id: crypto.randomUUID(),
        agentId: a.id,
        tagCategory: 'domain',
        tagName: t,
        confidenceScore: 1.0,
      });
    }
  }

  for (let i = 0; i < agents.length; i += 1) {
    for (let j = i + 1; j < agents.length; j += 1) {
      const a = agents[i];
      const b = agents[j];
      const score = relationshipScore(a, b);
      if (score < 0.25) continue;
      relationships.push({
        id: crypto.randomUUID(),
        agentId: a.id,
        relatedAgentId: b.id,
        relationshipType: 'similar',
        strengthScore: Number(score.toFixed(2)),
      });
    }
  }

  const schemaSql = `-- Agent Registry bootstrap schema (PostgreSQL compatible)
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT,
  description TEXT,
  system_prompt TEXT,
  agent_type TEXT NOT NULL DEFAULT 'local',
  source_file TEXT,
  version TEXT DEFAULT '1.0.0',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_capabilities (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  capability_type TEXT NOT NULL,
  capability_name TEXT NOT NULL,
  capability_level TEXT DEFAULT 'intermediate'
);

CREATE TABLE IF NOT EXISTS agent_relationships (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  related_agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  strength_score NUMERIC(3,2) DEFAULT 0.50
);

CREATE TABLE IF NOT EXISTS agent_tags (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  tag_category TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  confidence_score NUMERIC(3,2) DEFAULT 1.00
);`;

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      agents: agents.length,
      capabilities: capabilities.length,
      relationships: relationships.length,
      tags: tags.length,
      byType: agents.reduce((acc, a) => {
        acc[a.agentType] = (acc[a.agentType] || 0) + 1;
        return acc;
      }, {}),
    },
  };

  await fs.writeFile(path.join(outputDir, 'agents.json'), JSON.stringify(agents, null, 2) + '\n');
  await fs.writeFile(
    path.join(outputDir, 'agent_capabilities.json'),
    JSON.stringify(capabilities, null, 2) + '\n'
  );
  await fs.writeFile(
    path.join(outputDir, 'agent_relationships.json'),
    JSON.stringify(relationships, null, 2) + '\n'
  );
  await fs.writeFile(path.join(outputDir, 'agent_tags.json'), JSON.stringify(tags, null, 2) + '\n');
  await fs.writeFile(path.join(outputDir, 'schema.sql'), `${schemaSql}\n`);
  await fs.writeFile(path.join(outputDir, 'registry_summary.json'), JSON.stringify(report, null, 2) + '\n');

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
