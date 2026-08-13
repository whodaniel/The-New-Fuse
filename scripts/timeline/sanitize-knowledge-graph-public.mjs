#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const DEFAULT_INPUT = path.join(
  process.cwd(),
  '.documentation-system',
  'analysis',
  'knowledge-graph.json'
);

const DEFAULT_OUTPUT = path.join(
  process.cwd(),
  '.documentation-system',
  'analysis',
  'knowledge-graph.public.json'
);

const DEFAULT_REPORT = path.join(
  process.cwd(),
  '.documentation-system',
  'analysis',
  'knowledge-graph.public.report.json'
);

function printUsage() {
  console.log(`
Create a publish-safe knowledge graph artifact.

Usage:
  node scripts/timeline/sanitize-knowledge-graph-public.mjs [options]

Options:
  --input <path>       Source knowledge graph JSON
  --output <path>      Publish-safe output JSON
  --report <path>      Cleanup report JSON
  --repo-root <path>   Repository root used to relativize local paths
`);
}

function parseArgs(argv) {
  const args = {
    input: DEFAULT_INPUT,
    output: DEFAULT_OUTPUT,
    report: DEFAULT_REPORT,
    repoRoot: process.cwd(),
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if ((token === '--input' || token === '--source') && next) {
      args.input = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--input=')) {
      args.input = path.resolve(token.slice('--input='.length));
      continue;
    }
    if ((token === '--output' || token === '--out') && next) {
      args.output = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--output=')) {
      args.output = path.resolve(token.slice('--output='.length));
      continue;
    }
    if (token === '--report' && next) {
      args.report = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--report=')) {
      args.report = path.resolve(token.slice('--report='.length));
      continue;
    }
    if (token === '--repo-root' && next) {
      args.repoRoot = path.resolve(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--repo-root=')) {
      args.repoRoot = path.resolve(token.slice('--repo-root='.length));
      continue;
    }
    if (token === '-h' || token === '--help') {
      printUsage();
      process.exit(0);
    }
    throw new Error(`Unknown option: ${token}`);
  }

  return args;
}

function toPosixPath(value) {
  return String(value || '').replaceAll('\\', '/');
}

function sanitizePath(value, repoRootPosix, counters) {
  if (typeof value !== 'string') return value;
  if (!value.startsWith('/Users/')) return value;

  counters.absoluteUsersPathsFound += 1;

  const normalized = toPosixPath(value);
  const repoPrefix = `${repoRootPosix}/`;
  if (normalized.startsWith(repoPrefix)) {
    counters.absoluteUsersPathsRelativized += 1;
    return `./${normalized.slice(repoPrefix.length)}`;
  }

  counters.absoluteUsersPathsRedacted += 1;
  return normalized.replace(/^\/Users\/[^/]+/, '/Users/<redacted>');
}

function pushUnique(values, next) {
  if (!values.includes(next)) values.push(next);
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

async function main() {
  const args = parseArgs(process.argv);
  const repoRootPosix = toPosixPath(path.resolve(args.repoRoot));

  const sourceRaw = await fs.readFile(args.input, 'utf8');
  const sourceHash = sha256(sourceRaw);
  const parsed = JSON.parse(sourceRaw);

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof parsed.concepts !== 'object' ||
    !Array.isArray(parsed.relationships) ||
    typeof parsed.dependencies !== 'object'
  ) {
    throw new Error('Input does not match expected knowledge graph shape.');
  }

  const counters = {
    absoluteUsersPathsFound: 0,
    absoluteUsersPathsRelativized: 0,
    absoluteUsersPathsRedacted: 0,
    relationshipsBefore: parsed.relationships.length,
    relationshipsAfter: 0,
    relationshipsDuplicateGroups: 0,
    relationshipsDuplicateEdgesRemoved: 0,
    dependencyEntriesBefore: Object.keys(parsed.dependencies).length,
    dependencyEntriesAfter: 0,
  };

  const concepts = {};
  for (const [conceptId, conceptValue] of Object.entries(parsed.concepts || {})) {
    const item = conceptValue && typeof conceptValue === 'object' ? conceptValue : {};
    const nextSources = [];
    for (const source of Array.isArray(item.sources) ? item.sources : []) {
      const sanitized = sanitizePath(source, repoRootPosix, counters);
      pushUnique(nextSources, sanitized);
    }
    concepts[conceptId] = {
      ...item,
      sources: nextSources,
      relatedConcepts: Array.isArray(item.relatedConcepts) ? item.relatedConcepts : [],
      frequency: Number.isFinite(item.frequency) ? item.frequency : Number(item.frequency || 0),
    };
  }

  const seenRelationships = new Map();
  const relationships = [];
  for (const rel of parsed.relationships) {
    const from = rel?.from;
    const to = rel?.to;
    const type = rel?.type;
    const source = sanitizePath(rel?.source, repoRootPosix, counters);
    const key = `${String(from)}\u0000${String(to)}\u0000${String(type)}\u0000${String(source)}`;
    const seenCount = seenRelationships.get(key) || 0;
    seenRelationships.set(key, seenCount + 1);
    if (seenCount > 0) {
      counters.relationshipsDuplicateEdgesRemoved += 1;
      continue;
    }
    relationships.push({ from, to, type, source });
  }

  for (const count of seenRelationships.values()) {
    if (count > 1) counters.relationshipsDuplicateGroups += 1;
  }

  const dependencies = {};
  for (const [filePath, refs] of Object.entries(parsed.dependencies || {})) {
    const sanitizedKey = sanitizePath(filePath, repoRootPosix, counters);
    const sanitizedRefs = [];
    for (const ref of Array.isArray(refs) ? refs : []) {
      const sanitizedRef = sanitizePath(ref, repoRootPosix, counters);
      pushUnique(sanitizedRefs, sanitizedRef);
    }
    dependencies[sanitizedKey] = sanitizedRefs;
  }

  counters.relationshipsAfter = relationships.length;
  counters.dependencyEntriesAfter = Object.keys(dependencies).length;

  const output = {
    concepts,
    relationships,
    dependencies,
  };

  const outputRaw = JSON.stringify(output, null, 2);
  const outputHash = sha256(outputRaw);

  await fs.mkdir(path.dirname(args.output), { recursive: true });
  await fs.mkdir(path.dirname(args.report), { recursive: true });

  await fs.writeFile(args.output, outputRaw);

  const report = {
    generatedAtIso: new Date().toISOString(),
    source: {
      path: args.input,
      sha256: sourceHash,
      sizeBytes: Buffer.byteLength(sourceRaw),
    },
    output: {
      path: args.output,
      sha256: outputHash,
      sizeBytes: Buffer.byteLength(outputRaw),
    },
    counters,
  };

  await fs.writeFile(args.report, JSON.stringify(report, null, 2));

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(`sanitize-knowledge-graph-public failed: ${error.message}`);
  process.exitCode = 1;
});
