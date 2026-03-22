import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const outputPath = path.join(root, 'apps', 'frontend', 'src', 'data', 'agent-visual-profiles.json');

const STYLE_SYSTEM = {
  modelTarget: 'Gemini Nano Banana 2',
  styleName: 'Future Retro Ultra Realistic Humanoids',
  promptPrefix:
    'Future-retro ultra realistic humanoid portrait, premium cinematic science-fiction editorial photography, chest-up composition, 1:1 profile image framing, expressive face with lived-in character, tactile analog-meets-cybernetic wardrobe, photoreal skin texture, subtle retro-futurist hardware, badge-ready negative space, dramatic but clean studio lighting, grounded realism, no cartoon styling, no text in image.',
  renderNotes: [
    'Square portrait crop',
    'Centered character with clean silhouette',
    'Readable at thumbnail size',
    'Leave subtle chest and shoulder space for future TNF badge overlays',
    'Ultra-detailed materials, eyes, and facial expression',
  ],
  negativePrompt:
    'no typography, no watermark, no UI, no duplicate limbs, no extra fingers, no distorted anatomy, no low detail, no blurry face, no cartoon proportions, no flat vector look, no cluttered background',
  badgeSystem:
    'Each profile should preserve room for four UI badges: domain, role, specialty, and trust marker.',
};

const NOISE_TOKENS = new Set([
  'a',
  'an',
  'and',
  'api',
  'as',
  'be',
  'for',
  'from',
  'in',
  'into',
  'it',
  'its',
  'like',
  'must',
  'of',
  'on',
  'or',
  'read',
  'grep',
  'glob',
  'bash',
  'write',
  'edit',
  'agent',
  'that',
  'the',
  'this',
  'to',
  'used',
  'use',
  'when',
  'with',
]);

const THEME_RULES = [
  {
    id: 'orchestration-commander',
    keywords: ['orchestrator', 'workflow', 'planner', 'coordination', 'router', 'master'],
    role: 'orchestration commander',
    palette: ['royal blue', 'white gold', 'graphite'],
    wardrobe: 'command mantle with polished tactical detailing and luminous trim',
    environment: 'operations deck with floating workflow constellations',
    motifs: ['node constellations', 'route lines', 'command seals'],
    expression: 'strategic, decisive, composed',
    badgeSeeds: ['Orchestration', 'Command', 'Coordination'],
  },
  {
    id: 'optimization-scientist',
    keywords: ['optimizer', 'optimization', 'benchmark', 'viability', 'experiment', 'cro'],
    role: 'optimization scientist',
    palette: ['violet', 'cyan', 'silver'],
    wardrobe: 'precision lab coat with premium technical tailoring and signal filaments',
    environment: 'experimentation chamber with metric walls and split-test projections',
    motifs: ['metric prisms', 'test matrices', 'performance arcs'],
    expression: 'analytical, inventive, relentlessly curious',
    badgeSeeds: ['Optimization', 'Signals', 'Experiment'],
  },
  {
    id: 'security-sentinel',
    keywords: ['security', 'audit', 'guardian', 'threat', 'penetration', 'compliance', 'integrity'],
    role: 'security sentinel',
    palette: ['obsidian', 'emerald', 'gunmetal'],
    wardrobe: 'armored midnight trench with luminous emerald seam work',
    environment: 'quiet command bunker with holographic shield interfaces',
    motifs: ['threat-map holograms', 'shield glyphs', 'forensic lenses'],
    expression: 'disciplined, precise, slightly intimidating confidence',
    badgeSeeds: ['Security', 'Sentinel', 'Integrity'],
  },
  {
    id: 'systems-forge',
    keywords: ['backend', 'database', 'api', 'architect', 'infrastructure', 'devops', 'cli'],
    role: 'systems forge engineer',
    palette: ['navy', 'electric blue', 'titanium'],
    wardrobe: 'utility jacket with modular tooling, diagnostic cables, and metal fasteners',
    environment: 'server forge with transparent terminals and orchestration schematics',
    motifs: ['terminal glyphs', 'data conduits', 'schematic overlays'],
    expression: 'focused, calm, deeply technical',
    badgeSeeds: ['Systems', 'Builder', 'Reliability'],
  },
  {
    id: 'signal-detective',
    keywords: ['research', 'analysis', 'investigator', 'scout', 'intelligence', 'timeline', 'evidence'],
    role: 'signal detective analyst',
    palette: ['indigo', 'cyan', 'silver'],
    wardrobe: 'sleek long coat with archival hardware and sensor threads',
    environment: 'evidence wall of floating clues and signal traces',
    motifs: ['timeline strands', 'sensor halos', 'data fragments'],
    expression: 'curious, sharp, observant',
    badgeSeeds: ['Analysis', 'Scout', 'Insight'],
  },
  {
    id: 'creative-director',
    keywords: ['content', 'story', 'brand', 'design', 'video', 'audio', 'podcast', 'visual'],
    role: 'retro-future studio director',
    palette: ['magenta', 'amber', 'graphite'],
    wardrobe: 'tailored creative suit with luminous trim and tactile fabrics',
    environment: 'editorial studio with cinematic gels and production consoles',
    motifs: ['lens flares', 'storyboards', 'analog controls'],
    expression: 'charismatic, imaginative, highly intentional',
    badgeSeeds: ['Creative', 'Studio', 'Signal'],
  },
  {
    id: 'growth-operator',
    keywords: ['marketing', 'seo', 'audience', 'growth', 'campaign', 'calendar', 'outreach', 'traffic'],
    role: 'growth operator strategist',
    palette: ['sunrise orange', 'crimson', 'midnight plum'],
    wardrobe: 'sharp strategist coat with illuminated lapel circuitry',
    environment: 'campaign war room with trend charts and audience waves',
    motifs: ['trend arcs', 'signal bursts', 'campaign dashboards'],
    expression: 'persuasive, energetic, outcome-driven',
    badgeSeeds: ['Growth', 'Strategy', 'Momentum'],
  },
  {
    id: 'governance-executive',
    keywords: ['finance', 'tax', 'legal', 'contract', 'director', 'governance', 'negotiator', 'manager'],
    role: 'executive steward',
    palette: ['deep burgundy', 'gold', 'onyx'],
    wardrobe: 'luxury executive coat with ceremonial hardware and precise tailoring',
    environment: 'boardroom observatory with illuminated ledgers and contract glass',
    motifs: ['ledger grids', 'seal marks', 'authority rings'],
    expression: 'measured, authoritative, trustworthy',
    badgeSeeds: ['Governance', 'Executive', 'Steward'],
  },
  {
    id: 'community-connector',
    keywords: ['community', 'support', 'relationship', 'customer', 'guest', 'persona', 'social'],
    role: 'community connector',
    palette: ['teal', 'rose', 'smoke'],
    wardrobe: 'welcoming layered fashion with warm light-reactive textiles',
    environment: 'conversation lounge with soft holographic message threads',
    motifs: ['signal threads', 'community halos', 'connection arcs'],
    expression: 'empathetic, warm, socially intelligent',
    badgeSeeds: ['Community', 'Support', 'Trust'],
  },
  {
    id: 'field-engineer',
    keywords: ['developer', 'debug', 'test', 'engineer', 'mobile', 'frontend', 'game', 'openclaw'],
    role: 'field engineer',
    palette: ['cobalt', 'violet', 'steel'],
    wardrobe: 'practical technical wear with worn-in hardware and field instruments',
    environment: 'hands-on workshop with debug monitors and active prototypes',
    motifs: ['debug traces', 'tool harnesses', 'prototype light bars'],
    expression: 'resourceful, sharp, ready to improvise',
    badgeSeeds: ['Engineering', 'Execution', 'Prototype'],
  },
];

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCase(value) {
  return normalizeWhitespace(value)
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeToken(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/api$/i, '')
    .replace(/[^a-z0-9\s-]+/g, '')
    .trim();
}

function cleanDescription(value) {
  return normalizeWhitespace(value)
    .replace(/^must be used to\s+/i, '')
    .replace(/^use when\s+/i, 'Use when ')
    .replace(/^this agent\s+/i, '')
    .replace(/^act as\s+/i, 'Acts as ')
    .replace(/^to\s+/i, '')
    .replace(/^responsible for\s+/i, '');
}

function firstSentence(value) {
  const normalized = cleanDescription(value);
  const sentence = normalized.match(/[^.!?]+[.!?]?/);
  return normalizeWhitespace(sentence ? sentence[0] : normalized);
}

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeWhitespace(item)).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => normalizeWhitespace(item))
      .filter(Boolean);
  }
  return [];
}

function parseFrontmatterMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/);
  const frontmatter = match ? yaml.load(match[1]) || {} : {};
  const heading = content
    .replace(/^---\s*\n[\s\S]*?\n---\s*(?:\n|$)/, '')
    .split('\n')
    .find((line) => line.trim().startsWith('# '));

  const description =
    cleanDescription(frontmatter.description) ||
    firstSentence(content.replace(/^---\s*\n[\s\S]*?\n---\s*(?:\n|$)/, ''));

  return {
    id: slugify(path.basename(filePath, path.extname(filePath))),
    displayName:
      titleCase(frontmatter.name || (heading ? heading.replace(/^#\s+/, '') : path.basename(filePath))),
    description,
    tools: ensureArray(frontmatter.tools),
    skills: ensureArray(frontmatter.skills),
    tags: ensureArray(frontmatter.tags),
    capabilities: [],
    systemPromptPreview: normalizeWhitespace(content).slice(0, 320),
    sourceKind: 'tnf-bank',
    sourceFile: path.relative(root, filePath),
  };
}

function parseRegistryAgents(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return data.map((item) => ({
    id: slugify(item.id || item.name || item.displayName),
    displayName: titleCase(item.displayName || item.name || item.id),
    description: cleanDescription(item.description || firstSentence(item.systemPrompt)),
    tools: ensureArray(item.tools).concat(ensureArray(item.inferredTools)),
    skills: [],
    tags: ensureArray(item.tags),
    capabilities: ensureArray(item.capabilities),
    systemPromptPreview: normalizeWhitespace(item.systemPrompt || '').slice(0, 320),
    sourceKind: 'registry',
    sourceFile: item.sourceFile || path.relative(root, filePath),
  }));
}

function parseConfigAgents(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const fullPath = path.join(dirPath, file);
      const item = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      return {
        id: slugify(item.id || item.name || file),
        displayName: titleCase(item.name || item.id || file),
        description: cleanDescription(item.description || firstSentence(item.systemPrompt)),
        tools: [],
        skills: [],
        tags: ensureArray(item.profile?.tags),
        capabilities: ensureArray(item.capabilities),
        systemPromptPreview: normalizeWhitespace(item.systemPrompt || '').slice(0, 320),
        sourceKind: 'config-ai-agent',
        sourceFile: path.relative(root, fullPath),
      };
    });
}

function pickTheme(record) {
  const haystack = normalizeWhitespace(
    `${record.displayName} ${record.description} ${record.tags.join(' ')} ${record.tools.join(' ')} ${record.capabilities.join(' ')}`
  ).toLowerCase();

  return (
    THEME_RULES.find((theme) => theme.keywords.some((keyword) => haystack.includes(keyword))) || {
      id: 'future-retro-generalist',
      role: 'future-retro specialist',
      palette: ['slate', 'silver', 'electric blue'],
      wardrobe: 'refined retro-future tailoring with premium technical details',
      environment: 'clean sci-fi portrait studio with subtle signal architecture',
      motifs: ['signal rings', 'precision hardware', 'ambient light traces'],
      expression: 'confident, intelligent, distinctively human',
      badgeSeeds: ['Specialist', 'Signal', 'Verified'],
    }
  );
}

function uniqueList(values, limit = 4) {
  return [...new Set(values.map((value) => normalizeWhitespace(value)).filter(Boolean))].slice(0, limit);
}

function buildBadges(record, theme) {
  const raw = [
    ...theme.badgeSeeds,
    ...record.capabilities.slice(0, 2),
    ...record.tags.slice(0, 2),
    ...record.tools.slice(0, 1),
  ];

  const cleaned = uniqueList(
    raw
      .map((value) => normalizeToken(String(value).replace(/_/g, ' ')))
      .filter((value) => value && !NOISE_TOKENS.has(value) && value.length > 2)
      .map((value) => titleCase(value)),
    4
  );

  return cleaned.map((name) => ({
    id: slugify(name),
    name,
  }));
}

function buildVisualMotifs(record, theme) {
  return uniqueList([
    ...theme.motifs,
    ...record.tags.slice(0, 2).map((tag) => `${tag.replace(/-/g, ' ')} emblem accents`),
    ...record.capabilities.slice(0, 1).map((capability) => `${capability.toLowerCase()} interface cues`),
  ]);
}

function buildLookupKeys(record) {
  const sourceBase = record.sourceFile ? path.basename(record.sourceFile, path.extname(record.sourceFile)) : '';
  return uniqueList([
    record.id,
    slugify(record.displayName),
    sourceBase,
    record.sourceFile,
    `${record.sourceKind}:${record.id}`,
  ], 8);
}

function buildImagePrompt(record, theme, badges, motifs) {
  const specialties = uniqueList([
    ...record.capabilities,
    ...record.tags,
    ...record.tools.map((tool) => tool.replace(/API$/i, ' interface')),
  ]
    .map((value) => normalizeToken(value))
    .filter((value) => value && !NOISE_TOKENS.has(value) && value.length > 2)).join(', ');

  const characterBrief = [
    `${record.displayName} interpreted as a ${theme.role}.`,
    `Core role: ${record.description}.`,
    specialties ? `Specialties visible through props and costume language: ${specialties}.` : '',
    `Color story: ${theme.palette.join(', ')}.`,
    `Wardrobe: ${theme.wardrobe}.`,
    `Environment: ${theme.environment}.`,
    `Visual motifs: ${motifs.join(', ')}.`,
    `Emotional tone: ${theme.expression}.`,
    `Make the subject look like a memorable humanoid operator with strong personality, believable age lines, intelligent eyes, and premium retro-future craftsmanship.`,
    `Design for later TNF badge overlays inspired by: ${badges.map((badge) => badge.name).join(', ')}.`,
  ]
    .filter(Boolean)
    .join(' ');

  return `${STYLE_SYSTEM.promptPrefix} ${characterBrief}`;
}

function createCatalog(records) {
  const deduped = new Map();

  for (const record of records) {
    const existing = deduped.get(record.id);
    if (!existing) {
      deduped.set(record.id, record);
      continue;
    }

    const score = (entry) =>
      entry.description.length +
      entry.tools.length * 5 +
      entry.tags.length * 3 +
      entry.capabilities.length * 4;

    if (score(record) > score(existing)) {
      deduped.set(record.id, record);
    }
  }

  return [...deduped.values()]
    .sort((left, right) => left.displayName.localeCompare(right.displayName))
    .map((record) => {
      const theme = pickTheme(record);
      const badges = buildBadges(record, theme);
      const visualMotifs = buildVisualMotifs(record, theme);
      return {
        id: record.id,
        slug: record.id,
        displayName: record.displayName,
        lookupKeys: buildLookupKeys(record),
        sourceKind: record.sourceKind,
        sourceFile: record.sourceFile,
        profile: {
          machineId: record.id,
          vanityName: record.displayName,
          role: theme.role,
          tagline: firstSentence(record.description),
          summary: record.description,
          badgeSet: badges,
          accentPalette: theme.palette,
          visualMotifs,
          promptStatus: 'ready-for-generation',
        },
        promptSpec: {
          styleName: STYLE_SYSTEM.styleName,
          stylePrompt: STYLE_SYSTEM.promptPrefix,
          negativePrompt: STYLE_SYSTEM.negativePrompt,
          renderNotes: STYLE_SYSTEM.renderNotes,
          imagePrompt: buildImagePrompt(record, theme, badges, visualMotifs),
        },
      };
    });
}

function main() {
  const records = [
    ...parseRegistryAgents(path.join(root, 'data', 'agent-registry', 'agents.json')),
    ...fs
      .readdirSync(path.join(root, '.agent', 'agents'))
      .filter((file) => file.endsWith('.md'))
      .map((file) => parseFrontmatterMarkdown(path.join(root, '.agent', 'agents', file))),
    ...parseConfigAgents(path.join(root, 'config', 'ai-agents')),
  ];

  const catalog = {
    generatedAt: new Date().toISOString(),
    generatedFrom: ['data/agent-registry/agents.json', '.agent/agents/*.md', 'config/ai-agents/*.json'],
    styleSystem: STYLE_SYSTEM,
    totalAgents: 0,
    agents: [],
  };

  catalog.agents = createCatalog(records);
  catalog.totalAgents = catalog.agents.length;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${catalog.totalAgents} agent visual profiles to ${path.relative(root, outputPath)}`);
}

main();
