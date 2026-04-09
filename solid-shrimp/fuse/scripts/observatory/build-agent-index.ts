#!/usr/bin/env tsx

/**
 * Build an Observatory-friendly index of agent definitions.
 *
 * Sources (current repo):
 * - .claude/agents/*.md (YAML front matter + markdown body)
 * - config/agents/*.json (optional trait/ability/tool overlays)
 * - config/agents/agent_traits.json (catalog)
 *
 * Output:
 * - apps/frontend/public/observatory/agents.index.json
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';

type TraitCatalog = {
  traits?: { name: string; description?: string }[];
  abilities?: { name: string; description?: string }[];
  tools?: { name: string; description?: string }[];
};

type AgentOverlayConfig = {
  name: string;
  traits?: string[];
  abilities?: string[];
  tools?: string[];
  template?: string;
};

type AgentIndexItem = {
  id: string; // stable id, typically filename without ext
  name: string;
  description?: string;
  tools?: string[];

  // optional overlays (from config/agents)
  traits?: string[];
  abilities?: string[];
  overlayTools?: string[];
  template?: string;

  // semantic enrichment (from docs pipeline)
  semantic?: {
    relatedConcepts?: Array<{ concept: string; score: number }>;
    definingDocs?: Array<{ path: string; score: number; snippet?: string }>;
  };

  // raw narrative (markdown body after front matter)
  bodyMarkdown?: string;

  // provenance
  sources: {
    definitionPath: string;
    overlayPaths?: string[];
  };
};

function normalizeKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

function normalizeConceptKey(s: string): string {
  // more aggressive normalization for matching concept variants
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function parseFrontMatterOnly(raw: string): { fm: Record<string, any>; body: string } {
  // Very small parser for the specific front matter patterns used in .claude/agents.
  // Supports: name, description, tools: [list] with "- item" lines.
  const trimmed = raw.replace(/^\uFEFF/, '');
  if (!trimmed.startsWith('---')) return { fm: {}, body: raw };

  const end = trimmed.indexOf('\n---', 3);
  if (end === -1) return { fm: {}, body: raw };

  const fmBlock = trimmed.slice(3, end).trim();
  const body = trimmed.slice(end + '\n---'.length).replace(/^\s*\n/, '');

  const fm: Record<string, any> = {};
  let currentKey: string | null = null;

  for (const line of fmBlock.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) {
      currentKey = m[1];
      const rest = m[2];
      if (rest === '') {
        fm[currentKey] = fm[currentKey] ?? [];
      } else {
        // strip surrounding quotes if present
        fm[currentKey] = rest.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
      }
      continue;
    }

    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem && currentKey) {
      if (!Array.isArray(fm[currentKey])) fm[currentKey] = [];
      (fm[currentKey] as any[]).push(listItem[1].trim());
    }
  }

  return { fm, body };
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const repoRoot = process.cwd();

  const agentsDir = path.join(repoRoot, '.claude', 'agents');
  const overlayDir = path.join(repoRoot, 'config', 'agents');
  const traitCatalogPath = path.join(overlayDir, 'agent_traits.json');

  const outPath = path.join(
    repoRoot,
    'apps',
    'frontend',
    'public',
    'observatory',
    'agents.index.json'
  );
  await fs.mkdir(path.dirname(outPath), { recursive: true });

  // overlays
  const overlays: Record<string, AgentOverlayConfig & { __path: string }[]> = {};
  if (await fileExists(overlayDir)) {
    const overlayFiles = (await fs.readdir(overlayDir)).filter(
      (f) => f.endsWith('.json') && f !== 'agent_traits.json'
    );
    for (const f of overlayFiles) {
      const p = path.join(overlayDir, f);
      const json = JSON.parse(await fs.readFile(p, 'utf8')) as AgentOverlayConfig;
      if (!json?.name) continue;
      const key = normalizeKey(json.name);
      overlays[key] = overlays[key] ?? [];
      overlays[key].push({ ...json, __path: path.relative(repoRoot, p) });
    }
  }

  // trait catalog (included in output as reference, not enforced)
  let catalog: TraitCatalog | undefined;
  if (await fileExists(traitCatalogPath)) {
    catalog = JSON.parse(await fs.readFile(traitCatalogPath, 'utf8')) as TraitCatalog;
  }

  // docs pipeline graph (optional semantic enrichment)
  const consolidatedGraphPath = path.join(
    repoRoot,
    '.documentation-system',
    'analysis',
    'consolidated-graph.json'
  );
  let conceptVariantToCanonical: Map<string, string> | null = null;
  let canonicalToSources: Map<string, string[]> | null = null;

  if (await fileExists(consolidatedGraphPath)) {
    const graph = JSON.parse(await fs.readFile(consolidatedGraphPath, 'utf8')) as any;
    conceptVariantToCanonical = new Map();
    canonicalToSources = new Map();

    const concepts = graph.concepts ?? {};
    const conceptGroups = graph.conceptGroups ?? {};

    // canonical -> sources
    for (const [canonical, data] of Object.entries<any>(concepts)) {
      const sources: string[] = Array.isArray(data?.sources) ? data.sources : [];
      canonicalToSources.set(canonical, sources);

      // direct canonical match
      conceptVariantToCanonical.set(normalizeConceptKey(canonical), canonical);

      // variants field on concept
      const variants: string[] = Array.isArray(data?.variants) ? data.variants : [];
      for (const v of variants) {
        conceptVariantToCanonical.set(normalizeConceptKey(v), canonical);
      }
    }

    // variants in conceptGroups
    for (const [_, grp] of Object.entries<any>(conceptGroups)) {
      const canonical = grp?.canonical;
      if (!canonical) continue;
      const variants: string[] = Array.isArray(grp?.variants) ? grp.variants : [];
      for (const v of variants) {
        conceptVariantToCanonical.set(normalizeConceptKey(v), canonical);
      }
    }
  }

  const files = (await fs.readdir(agentsDir)).filter((f) => f.endsWith('.md'));

  const agents: AgentIndexItem[] = [];

  for (const f of files) {
    const p = path.join(agentsDir, f);
    const raw = await fs.readFile(p, 'utf8');
    const { fm, body } = parseFrontMatterOnly(raw);

    const id = path.basename(f, path.extname(f));
    const name = (fm.name as string) ?? id;
    const description = fm.description as string | undefined;

    const tools = Array.isArray(fm.tools) ? (fm.tools as string[]) : undefined;

    const overlayKey = normalizeKey(name);
    const o = overlays[overlayKey] ?? [];

    const mergedTraits = o.flatMap((x) => x.traits ?? []);
    const mergedAbilities = o.flatMap((x) => x.abilities ?? []);
    const mergedTools = o.flatMap((x) => x.tools ?? []);
    const template = o.find((x) => x.template)?.template;

    // semantic enrichment: match agent name + tool names + body keywords to concept variants
    let semantic: AgentIndexItem['semantic'] | undefined;
    if (conceptVariantToCanonical && canonicalToSources) {
      const terms = [name, ...(tools ?? [])].map((t) => t.trim()).filter(Boolean);

      const conceptScores = new Map<string, number>();

      // Strong matches: exact-ish term variants
      for (const t of terms) {
        const key = normalizeConceptKey(t);
        const canonical = conceptVariantToCanonical.get(key);
        if (!canonical) continue;
        conceptScores.set(canonical, (conceptScores.get(canonical) ?? 0) + 10);
      }

      // Token-level matches from agent name (helps multi-word names)
      for (const token of name.split(/[^A-Za-z0-9]+/g).filter(Boolean)) {
        const canonical = conceptVariantToCanonical.get(normalizeConceptKey(token));
        if (!canonical) continue;
        conceptScores.set(canonical, (conceptScores.get(canonical) ?? 0) + 2);
      }

      // Body keyword mining (lightweight): score top repeated tokens
      const stop = new Set([
        'the',
        'and',
        'or',
        'to',
        'of',
        'in',
        'for',
        'on',
        'with',
        'as',
        'is',
        'are',
        'be',
        'by',
        'from',
        'at',
        'an',
        'a',
        'it',
        'this',
        'that',
        'these',
        'those',
        'you',
        'your',
        'we',
        'our',
        'they',
        'their',
        'must',
        'should',
        'can',
        'will',
        'may',
        'do',
        'does',
        'not',
        'no',
        'yes',
        'into',
        'out',
        'up',
        'down',
        'over',
        'under',
        'output',
        'input',
        'report',
        'model',
        'json',
        'valid',
        'single',
        'object',
        'workflow',
        'step',
        'steps',
        'each',
        'generate',
        'analyze',
        'contained',
      ]);

      const tokenCounts = new Map<string, number>();
      const bodyText = body
        .replace(/```[\s\S]*?```/g, ' ') // strip code blocks
        .replace(/`[^`]*`/g, ' ') // strip inline code
        .replace(/[#>*_\-]/g, ' ') // strip markdown punctuation
        .toLowerCase();

      for (const tok of bodyText.split(/[^a-z0-9]+/g)) {
        if (!tok || tok.length < 4) continue;
        if (stop.has(tok)) continue;
        tokenCounts.set(tok, (tokenCounts.get(tok) ?? 0) + 1);
      }

      const topBodyTokens = Array.from(tokenCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 40);

      for (const [tok, freq] of topBodyTokens) {
        const canonical = conceptVariantToCanonical.get(normalizeConceptKey(tok));
        if (!canonical) continue;
        // smaller weight; scaled by frequency, capped
        const add = Math.min(6, Math.max(1, Math.floor(freq / 2)));
        conceptScores.set(canonical, (conceptScores.get(canonical) ?? 0) + add);
      }

      const relatedConcepts = Array.from(conceptScores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([concept, score]) => ({ concept, score }));

      // defining docs: aggregate sources for matched concepts
      const docScores = new Map<string, number>();

      // always include the agent's own definition as the #1 defining doc
      docScores.set(path.relative(repoRoot, p), 100);

      for (const { concept, score } of relatedConcepts) {
        const sources = canonicalToSources.get(concept) ?? [];
        for (const s of sources.slice(0, 30)) {
          docScores.set(s, (docScores.get(s) ?? 0) + score);
        }
      }

      const topDocs = Array.from(docScores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12);

      const definingDocs = await Promise.all(
        topDocs.map(async ([docPath, score], idx) => {
          // Add small snippet for the top few docs only (keeps index size reasonable)
          let snippet: string | undefined;
          if (idx < 6) {
            try {
              const abs = path.join(repoRoot, docPath);
              const raw = await fs.readFile(abs, 'utf8');
              snippet = raw
                .replace(/^---[\s\S]*?---/m, '') // drop front matter if present
                .replace(/```[\s\S]*?```/g, ' ') // drop code blocks
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 320);
            } catch {
              // ignore snippet failures (binary files, missing, etc.)
            }
          }
          return { path: docPath, score, snippet };
        })
      );

      if (relatedConcepts.length || definingDocs.length) {
        semantic = {
          relatedConcepts: relatedConcepts.length ? relatedConcepts : undefined,
          definingDocs: definingDocs.length ? definingDocs : undefined,
        };
      }
    }

    agents.push({
      id,
      name,
      description,
      tools,
      traits: mergedTraits.length ? Array.from(new Set(mergedTraits)) : undefined,
      abilities: mergedAbilities.length ? Array.from(new Set(mergedAbilities)) : undefined,
      overlayTools: mergedTools.length ? Array.from(new Set(mergedTools)) : undefined,
      template,
      semantic,
      bodyMarkdown: body.trim() ? body : undefined,
      sources: {
        definitionPath: path.relative(repoRoot, p),
        overlayPaths: o.length ? o.map((x) => x.__path) : undefined,
      },
    });
  }

  agents.sort((a, b) => a.name.localeCompare(b.name));

  const payload = {
    generatedAt: new Date().toISOString(),
    counts: {
      agentDefinitions: agents.length,
      overlayConfigs: Object.values(overlays).reduce((acc, v) => acc + v.length, 0),
    },
    catalog,
    agents,
  };

  await fs.writeFile(outPath, JSON.stringify(payload, null, 2), 'utf8');

  // eslint-disable-next-line no-console
  console.log(`Wrote ${agents.length} agents -> ${path.relative(repoRoot, outPath)}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
