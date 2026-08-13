import profileCatalog from './agent-visual-profiles.json';

export interface AgentVisualProfileBadge {
  id: string;
  name: string;
}

export interface AgentVisualProfileRecord {
  id: string;
  slug: string;
  displayName: string;
  lookupKeys: string[];
  sourceKind: string;
  sourceFile: string;
  profile: {
    machineId: string;
    vanityName: string;
    role: string;
    tagline: string;
    summary: string;
    badgeSet: AgentVisualProfileBadge[];
    accentPalette: string[];
    visualMotifs: string[];
    promptStatus: string;
  };
  promptSpec: {
    styleName: string;
    stylePrompt: string;
    negativePrompt: string;
    renderNotes: string[];
    imagePrompt: string;
  };
}

interface AgentProfileLookupInput {
  id?: string;
  name?: string;
  type?: string;
  metadata?: Record<string, any>;
}

const catalog = profileCatalog as {
  generatedAt: string;
  totalAgents: number;
  styleSystem: {
    modelTarget: string;
    styleName: string;
    promptPrefix: string;
    negativePrompt: string;
    renderNotes: string[];
    badgeSystem: string;
  };
  agents: AgentVisualProfileRecord[];
};

const normalizeKey = (value?: string | null) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/^[a-z]+:/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const byLookupKey = new Map<string, AgentVisualProfileRecord>();

for (const entry of catalog.agents) {
  const keys = [
    entry.id,
    entry.slug,
    entry.displayName,
    ...(entry.lookupKeys || []),
    entry.sourceFile,
    entry.profile.machineId,
    entry.profile.vanityName,
  ];

  for (const key of keys) {
    const normalized = normalizeKey(key);
    if (normalized && !byLookupKey.has(normalized)) {
      byLookupKey.set(normalized, entry);
    }
  }
}

export const agentVisualProfileCatalog = catalog;

export function createAgentProfileFallbackAvatar(profile: AgentVisualProfileRecord): string {
  const initials = profile.displayName
    .split(/\s+/)
    .map((part) => part[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const [start = 'slate', end = 'silver'] = profile.profile.accentPalette;
  const palette = mapPaletteToHex(start, end);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320" role="img" aria-label="${escapeText(profile.displayName)}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette[0]}" />
          <stop offset="100%" stop-color="${palette[1]}" />
        </linearGradient>
      </defs>
      <rect width="320" height="320" rx="72" fill="url(#bg)" />
      <circle cx="244" cy="78" r="34" fill="${palette[2]}" fill-opacity="0.24" />
      <circle cx="88" cy="248" r="56" fill="#ffffff" fill-opacity="0.08" />
      <text
        x="50%"
        y="56%"
        dominant-baseline="middle"
        text-anchor="middle"
        fill="#ffffff"
        font-family="Inter, Arial, sans-serif"
        font-size="108"
        font-weight="700"
        letter-spacing="6"
      >
        ${escapeText(initials || 'AI')}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function findAgentVisualProfileByKey(
  ...keys: Array<string | null | undefined>
): AgentVisualProfileRecord | null {
  for (const key of keys) {
    const normalized = normalizeKey(key);
    if (normalized && byLookupKey.has(normalized)) {
      return byLookupKey.get(normalized) || null;
    }
  }

  return null;
}

export function getAgentVisualProfileBySlug(slug?: string | null): AgentVisualProfileRecord | null {
  return findAgentVisualProfileByKey(slug);
}

export function resolveAgentVisualProfile(
  agent: AgentProfileLookupInput
): AgentVisualProfileRecord | null {
  const sourceTemplate = agent.metadata?.sourceTemplate || {};
  return findAgentVisualProfileByKey(
    agent.id,
    agent.name,
    agent.type,
    sourceTemplate.id,
    sourceTemplate.name,
    sourceTemplate.filename,
    sourceTemplate.filename ? `${sourceTemplate.bank || ''}:${sourceTemplate.filename}` : ''
  );
}

function mapPaletteToHex(primary: string, secondary: string): [string, string, string] {
  const colors: Record<string, string> = {
    amber: '#f59e0b',
    blue: '#2563eb',
    burgundy: '#7f1d1d',
    cobalt: '#1d4ed8',
    crimson: '#dc2626',
    cyan: '#06b6d4',
    'electric blue': '#38bdf8',
    emerald: '#10b981',
    gold: '#fbbf24',
    graphite: '#374151',
    gunmetal: '#1f2937',
    indigo: '#4f46e5',
    magenta: '#db2777',
    navy: '#1e3a8a',
    obsidian: '#0f172a',
    onyx: '#111827',
    'royal blue': '#1d4ed8',
    rose: '#fb7185',
    silver: '#94a3b8',
    slate: '#334155',
    smoke: '#64748b',
    steel: '#475569',
    teal: '#0f766e',
    titanium: '#94a3b8',
    violet: '#7c3aed',
    'white gold': '#f8fafc',
    'sunrise orange': '#f97316',
  };

  return [
    colors[primary] || '#1e3a8a',
    colors[secondary] || '#475569',
    colors[secondary] || '#38bdf8',
  ];
}

function escapeText(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => {
    switch (character) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&#39;';
      case '"':
        return '&quot;';
      default:
        return character;
    }
  });
}
