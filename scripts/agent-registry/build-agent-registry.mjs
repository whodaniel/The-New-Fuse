#!/usr/bin/env node
/* eslint-disable no-console */
import { promises as fs } from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

const CORE_SCHEMA_VERSION = '2.0.0';
const DEFAULT_OUTPUT = 'data/agent-registry';

const SOURCE_DEFS = [
  {
    id: 'tnf_agents_md',
    kind: 'markdown',
    relDir: '.agent/agents',
    ext: '.md',
    priority: 400,
  },
  {
    id: 'claude_agents_md',
    kind: 'markdown',
    relDir: '.claude/agents',
    ext: '.md',
    priority: 300,
  },
  {
    id: 'tnf_ai_agents_json',
    kind: 'json',
    relDir: 'config/ai-agents',
    ext: '.json',
    priority: 200,
  },
  {
    id: 'legacy_agents_json',
    kind: 'json',
    relDir: 'config/agents',
    ext: '.json',
    priority: 100,
  },
];

const TYPE_NORMALIZATION = {
  agent: 'external',
  local: 'local',
  external: 'external',
  api: 'api',
  mcp: 'mcp',
  generic: 'local',
};

const CATEGORY_KEYWORDS = {
  orchestration: ['orchestrator', 'registry', 'delegate', 'coordination', 'workflow', 'router'],
  engineering: ['frontend', 'backend', 'api', 'debug', 'database', 'devops', 'test', 'code'],
  security: ['security', 'vulnerability', 'pentest', 'red-team', 'auth', 'threat', 'compliance'],
  content: ['content', 'writer', 'calendar', 'copy', 'blog', 'keyword', 'seo'],
  social: ['instagram', 'tiktok', 'facebook', 'x ', 'social', 'youtube'],
  marketing: ['marketing', 'campaign', 'funnel', 'audience', 'lead', 'affiliate', 'brand'],
  media: ['podcast', 'audio', 'video', 'stream', 'storyboard'],
  operations: ['support', 'finance', 'tax', 'legal', 'customer', 'onboarding'],
};

const HIGH_RISK_KEYWORDS = [
  'pentest',
  'sqlmap',
  'xss',
  'idor',
  'fuzzing',
  'red-team',
  'exploit',
  'vulnerability',
];

const MEDIUM_RISK_KEYWORDS = ['security', 'auth', 'compliance', 'legal', 'tax', 'privacy'];

function parseArgs(argv) {
  const out = {
    outputDir: DEFAULT_OUTPUT,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if ((arg === '--out' || arg === '--output') && argv[i + 1]) {
      out.outputDir = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function parseFrontmatter(raw) {
  const text = raw.replace(/^\uFEFF/, '');
  if (!text.startsWith('---\n')) return { fm: {}, body: text.trim() };
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) return { fm: {}, body: text.trim() };
  const fmText = text.slice(4, end);
  const body = text.slice(end + 5).trim();
  try {
    const parsed = parseYaml(fmText) || {};
    return { fm: parsed, body };
  } catch {
    return { fm: {}, body };
  }
}

function asArray(input) {
  if (Array.isArray(input)) return input;
  if (input === null || input === undefined || input === '') return [];
  return [input];
}

function asString(input) {
  if (typeof input === 'string') return input.trim();
  if (input === null || input === undefined) return '';
  if (Array.isArray(input)) return input.join(' ').trim();
  if (typeof input === 'object') return JSON.stringify(input);
  return String(input).trim();
}

function normalizeName(input, fallback) {
  const value = asString(input);
  return value || fallback;
}

function normalizeDisplayName(input, fallback) {
  const value = asString(input);
  if (value) return value;
  return fallback
    .split('-')
    .map((w) => (w ? `${w[0].toUpperCase()}${w.slice(1)}` : ''))
    .join(' ');
}

function normalizeToolName(tool) {
  if (typeof tool === 'string') return tool.trim();
  if (tool && typeof tool === 'object') {
    return asString(tool.name || tool.id || tool.tool || tool.toolName);
  }
  return '';
}

function normalizeCapabilityName(capability) {
  if (typeof capability === 'string') return capability.trim();
  if (capability && typeof capability === 'object') {
    return asString(
      capability.name ||
        capability.id ||
        capability.capability ||
        capability.title ||
        capability.description
    );
  }
  return '';
}

function normalizeTag(tag) {
  return slugify(tag).replace(/-/g, '_');
}

function uniqStrings(values) {
  const out = [];
  const seen = new Set();
  for (const value of values) {
    const normalized = asString(value);
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function extractBulletCapabilities(body) {
  const out = [];
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(/^\s*-\s+(.*)$/);
    if (!match) continue;
    const value = match[1].replace(/[`*]/g, '').trim();
    if (value.length < 3) continue;
    out.push(value);
  }
  return uniqStrings(out).slice(0, 30);
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function inferAgentType(hints) {
  for (const hint of hints) {
    const key = slugify(asString(hint));
    if (!key) continue;
    if (TYPE_NORMALIZATION[key]) return TYPE_NORMALIZATION[key];
  }

  const text = hints.map((h) => asString(h).toLowerCase()).join(' ');
  if (text.includes('mcp')) return 'mcp';
  if (text.includes('api') || text.includes('endpoint')) return 'api';
  if (text.includes('external') || text.includes('gemini') || text.includes('openai')) return 'external';
  return 'local';
}

function inferCategoriesFromText(text) {
  const categories = [];
  const normalized = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      categories.push(category);
    }
  }
  return categories.length ? categories : ['general'];
}

function inferRiskTier(text) {
  const normalized = text.toLowerCase();
  if (HIGH_RISK_KEYWORDS.some((kw) => normalized.includes(kw))) return 'high';
  if (MEDIUM_RISK_KEYWORDS.some((kw) => normalized.includes(kw))) return 'medium';
  return 'low';
}

function inferComplexity({ capabilitiesCount, toolsCount, categories }) {
  if (categories.includes('orchestration') || capabilitiesCount >= 10 || toolsCount >= 8) return 'high';
  if (capabilitiesCount >= 4 || toolsCount >= 3) return 'medium';
  return 'low';
}

function jaccard(setA, setB) {
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  let intersect = 0;
  for (const value of setA) {
    if (setB.has(value)) intersect += 1;
  }
  return intersect / union.size;
}

function stableId(...parts) {
  const hash = crypto.createHash('sha256');
  for (const part of parts) {
    hash.update(String(part));
    hash.update('\x1f');
  }
  const hex = hash.digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

async function listFiles(rootDir, ext) {
  try {
    const entries = await fs.readdir(rootDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(ext))
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

function buildAgentCardSchema() {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://thenewfuse.com/schemas/agent-card.schema.json',
    title: 'TNF AgentCard',
    type: 'object',
    required: [
      'schemaVersion',
      'id',
      'name',
      'displayName',
      'agentType',
      'status',
      'sourceFile',
      'categoriesNormalized',
      'classification',
    ],
    properties: {
      schemaVersion: { type: 'string' },
      id: { type: 'string' },
      name: { type: 'string' },
      displayName: { type: 'string' },
      description: { type: 'string' },
      agentType: { type: 'string', enum: ['local', 'external', 'api', 'mcp'] },
      status: { type: 'string' },
      version: { type: 'string' },
      sourceFile: { type: 'string' },
      sourceVariants: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            sourceId: { type: 'string' },
            sourceFile: { type: 'string' },
            name: { type: 'string' },
          },
          required: ['sourceId', 'sourceFile'],
        },
      },
      tools: { type: 'array', items: { type: 'string' } },
      inferredTools: { type: 'array', items: { type: 'string' } },
      skills: { type: 'array', items: { type: 'string' } },
      capabilities: { type: 'array', items: { type: 'string' } },
      tags: { type: 'array', items: { type: 'string' } },
      categoriesNormalized: { type: 'array', items: { type: 'string' } },
      categoriesRaw: { type: 'array', items: { type: 'string' } },
      unknownTags: { type: 'array', items: { type: 'string' } },
      classification: {
        type: 'object',
        required: ['domain', 'workflowStage', 'complexity', 'riskTier'],
        properties: {
          domain: { type: 'array', items: { type: 'string' } },
          workflowStage: { type: 'array', items: { type: 'string' } },
          complexity: { type: 'string' },
          riskTier: { type: 'string' },
        },
      },
      metadata: {
        type: 'object',
        properties: {
          tnf: { type: 'object' },
          extensions: { type: 'object' },
        },
      },
    },
    additionalProperties: true,
  };
}

function inferWorkflowStages(text) {
  const lower = text.toLowerCase();
  const stages = [];
  if (/(discover|research|analy[sz]e|audit|scan)/.test(lower)) stages.push('discovery');
  if (/(plan|architect|design|strategy|roadmap)/.test(lower)) stages.push('planning');
  if (/(build|implement|execute|deploy|run|manage)/.test(lower)) stages.push('execution');
  if (/(monitor|report|measure|track|optimi[sz]e)/.test(lower)) stages.push('optimization');
  if (/(govern|policy|compliance|risk|taxonomy)/.test(lower)) stages.push('governance');
  return stages.length ? stages : ['execution'];
}

async function readSourceVariants(repoRoot) {
  const variants = [];
  const errors = [];

  for (const source of SOURCE_DEFS) {
    const absDir = path.join(repoRoot, source.relDir);
    const files = await listFiles(absDir, source.ext);

    for (const filename of files) {
      const absPath = path.join(absDir, filename);
      const relPath = path.posix.join(source.relDir.replace(/\\/g, '/'), filename);
      try {
        const raw = await fs.readFile(absPath, 'utf8');
        if (source.kind === 'markdown') {
          const { fm, body } = parseFrontmatter(raw);
          const id = slugify(fm.id || fm.name || path.basename(filename, '.md'));
          if (!id) continue;
          const tools = uniqStrings(asArray(fm.tools).map(normalizeToolName));
          const skills = uniqStrings(asArray(fm.skills).map(asString));
          const explicitCapabilities = uniqStrings(
            asArray(fm.capabilities).map(normalizeCapabilityName)
          );
          const bulletCapabilities = extractBulletCapabilities(body);
          const capabilities = uniqStrings([...explicitCapabilities, ...bulletCapabilities]).slice(0, 40);
          const description = asString(fm.description);
          const tagHints = [
            ...asArray(fm.tags),
            ...asArray(fm.keywords),
            ...skills,
            ...tools,
            ...capabilities,
          ];
          const tags = uniqStrings(tagHints.map(normalizeTag).filter(Boolean));

          variants.push({
            id,
            sourceId: source.id,
            sourcePriority: source.priority,
            sourceFile: relPath,
            name: normalizeName(fm.name, id),
            displayName: normalizeDisplayName(fm.displayName || fm.name, id),
            description,
            systemPrompt: body,
            tools,
            skills,
            capabilities,
            tags,
            categoriesRaw: uniqStrings(asArray(fm.category || fm.categories).map(asString)),
            version: asString(fm.version || '1.0.0') || '1.0.0',
            status: asString(fm.status || 'active') || 'active',
            typeHint: asString(fm.agentType || fm.type || fm.provider),
            rawMetadata: {
              frontmatter: fm,
            },
          });
        } else {
          const parsed = JSON.parse(raw);
          const id = slugify(parsed.id || parsed.name || parsed.displayName || path.basename(filename, '.json'));
          if (!id) continue;

          const tools = uniqStrings(asArray(parsed.tools).map(normalizeToolName));
          const capabilities = uniqStrings(
            asArray(parsed.capabilities).map(normalizeCapabilityName)
          );
          const skills = uniqStrings(asArray(parsed.skills).map(asString));
          const traitTags = uniqStrings(asArray(parsed.traits).map(normalizeTag));
          const abilityTags = uniqStrings(asArray(parsed.abilities).map(normalizeTag));
          const explicitTags = uniqStrings(asArray(parsed.tags).map(normalizeTag));
          const tags = uniqStrings([...explicitTags, ...traitTags, ...abilityTags]);

          variants.push({
            id,
            sourceId: source.id,
            sourcePriority: source.priority,
            sourceFile: relPath,
            name: normalizeName(parsed.name, id),
            displayName: normalizeDisplayName(parsed.displayName || parsed.name, id),
            description: asString(parsed.description),
            systemPrompt: asString(parsed.systemPrompt || ''),
            tools,
            skills,
            capabilities,
            tags,
            categoriesRaw: uniqStrings(asArray(parsed.category || parsed.categories).map(asString)),
            version: asString(parsed.version || parsed?.metadata?.version || '1.0.0') || '1.0.0',
            status: asString(parsed.status || parsed.state || 'active') || 'active',
            typeHint: asString(parsed.agentType || parsed.type || parsed.provider),
            rawMetadata: {
              provider: parsed.provider || null,
              metadata: parsed.metadata || null,
              configuration: parsed.configuration || null,
            },
          });
        }
      } catch (error) {
        errors.push({
          sourceId: source.id,
          sourceFile: relPath,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return { variants, errors };
}

function choosePrimaryVariant(variants) {
  const sorted = [...variants].sort((a, b) => {
    if (b.sourcePriority !== a.sourcePriority) return b.sourcePriority - a.sourcePriority;
    const aInfo = (a.description?.length || 0) + (a.systemPrompt?.length || 0);
    const bInfo = (b.description?.length || 0) + (b.systemPrompt?.length || 0);
    if (bInfo !== aInfo) return bInfo - aInfo;
    return a.sourceFile.localeCompare(b.sourceFile);
  });
  return sorted[0];
}

function mergeVariantsToCards(variants) {
  const byId = new Map();
  for (const variant of variants) {
    if (!byId.has(variant.id)) byId.set(variant.id, []);
    byId.get(variant.id).push(variant);
  }

  const cards = [];
  const collisions = [];
  const taxonomyCandidates = {
    unknownTags: new Map(),
    unknownCategories: new Map(),
  };

  const knownCategorySet = new Set([...Object.keys(CATEGORY_KEYWORDS), 'general']);

  for (const [id, group] of Array.from(byId.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    if (group.length > 1) {
      collisions.push({
        id,
        variants: group.map((entry) => ({ sourceId: entry.sourceId, sourceFile: entry.sourceFile })),
      });
    }

    const primary = choosePrimaryVariant(group);
    const allTools = uniqStrings(group.flatMap((entry) => entry.tools));
    const allSkills = uniqStrings(group.flatMap((entry) => entry.skills));
    const allCapabilities = uniqStrings(group.flatMap((entry) => entry.capabilities));
    const allTagsRaw = uniqStrings(group.flatMap((entry) => entry.tags));

    const description = uniqStrings(group.map((entry) => entry.description))
      .sort((a, b) => b.length - a.length)[0] || '';
    const systemPrompt = uniqStrings(group.map((entry) => entry.systemPrompt))
      .sort((a, b) => b.length - a.length)[0] || '';

    const mergedText = `${id} ${description} ${allTagsRaw.join(' ')} ${allCapabilities.join(' ')}`.trim();
    const inferredCategories = inferCategoriesFromText(mergedText);
    const categoriesRaw = uniqStrings(group.flatMap((entry) => entry.categoriesRaw));
    const categoriesNormalized = uniqStrings([
      ...categoriesRaw.map((value) => slugify(value)),
      ...inferredCategories,
    ]).map((value) => value || 'general');

    const unknownCategories = categoriesNormalized.filter((category) => !knownCategorySet.has(category));
    for (const category of unknownCategories) {
      taxonomyCandidates.unknownCategories.set(
        category,
        (taxonomyCandidates.unknownCategories.get(category) || 0) + 1
      );
    }

    const knownTagVocabulary = new Set([
      ...Object.values(CATEGORY_KEYWORDS).flatMap((values) => values.map((value) => normalizeTag(value))),
      ...Object.keys(CATEGORY_KEYWORDS).map((key) => normalizeTag(key)),
      ...categoriesNormalized.map((c) => normalizeTag(c)),
    ]);
    const unknownTags = [];
    for (const tag of allTagsRaw) {
      if (knownTagVocabulary.has(normalizeTag(tag))) continue;
      if (tag.length < 4) continue;
      unknownTags.push(tag);
      taxonomyCandidates.unknownTags.set(tag, (taxonomyCandidates.unknownTags.get(tag) || 0) + 1);
    }

    const riskTier = inferRiskTier(mergedText);
    const workflowStage = inferWorkflowStages(mergedText);
    const complexity = inferComplexity({
      capabilitiesCount: allCapabilities.length,
      toolsCount: allTools.length,
      categories: categoriesNormalized,
    });

    const typeHints = [
      primary.typeHint,
      ...group.map((entry) => entry.typeHint),
      categoriesNormalized.join(' '),
      mergedText,
    ];
    const agentType = inferAgentType(typeHints);

    const inferredTools = allCapabilities
      .filter((capability) => /api|tool|cli|mcp|sdk/i.test(capability))
      .slice(0, 24);

    cards.push({
      schemaVersion: CORE_SCHEMA_VERSION,
      id,
      tnfId: id,
      name: primary.name || id,
      displayName: primary.displayName || normalizeDisplayName('', id),
      description,
      agentType,
      accessLevel: 'user',
      isSystem: categoriesNormalized.includes('orchestration'),
      sourceFile: primary.sourceFile,
      sourceVariants: group.map((entry) => ({
        sourceId: entry.sourceId,
        sourceFile: entry.sourceFile,
        name: entry.name,
      })),
      tools: allTools,
      inferredTools,
      skills: allSkills,
      capabilities: allCapabilities,
      tags: allTagsRaw,
      categoriesNormalized: categoriesNormalized.length ? categoriesNormalized : ['general'],
      categoriesRaw,
      unknownTags: uniqStrings(unknownTags).slice(0, 25),
      classification: {
        domain: categoriesNormalized.length ? categoriesNormalized : ['general'],
        workflowStage,
        complexity,
        riskTier,
      },
      systemPrompt,
      personaSource: primary.sourceId,
      status: primary.status || 'active',
      version: primary.version || '1.0.0',
      mcpIds: [],
      metadata: {
        tnf: {
          schemaVersion: CORE_SCHEMA_VERSION,
          canonical: true,
          sourcePriority: primary.sourcePriority,
          variantCount: group.length,
          rawSources: group.map((entry) => entry.sourceId),
        },
        extensions: {
          'com.tnf.agentCard': {
            unknownTags: uniqStrings(unknownTags).slice(0, 25),
            unknownCategories,
            rawMetadata: group.map((entry) => ({
              sourceId: entry.sourceId,
              sourceFile: entry.sourceFile,
              metadata: entry.rawMetadata,
            })),
          },
        },
      },
    });
  }

  return {
    cards: cards.sort((a, b) => a.id.localeCompare(b.id)),
    collisions,
    taxonomyCandidates: {
      unknownTags: Array.from(taxonomyCandidates.unknownTags.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([value, count]) => ({ value, count })),
      unknownCategories: Array.from(taxonomyCandidates.unknownCategories.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([value, count]) => ({ value, count })),
    },
  };
}

function buildCapabilities(cards) {
  const out = [];
  for (const card of cards) {
    for (const capability of card.capabilities) {
      out.push({
        id: stableId('capability', card.id, 'explicit', capability.toLowerCase()),
        agentId: card.id,
        capabilityType: 'explicit',
        capabilityName: capability,
        capabilityLevel: card.classification.complexity === 'high' ? 'advanced' : 'intermediate',
      });
    }
    for (const category of card.categoriesNormalized) {
      out.push({
        id: stableId('capability', card.id, 'domain', category),
        agentId: card.id,
        capabilityType: 'domain',
        capabilityName: category,
        capabilityLevel: 'intermediate',
      });
    }
  }
  return out;
}

function buildTags(cards) {
  const out = [];
  for (const card of cards) {
    for (const tag of card.tags) {
      out.push({
        id: stableId('tag', card.id, 'keyword', tag.toLowerCase()),
        agentId: card.id,
        tagCategory: card.categoriesNormalized.includes(tag) ? 'domain' : 'keyword',
        tagName: tag,
        confidenceScore: 1.0,
      });
    }
    for (const category of card.categoriesNormalized) {
      out.push({
        id: stableId('tag', card.id, 'normalized_category', category),
        agentId: card.id,
        tagCategory: 'normalized_category',
        tagName: category,
        confidenceScore: 1.0,
      });
    }
  }
  return out;
}

function buildRelationships(cards) {
  const candidates = [];
  for (let i = 0; i < cards.length; i += 1) {
    for (let j = i + 1; j < cards.length; j += 1) {
      const a = cards[i];
      const b = cards[j];
      const setA = new Set([...a.tags, ...a.categoriesNormalized]);
      const setB = new Set([...b.tags, ...b.categoriesNormalized]);
      const score = jaccard(setA, setB);
      if (score < 0.22) continue;
      candidates.push({
        source: a.id,
        target: b.id,
        score,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.source.localeCompare(b.source));
  const maxPerNode = 10;
  const nodeCounts = new Map();
  const out = [];
  for (const candidate of candidates) {
    const aCount = nodeCounts.get(candidate.source) || 0;
    const bCount = nodeCounts.get(candidate.target) || 0;
    if (aCount >= maxPerNode || bCount >= maxPerNode) continue;
    nodeCounts.set(candidate.source, aCount + 1);
    nodeCounts.set(candidate.target, bCount + 1);
    out.push({
      id: stableId('relationship', candidate.source, candidate.target, candidate.score.toFixed(4)),
      agentId: candidate.source,
      relatedAgentId: candidate.target,
      relationshipType: 'similar',
      strengthScore: Number(candidate.score.toFixed(2)),
    });
  }
  return out;
}

function buildSchemaSql() {
  return `-- Agent Registry bootstrap schema (PostgreSQL compatible)
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT,
  description TEXT,
  system_prompt TEXT,
  agent_type TEXT NOT NULL DEFAULT 'local',
  source_file TEXT,
  categories_normalized TEXT[] DEFAULT '{}',
  classification JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
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
);
`;
}

function buildRegistrySummary({ cards, capabilities, tags, relationships, variants, collisions, errors, taxonomyCandidates }) {
  const byType = cards.reduce((acc, card) => {
    acc[card.agentType] = (acc[card.agentType] || 0) + 1;
    return acc;
  }, {});

  const byCategory = cards.reduce((acc, card) => {
    for (const category of card.categoriesNormalized) {
      acc[category] = (acc[category] || 0) + 1;
    }
    return acc;
  }, {});

  const bySource = variants.reduce((acc, variant) => {
    acc[variant.sourceId] = (acc[variant.sourceId] || 0) + 1;
    return acc;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    schemaVersion: CORE_SCHEMA_VERSION,
    totals: {
      agents: cards.length,
      variants: variants.length,
      capabilities: capabilities.length,
      relationships: relationships.length,
      tags: tags.length,
      collisions: collisions.length,
      parseErrors: errors.length,
      byType,
      byCategory,
      bySource,
    },
    taxonomyCandidates,
    collisions,
    parseErrors: errors,
  };
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function ensureDir(absDir) {
  await fs.mkdir(absDir, { recursive: true });
}

async function main() {
  const args = parseArgs(process.argv);
  const repoRoot = process.cwd();
  const outputDir = path.resolve(repoRoot, args.outputDir);
  await ensureDir(outputDir);

  const { variants, errors } = await readSourceVariants(repoRoot);
  const { cards, collisions, taxonomyCandidates } = mergeVariantsToCards(variants);
  const capabilities = buildCapabilities(cards);
  const tags = buildTags(cards);
  const relationships = buildRelationships(cards);

  const agents = cards.map((card) => ({
    id: card.id,
    tnfId: card.tnfId,
    name: card.name,
    displayName: card.displayName,
    description: card.description,
    agentType: card.agentType,
    sourceFile: card.sourceFile,
    tools: card.tools,
    inferredTools: card.inferredTools,
    skills: card.skills,
    capabilities: card.capabilities,
    tags: card.tags,
    categoriesNormalized: card.categoriesNormalized,
    categoriesRaw: card.categoriesRaw,
    unknownTags: card.unknownTags,
    classification: card.classification,
    systemPrompt: card.systemPrompt,
    status: card.status,
    version: card.version,
    personaSource: card.personaSource,
    metadata: card.metadata,
  }));

  const masterUserAgents = agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    displayName: agent.displayName,
    description: agent.description,
    agentType: agent.agentType,
    tags: agent.tags,
    tools: agent.tools,
    skills: agent.skills,
    capabilities: agent.capabilities,
    sourceFile: agent.sourceFile,
    status: agent.status,
    categoriesNormalized: agent.categoriesNormalized,
    classification: agent.classification,
    metadata: agent.metadata,
  }));

  const summary = buildRegistrySummary({
    cards,
    capabilities,
    tags,
    relationships,
    variants,
    collisions,
    errors,
    taxonomyCandidates,
  });

  await writeJson(path.join(outputDir, 'agent-card.schema.json'), buildAgentCardSchema());
  await writeJson(path.join(outputDir, 'agent-cards.json'), cards);
  await writeJson(path.join(outputDir, 'agents.json'), agents);
  await writeJson(path.join(outputDir, 'master_user_agents.json'), masterUserAgents);
  await writeJson(path.join(outputDir, 'agent_capabilities.json'), capabilities);
  await writeJson(path.join(outputDir, 'agent_tags.json'), tags);
  await writeJson(path.join(outputDir, 'agent_relationships.json'), relationships);
  await writeJson(path.join(outputDir, 'registry_summary.json'), summary);
  await fs.writeFile(path.join(outputDir, 'schema.sql'), `${buildSchemaSql()}\n`, 'utf8');

  console.log(
    JSON.stringify(
      {
        ok: true,
        outputDir: path.relative(repoRoot, outputDir),
        totals: summary.totals,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
