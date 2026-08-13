#!/usr/bin/env tsx
/**
 * Stage 5: Evolution & Execution Planning
 *
 * Turns analysis artifacts into actionable consolidation + freshness work:
 * - Detects exact duplicates and near-duplicate doc groups
 * - Detects stale docs by comparing doc timestamps to referenced code files
 * - Detects broken local markdown links
 * - Emits prioritized tasks with subtasks for execution tracking
 * - Optional safe apply mode for exact duplicate archival
 *
 * Inputs:
 *   - .documentation-system/manifest.json
 *   - .documentation-system/classified-manifest.json
 *   - .documentation-system/analysis/knowledge-graph.json
 *   - .documentation-system/analysis/consolidation-report.json
 *
 * Outputs:
 *   - .documentation-system/analysis/evolution-report.json
 *   - .documentation-system/analysis/evolution-tasks.json
 *   - .documentation-system/analysis/evolution-tasks.md
 *   - .documentation-system/analysis/evolution-apply-operations.json (if apply mode)
 */

import * as fs from 'fs';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DOCS_SYSTEM_DIR = path.join(PROJECT_ROOT, '.documentation-system');
const ANALYSIS_DIR = path.join(DOCS_SYSTEM_DIR, 'analysis');

const MANIFEST_FILE = path.join(DOCS_SYSTEM_DIR, 'manifest.json');
const CLASSIFIED_FILE = path.join(DOCS_SYSTEM_DIR, 'classified-manifest.json');
const KNOWLEDGE_GRAPH_FILE = path.join(ANALYSIS_DIR, 'knowledge-graph.json');
const CONSOLIDATION_REPORT_FILE = path.join(ANALYSIS_DIR, 'consolidation-report.json');

const EVOLUTION_REPORT_FILE = path.join(ANALYSIS_DIR, 'evolution-report.json');
const EVOLUTION_TASKS_JSON = path.join(ANALYSIS_DIR, 'evolution-tasks.json');
const EVOLUTION_TASKS_MD = path.join(ANALYSIS_DIR, 'evolution-tasks.md');
const EVOLUTION_APPLY_OPS_JSON = path.join(ANALYSIS_DIR, 'evolution-apply-operations.json');

type Priority = 'P0' | 'P1' | 'P2' | 'P3';

interface ManifestFile {
  path: string;
  size: number;
  type: string;
  directory: string;
  modified: number;
  hash: string;
  lines: number;
}

interface EvolutionTask {
  id: string;
  type:
    | 'merge_exact_duplicates'
    | 'merge_near_duplicates'
    | 'refresh_against_code'
    | 'fix_broken_links'
    | 'review_outdated_doc';
  priority: Priority;
  status: 'todo' | 'in_progress' | 'done';
  title: string;
  paths: string[];
  rationale: string;
  evidence: Record<string, unknown>;
  subtasks: string[];
}

interface ApplyOperation {
  action: 'archive_exact_duplicate' | 'archive_near_duplicate_safe';
  canonicalPath: string;
  archivedPath: string;
  archiveDestination: string;
}

const args = new Set(process.argv.slice(2));
const APPLY_EXACT_DUPLICATES = args.has('--apply-exact-duplicates');
const APPLY_NEAR_DUPLICATES_SAFE = args.has('--apply-near-duplicates-safe');
const NEAR_DUP_MAX_MISSING = Number(process.env.DOCS_NEAR_DUP_MAX_MISSING || '0');
const NEAR_DUP_MIN_PAIR_JACCARD = Number(process.env.DOCS_NEAR_DUP_MIN_JACCARD || '0.2');
const NEAR_DUP_MIN_PAIR_MIN_OVERLAP = Number(process.env.DOCS_NEAR_DUP_MIN_MIN_OVERLAP || '0.45');
const NEAR_DUP_MIN_SUBSTANTIVE_CONCEPTS = Number(
  process.env.DOCS_NEAR_DUP_MIN_SUBSTANTIVE_CONCEPTS || '25'
);
const NEAR_DUP_MIN_SUBSTANTIVE_LINES = Number(
  process.env.DOCS_NEAR_DUP_MIN_SUBSTANTIVE_LINES || '40'
);
const FRESHNESS_DAYS = Number(process.env.DOCS_FRESHNESS_DAYS || '14');
const REVIEW_AGE_DAYS = Number(process.env.DOCS_REVIEW_AGE_DAYS || '180');

function readJsonFile<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function isExternalLink(raw: string): boolean {
  return /^(https?:\/\/|mailto:|tel:|#)/i.test(raw);
}

function isLikelyCodeFile(raw: string): boolean {
  return /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|sql|sh|bash|zsh|yaml|yml|json)$/i.test(raw);
}

function normalizePath(raw: string): string {
  return path.posix.normalize(raw.replace(/\\/g, '/')).replace(/^\.\//, '');
}

function resolveCandidates(rawRef: string, sourcePath: string): string[] {
  const projectRootPosix = PROJECT_ROOT.replace(/\\/g, '/');
  let clean = rawRef
    .trim()
    .replace(/^`|`$/g, '')
    .replace(/[),.;:]+$/g, '');
  if (!clean) return [];

  clean = clean.replace(/^<repo-root>\//i, '').replace(/^<repo_root>\//i, '');

  if (/^file:\/\//i.test(clean)) {
    const noScheme = clean.replace(/^file:\/+/, '/').replace(/\\/g, '/');
    if (noScheme.startsWith(projectRootPosix + '/')) {
      clean = noScheme.slice(projectRootPosix.length + 1);
    } else {
      return [];
    }
  }

  if (!clean) return [];
  if (isExternalLink(clean)) return [];

  // Ignore obvious command-like pseudo-links.
  if (/\s/.test(clean) && !/[/.]/.test(clean)) return [];

  const sourceDir = path.posix.dirname(sourcePath);
  const candidates = new Set<string>();
  const withoutAnchor = clean.split('#')[0].split('?')[0];
  if (!withoutAnchor) return [];

  const withoutLineRef = withoutAnchor.replace(/:(\d+)(:\d+)?$/, '');

  if (withoutLineRef.startsWith('/')) {
    candidates.add(normalizePath(withoutLineRef.slice(1)));
  } else {
    candidates.add(normalizePath(path.posix.join(sourceDir, withoutLineRef)));
    candidates.add(normalizePath(withoutLineRef));
  }

  const resolved = Array.from(candidates);
  const expanded = new Set<string>(resolved);

  for (const candidate of resolved) {
    if (!path.posix.extname(candidate)) {
      expanded.add(`${candidate}.md`);
      expanded.add(`${candidate}.mdx`);
      expanded.add(path.posix.join(candidate, 'README.md'));
      expanded.add(path.posix.join(candidate, 'index.md'));
    }
  }

  return Array.from(expanded);
}

function priorityValue(priority: Priority): number {
  switch (priority) {
    case 'P0':
      return 0;
    case 'P1':
      return 1;
    case 'P2':
      return 2;
    default:
      return 3;
  }
}

function toDays(secondsDiff: number): number {
  return secondsDiff / (60 * 60 * 24);
}

function isManagedDocPath(filePath: string): boolean {
  if (isArchivePath(filePath)) return false;
  if (!/\.(md|mdx|txt)$/i.test(filePath)) return false;
  if (filePath.startsWith('docs/')) return true;
  if (/^packages\/[^/]+\/docs\//.test(filePath)) return true;
  if (/^apps\/[^/]+\/docs\//.test(filePath)) return true;
  return /^[^/]+\.md$/i.test(filePath);
}

function isArchivePath(filePath: string): boolean {
  return /(^|\/)(_archive|_archives|archive|archives)(\/|$)/i.test(filePath);
}

function isRootDocPath(filePath: string): boolean {
  return /^[^/]+\.(md|mdx|txt)$/i.test(filePath);
}

function isPackageOrAppDocPath(filePath: string): boolean {
  return /^packages\/[^/]+\/docs\//.test(filePath) || /^apps\/[^/]+\/docs\//.test(filePath);
}

function shouldAutoArchiveCandidate(filePath: string): boolean {
  if (isArchivePath(filePath)) return false;
  if (filePath.startsWith('docs/')) return true;
  if (isPackageOrAppDocPath(filePath)) return true;
  return isRootDocPath(filePath);
}

function isGeneratedCrawlArtifact(filePath: string): boolean {
  return /^docs\/competitive\/[^/]+\/pages\/.+\/page\.txt$/i.test(filePath);
}

function normalizeNearDuplicateKey(filePath: string): string {
  const base = path.posix.basename(filePath, path.posix.extname(filePath)).toLowerCase();
  return base
    .replace(/\b(20\d{2}[-_]\d{2}[-_]\d{2}|20\d{2})\b/g, '')
    .replace(/\b(v\d+|final|latest|summary|complete|report|notes|draft)\b/g, '')
    .replace(/[_\-.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickCanonical(paths: string[], conceptCounts: Map<string, number>): string {
  return [...paths].sort((a, b) => {
    const aArchive = isArchivePath(a) ? 1 : 0;
    const bArchive = isArchivePath(b) ? 1 : 0;
    if (aArchive !== bArchive) return aArchive - bArchive;

    const aConcepts = conceptCounts.get(a) || 0;
    const bConcepts = conceptCounts.get(b) || 0;
    if (aConcepts !== bConcepts) return bConcepts - aConcepts;

    return a.length - b.length;
  })[0];
}

function conceptOverlap(
  a: Set<string>,
  b: Set<string>
): { intersection: number; jaccard: number; minOverlap: number } {
  if (a.size === 0 || b.size === 0) {
    return { intersection: 0, jaccard: 0, minOverlap: 0 };
  }

  let intersection = 0;
  for (const concept of a) {
    if (b.has(concept)) intersection++;
  }

  const union = a.size + b.size - intersection;
  const minSize = Math.min(a.size, b.size);
  return {
    intersection,
    jaccard: union > 0 ? intersection / union : 0,
    minOverlap: minSize > 0 ? intersection / minSize : 0,
  };
}

function ensureDir(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function main(): void {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  Stage 5: Evolution & Execution Planning                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  const manifest = readJsonFile<{ metadata: any; files: ManifestFile[] }>(MANIFEST_FILE);
  const classified = readJsonFile<{ metadata: any; files: any[] }>(CLASSIFIED_FILE);
  const knowledgeGraph = readJsonFile<{ concepts: Record<string, any> }>(KNOWLEDGE_GRAPH_FILE);
  const consolidation = readJsonFile<{ metadata?: any }>(CONSOLIDATION_REPORT_FILE);

  const manifestByPath = new Map<string, ManifestFile>();
  for (const file of manifest.files) {
    manifestByPath.set(file.path, file);
  }

  const docs = manifest.files.filter((f) => isManagedDocPath(f.path));
  console.log(`📂 Managed docs in scope: ${docs.length.toLocaleString()}`);

  const fileConcepts = new Map<string, Set<string>>();
  for (const [concept, data] of Object.entries(knowledgeGraph.concepts || {})) {
    const sources = Array.isArray((data as any).sources) ? (data as any).sources : [];
    for (const source of sources) {
      if (!fileConcepts.has(source)) fileConcepts.set(source, new Set());
      fileConcepts.get(source)!.add(concept);
    }
  }

  const conceptCounts = new Map<string, number>();
  for (const doc of docs) {
    conceptCounts.set(doc.path, fileConcepts.get(doc.path)?.size || 0);
  }

  const tasks: EvolutionTask[] = [];
  const applyOperations: ApplyOperation[] = [];
  let idCounter = 1;

  // 1) Exact duplicates by hash
  const byHash = new Map<string, string[]>();
  for (const doc of docs) {
    if (!doc.hash || doc.hash === 'unknown') continue;
    if (!byHash.has(doc.hash)) byHash.set(doc.hash, []);
    byHash.get(doc.hash)!.push(doc.path);
  }

  const exactGroups = Array.from(byHash.values()).filter((g) => g.length > 1);
  for (const group of exactGroups) {
    const canonical = pickCanonical(group, conceptCounts);
    const duplicates = group.filter((p) => p !== canonical);
    if (duplicates.length === 0) continue;
    tasks.push({
      id: `DOC-TASK-${String(idCounter++).padStart(4, '0')}`,
      type: 'merge_exact_duplicates',
      priority: 'P2',
      status: 'todo',
      title: `Archive exact duplicate docs for ${path.posix.basename(canonical)}`,
      paths: [canonical, ...duplicates],
      rationale: 'Multiple documents have identical content hash.',
      evidence: {
        canonicalPath: canonical,
        duplicateCount: duplicates.length,
        hash: manifestByPath.get(canonical)?.hash || 'unknown',
      },
      subtasks: [
        'Confirm canonical document should remain primary source.',
        'Update inbound links to canonical document path.',
        'Archive or remove duplicate copies from active documentation surface.',
      ],
    });
  }

  // Optional safe apply mode: archive exact duplicates under docs/
  const dateSlug = new Date().toISOString().slice(0, 10);

  if (APPLY_EXACT_DUPLICATES) {
    for (const group of exactGroups) {
      const canonical = pickCanonical(group, conceptCounts);
      const duplicates = group.filter(
        (p) =>
          p !== canonical &&
          shouldAutoArchiveCandidate(p) &&
          !p.startsWith('docs/_archive/redundant/')
      );
      for (const duplicate of duplicates) {
        const fromAbs = path.join(PROJECT_ROOT, duplicate);
        if (!fs.existsSync(fromAbs)) continue;

        const archiveRel = path.posix.join('docs/_archive/redundant', dateSlug, duplicate);
        const archiveAbs = path.join(PROJECT_ROOT, archiveRel);
        ensureDir(archiveAbs);
        fs.renameSync(fromAbs, archiveAbs);

        applyOperations.push({
          action: 'archive_exact_duplicate',
          canonicalPath: canonical,
          archivedPath: duplicate,
          archiveDestination: archiveRel,
        });
      }
    }
  }

  // 2) Near duplicates by normalized basename
  const nearGroups = new Map<string, string[]>();
  for (const doc of docs) {
    const key = normalizeNearDuplicateKey(doc.path);
    if (!key || key.length < 4) continue;
    if (!nearGroups.has(key)) nearGroups.set(key, []);
    nearGroups.get(key)!.push(doc.path);
  }

  const ignoredGroupKeys = new Set(['readme', 'index', 'changelog', 'notes']);
  for (const [key, group] of nearGroups.entries()) {
    if (group.length < 2) continue;
    if (ignoredGroupKeys.has(key)) continue;

    const substantiveGroup = group.filter((groupPath) => {
      const conceptCount = conceptCounts.get(groupPath) || 0;
      const lineCount = manifestByPath.get(groupPath)?.lines || 0;
      return (
        conceptCount >= NEAR_DUP_MIN_SUBSTANTIVE_CONCEPTS &&
        lineCount >= NEAR_DUP_MIN_SUBSTANTIVE_LINES
      );
    });

    let comparablePairs = 0;
    let maxPairJaccard = 0;
    let maxPairMinOverlap = 0;
    for (let i = 0; i < substantiveGroup.length; i++) {
      for (let j = i + 1; j < substantiveGroup.length; j++) {
        const a = fileConcepts.get(substantiveGroup[i]) || new Set<string>();
        const b = fileConcepts.get(substantiveGroup[j]) || new Set<string>();
        const overlap = conceptOverlap(a, b);
        comparablePairs++;
        maxPairJaccard = Math.max(maxPairJaccard, overlap.jaccard);
        maxPairMinOverlap = Math.max(maxPairMinOverlap, overlap.minOverlap);
      }
    }

    const qualifiesAsNearDuplicate =
      comparablePairs > 0 &&
      (maxPairJaccard >= NEAR_DUP_MIN_PAIR_JACCARD ||
        maxPairMinOverlap >= NEAR_DUP_MIN_PAIR_MIN_OVERLAP);

    if (!qualifiesAsNearDuplicate) continue;

    const canonical = pickCanonical(group, conceptCounts);
    const union = new Set<string>();
    for (const p of group) {
      for (const c of fileConcepts.get(p) || []) union.add(c);
    }
    const canonicalConcepts = fileConcepts.get(canonical) || new Set<string>();
    const missing = Array.from(union).filter((c) => !canonicalConcepts.has(c));

    tasks.push({
      id: `DOC-TASK-${String(idCounter++).padStart(4, '0')}`,
      type: 'merge_near_duplicates',
      priority: missing.length > 0 ? 'P1' : 'P2',
      status: 'todo',
      title: `Consolidate near-duplicate docs for key "${key}"`,
      paths: [...group].sort(),
      rationale: 'Multiple docs appear to represent overlapping topics/versions.',
      evidence: {
        canonicalPath: canonical,
        groupKey: key,
        groupSize: group.length,
        substantiveGroupSize: substantiveGroup.length,
        comparablePairs,
        maxPairJaccard: Number(maxPairJaccard.toFixed(3)),
        maxPairMinOverlap: Number(maxPairMinOverlap.toFixed(3)),
        totalUniqueConcepts: union.size,
        conceptsMissingFromCanonical: missing.length,
        sampleMissingConcepts: missing.slice(0, 15),
      },
      subtasks: [
        `Merge unique concepts into canonical doc (${missing.length} missing concepts flagged).`,
        'Preserve unique examples, commands, and edge-case notes from all variants.',
        'Deprecate/redirect superseded docs and update internal links.',
      ],
    });

    if (APPLY_NEAR_DUPLICATES_SAFE && missing.length <= NEAR_DUP_MAX_MISSING) {
      const duplicates = group.filter(
        (p) =>
          p !== canonical &&
          shouldAutoArchiveCandidate(p) &&
          !p.startsWith('docs/_archive/redundant/')
      );

      for (const duplicate of duplicates) {
        const fromAbs = path.join(PROJECT_ROOT, duplicate);
        if (!fs.existsSync(fromAbs)) continue;

        const archiveRel = path.posix.join('docs/_archive/redundant-near', dateSlug, duplicate);
        const archiveAbs = path.join(PROJECT_ROOT, archiveRel);
        ensureDir(archiveAbs);
        fs.renameSync(fromAbs, archiveAbs);

        applyOperations.push({
          action: 'archive_near_duplicate_safe',
          canonicalPath: canonical,
          archivedPath: duplicate,
          archiveDestination: archiveRel,
        });
      }
    }
  }

  // 3) Freshness + link integrity
  const codeRefRegex =
    /(?:`([^`]+\.(?:ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|sql|sh|yaml|yml|json))`|([A-Za-z0-9_./-]+\.(?:ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|sql|sh|yaml|yml|json)))/g;
  const mdLinkRegex = /\[[^\]]*]\(([^)]+)\)/g;
  const nowEpoch = Math.floor(Date.now() / 1000);

  for (const doc of docs) {
    if (isGeneratedCrawlArtifact(doc.path)) continue;

    const abs = path.join(PROJECT_ROOT, doc.path);
    if (!fs.existsSync(abs)) continue;
    let content = '';
    try {
      content = fs.readFileSync(abs, 'utf8');
    } catch {
      continue;
    }

    const brokenLinks: string[] = [];
    const codeRefMatches = new Set<string>();
    let match: RegExpExecArray | null = null;

    while ((match = mdLinkRegex.exec(content)) !== null) {
      const raw = match[1]?.trim();
      if (!raw || isExternalLink(raw)) continue;

      const candidates = resolveCandidates(raw, doc.path);
      const exists = candidates.some((candidate) => {
        if (manifestByPath.has(candidate)) return true;
        const absCandidate = path.join(PROJECT_ROOT, candidate);
        return fs.existsSync(absCandidate);
      });
      if (!exists) brokenLinks.push(raw);
    }

    while ((match = codeRefRegex.exec(content)) !== null) {
      const raw = (match[1] || match[2] || '').trim();
      if (!raw || !isLikelyCodeFile(raw)) continue;
      for (const candidate of resolveCandidates(raw, doc.path)) {
        if (manifestByPath.has(candidate)) {
          codeRefMatches.add(candidate);
          break;
        }
      }
    }

    if (brokenLinks.length > 0) {
      tasks.push({
        id: `DOC-TASK-${String(idCounter++).padStart(4, '0')}`,
        type: 'fix_broken_links',
        priority: brokenLinks.length >= 3 ? 'P1' : 'P2',
        status: 'todo',
        title: `Fix broken local links in ${doc.path}`,
        paths: [doc.path],
        rationale: 'Document contains unresolved local markdown links.',
        evidence: {
          brokenLinkCount: brokenLinks.length,
          sampleBrokenLinks: brokenLinks.slice(0, 20),
        },
        subtasks: [
          'Resolve each broken path to a valid target file.',
          'Replace stale links with canonical current documentation paths.',
          'Re-run link checks for this document.',
        ],
      });
    }

    if (codeRefMatches.size > 0) {
      const latestReferencedCodeMtime = Array.from(codeRefMatches).reduce((max, codePath) => {
        const m = manifestByPath.get(codePath)?.modified || 0;
        return Math.max(max, m);
      }, 0);

      const lagDays = toDays(latestReferencedCodeMtime - doc.modified);
      if (lagDays >= FRESHNESS_DAYS) {
        tasks.push({
          id: `DOC-TASK-${String(idCounter++).padStart(4, '0')}`,
          type: 'refresh_against_code',
          priority: lagDays >= 30 ? 'P1' : 'P2',
          status: 'todo',
          title: `Refresh ${doc.path} against newer code references`,
          paths: [doc.path, ...Array.from(codeRefMatches).slice(0, 20)],
          rationale: 'Referenced code files changed after this document was last updated.',
          evidence: {
            lagDays: Number(lagDays.toFixed(1)),
            docModifiedEpoch: doc.modified,
            latestReferencedCodeEpoch: latestReferencedCodeMtime,
            referencedCodeCount: codeRefMatches.size,
          },
          subtasks: [
            'Review referenced code diffs since last doc update.',
            'Update API/behavior descriptions, examples, and caveats.',
            'Mark doc with refreshed timestamp and verification notes.',
          ],
        });
      }
    } else {
      const ageDays = toDays(nowEpoch - doc.modified);
      if (ageDays >= REVIEW_AGE_DAYS) {
        tasks.push({
          id: `DOC-TASK-${String(idCounter++).padStart(4, '0')}`,
          type: 'review_outdated_doc',
          priority: ageDays >= 365 ? 'P2' : 'P3',
          status: 'todo',
          title: `Review aging document ${doc.path}`,
          paths: [doc.path],
          rationale: 'Document has not been updated recently and has no explicit code links.',
          evidence: {
            ageDays: Number(ageDays.toFixed(1)),
            docModifiedEpoch: doc.modified,
          },
          subtasks: [
            'Decide whether this doc is still actively needed.',
            'If still needed, refresh with current platform/framework state.',
            'If superseded, archive and point to canonical replacement.',
          ],
        });
      }
    }
  }

  // Sort tasks by priority then id
  tasks.sort((a, b) => {
    const p = priorityValue(a.priority) - priorityValue(b.priority);
    if (p !== 0) return p;
    return a.id.localeCompare(b.id);
  });

  const byType = tasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.type] = (acc[task.type] || 0) + 1;
    return acc;
  }, {});
  const byPriority = tasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {});

  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      applyExactDuplicates: APPLY_EXACT_DUPLICATES,
      applyNearDuplicatesSafe: APPLY_NEAR_DUPLICATES_SAFE,
      thresholds: {
        freshnessDays: FRESHNESS_DAYS,
        reviewAgeDays: REVIEW_AGE_DAYS,
        nearDuplicateMaxMissingConcepts: NEAR_DUP_MAX_MISSING,
        nearDuplicateSemantics: {
          minPairJaccard: NEAR_DUP_MIN_PAIR_JACCARD,
          minPairMinOverlap: NEAR_DUP_MIN_PAIR_MIN_OVERLAP,
          minSubstantiveConcepts: NEAR_DUP_MIN_SUBSTANTIVE_CONCEPTS,
          minSubstantiveLines: NEAR_DUP_MIN_SUBSTANTIVE_LINES,
        },
      },
      inputs: {
        totalDiscoveredFiles: manifest.metadata?.total_files ?? null,
        totalClassifiedFiles: classified.metadata?.totalFiles ?? null,
        consolidation: consolidation.metadata ?? null,
      },
    },
    summary: {
      managedDocsInScope: docs.length,
      totalTasks: tasks.length,
      byType,
      byPriority,
      applyOperations: applyOperations.length,
    },
    tasks,
    applyOperations,
  };

  ensureDir(EVOLUTION_REPORT_FILE);
  fs.writeFileSync(EVOLUTION_REPORT_FILE, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(EVOLUTION_TASKS_JSON, JSON.stringify(tasks, null, 2) + '\n');
  if (applyOperations.length > 0) {
    fs.writeFileSync(EVOLUTION_APPLY_OPS_JSON, JSON.stringify(applyOperations, null, 2) + '\n');
  } else if (fs.existsSync(EVOLUTION_APPLY_OPS_JSON)) {
    fs.unlinkSync(EVOLUTION_APPLY_OPS_JSON);
  }

  const mdLines: string[] = [];
  mdLines.push('# Documentation Evolution Task Board');
  mdLines.push('');
  mdLines.push(`Generated: ${report.metadata.generatedAt}`);
  mdLines.push('');
  mdLines.push('## Summary');
  mdLines.push('');
  mdLines.push(`- Managed docs in scope: ${docs.length}`);
  mdLines.push(`- Total tasks: ${tasks.length}`);
  mdLines.push(`- Apply mode: ${APPLY_EXACT_DUPLICATES ? 'enabled' : 'disabled'}`);
  mdLines.push(`- Safe near-duplicate apply mode: ${APPLY_NEAR_DUPLICATES_SAFE ? 'enabled' : 'disabled'}`);
  mdLines.push(`- Safe near-duplicate max missing concepts: ${NEAR_DUP_MAX_MISSING}`);
  mdLines.push(`- Archive operations applied: ${applyOperations.length}`);
  mdLines.push('');
  mdLines.push('### By Priority');
  mdLines.push('');
  mdLines.push(`- P0: ${byPriority.P0 || 0}`);
  mdLines.push(`- P1: ${byPriority.P1 || 0}`);
  mdLines.push(`- P2: ${byPriority.P2 || 0}`);
  mdLines.push(`- P3: ${byPriority.P3 || 0}`);
  mdLines.push('');
  mdLines.push('### By Type');
  mdLines.push('');
  for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    mdLines.push(`- ${type}: ${count}`);
  }
  mdLines.push('');
  mdLines.push('## Tasks');
  mdLines.push('');

  for (const task of tasks) {
    mdLines.push(`### ${task.id} [${task.priority}] ${task.title}`);
    mdLines.push('');
    mdLines.push(`- Type: ${task.type}`);
    mdLines.push(`- Status: ${task.status}`);
    mdLines.push(`- Paths: ${task.paths.slice(0, 10).join(', ')}${task.paths.length > 10 ? ', ...' : ''}`);
    mdLines.push(`- Rationale: ${task.rationale}`);
    mdLines.push('- Subtasks:');
    for (const subtask of task.subtasks) {
      mdLines.push(`  - [ ] ${subtask}`);
    }
    mdLines.push('- Evidence:');
    mdLines.push('```json');
    mdLines.push(JSON.stringify(task.evidence, null, 2));
    mdLines.push('```');
    mdLines.push('');
  }

  if (applyOperations.length > 0) {
    mdLines.push('## Apply Operations');
    mdLines.push('');
    for (const op of applyOperations) {
      mdLines.push(`- Archived \`${op.archivedPath}\` -> \`${op.archiveDestination}\` (canonical: \`${op.canonicalPath}\`)`);
    }
    mdLines.push('');
  }

  fs.writeFileSync(EVOLUTION_TASKS_MD, mdLines.join('\n') + '\n');

  console.log('');
  console.log('✅ Stage 5 complete');
  console.log(`   - Report: ${EVOLUTION_REPORT_FILE}`);
  console.log(`   - Tasks JSON: ${EVOLUTION_TASKS_JSON}`);
  console.log(`   - Tasks Markdown: ${EVOLUTION_TASKS_MD}`);
  if (applyOperations.length > 0) {
    console.log(`   - Apply operations: ${EVOLUTION_APPLY_OPS_JSON}`);
  }
  console.log('');
  console.log(`   Total tasks generated: ${tasks.length}`);
  console.log(`   High priority tasks (P0/P1): ${(byPriority.P0 || 0) + (byPriority.P1 || 0)}`);
}

main();
