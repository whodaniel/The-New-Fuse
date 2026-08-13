#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

function parseArgs(argv) {
  const args = {
    inputPath: path.join(
      process.cwd(),
      '.kilo',
      'worktrees',
      'season-saffron',
      'reports',
      'development-journey-local',
      'tnf-development-journey-timeline-events.json'
    ),
    storePath: path.join(process.cwd(), 'data', 'unified-task-ledger.json'),
    userId: '',
    actor: 'tnf-journey-backfill-agent',
    source: 'development-journey-import',
    defaultProject: 'The New Fuse Platform',
    dryRun: false,
    backup: true,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if ((token === '--input' || token === '--input-path') && next) {
      args.inputPath = path.resolve(next);
      i += 1;
      continue;
    }
    if ((token === '--store' || token === '--store-path') && next) {
      args.storePath = path.resolve(next);
      i += 1;
      continue;
    }
    if ((token === '--user' || token === '--user-id') && next) {
      args.userId = String(next).trim();
      i += 1;
      continue;
    }
    if (token === '--actor' && next) {
      args.actor = String(next).trim();
      i += 1;
      continue;
    }
    if (token === '--source' && next) {
      args.source = String(next).trim();
      i += 1;
      continue;
    }
    if ((token === '--default-project' || token === '--project') && next) {
      args.defaultProject = String(next).trim();
      i += 1;
      continue;
    }
    if (token === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (token === '--no-backup') {
      args.backup = false;
      continue;
    }
  }

  return args;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 160);
}

function ensureStoreShape(store) {
  return {
    records: Array.isArray(store?.records) ? store.records : [],
    timelineEvents: Array.isArray(store?.timelineEvents) ? store.timelineEvents : [],
    goals: Array.isArray(store?.goals) ? store.goals : [],
    plans: Array.isArray(store?.plans) ? store.plans : [],
  };
}

function normalizeInputArray(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.events)) return parsed.events;
  if (Array.isArray(parsed?.timelineEvents)) return parsed.timelineEvents;
  return [];
}

function resolveUserId(store, preferredUserId) {
  if (preferredUserId) return preferredUserId;
  const counts = new Map();
  for (const event of store.timelineEvents) {
    const id = String(event?.userId || '').trim();
    if (!id) continue;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  return sorted.length ? sorted[0][0] : '';
}

function normalizeConfidence(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'hard' || raw === 'strong' || raw === 'moderate' || raw === 'inferred') {
    return raw;
  }
  return 'moderate';
}

function toCategoryLabel(value) {
  const raw = String(value || 'strategy_doc');
  return raw
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function mapTrack(categoryRaw, text) {
  const category = String(categoryRaw || '').toLowerCase();
  const lower = String(text || '').toLowerCase();

  if (
    category === 'media_experiment' ||
    /\b(music|album|poetry|creative|plugin|artwork|painting|illustration|visual art)\b/.test(lower)
  ) {
    return 'media_and_interactive_systems';
  }
  if (category === 'commit_milestone' || category === 'execution') {
    return 'contribution_velocity_and_operational_scale';
  }
  if (category === 'repo_created' || category === 'migration' || category === 'qa') {
    return 'tnf_platform_evolution';
  }
  if (category === 'project_root') {
    return 'knowledge_and_library_systems';
  }
  return 'cross_repo_experiments';
}

function mapProject(categoryRaw, text, defaultProject) {
  const category = String(categoryRaw || '').toLowerCase();
  const lower = String(text || '').toLowerCase();
  if (/\b(the new fuse novel|new fuse novel|novel)\b/.test(lower)) {
    return 'The New Fuse (Novel)';
  }
  if (
    category === 'media_experiment' ||
    /\b(music|album|poetry|creative|plugin|artwork|painting|illustration|visual art)\b/.test(lower)
  ) {
    return "Daniel Who's Media Empire";
  }
  return defaultProject;
}

function makeEventId() {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function toIsoTimestamp(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function dedupeKeyFromTimestampAndTitle(timestamp, title) {
  return `${toIsoTimestamp(timestamp)}|${slugify(title)}`;
}

function uniqueStrings(items) {
  const out = [];
  const seen = new Set();
  for (const item of items) {
    const text = String(item || '').trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
}

function summarizeBy(items, getter) {
  const result = {};
  for (const item of items) {
    const key = getter(item);
    result[key] = (result[key] || 0) + 1;
  }
  return result;
}

async function main() {
  const args = parseArgs(process.argv);
  const inputRaw = await fs.readFile(args.inputPath, 'utf8');
  const input = normalizeInputArray(JSON.parse(inputRaw));
  if (!input.length) {
    throw new Error(`No events found in input path: ${args.inputPath}`);
  }

  let storeRaw;
  try {
    storeRaw = JSON.parse(await fs.readFile(args.storePath, 'utf8'));
  } catch {
    storeRaw = { records: [], timelineEvents: [], goals: [], plans: [] };
  }
  const store = ensureStoreShape(storeRaw);

  const userId = resolveUserId(store, args.userId);
  if (!userId) {
    throw new Error('Unable to resolve userId. Provide --user-id explicitly.');
  }

  const existingStoryKeys = new Set(
    store.timelineEvents.map((event) => String(event?.payload?.storyKey || '')).filter(Boolean)
  );
  const existingSourceEventIds = new Set(
    store.timelineEvents.map((event) => String(event?.payload?.sourceEventId || '')).filter(Boolean)
  );
  const existingFallbackKeys = new Set(
    store.timelineEvents
      .map((event) => dedupeKeyFromTimestampAndTitle(event?.timestamp, event?.payload?.title || ''))
      .filter(Boolean)
  );

  const sortedInput = [...input].sort(
    (a, b) => new Date(a?.timestamp || 0).getTime() - new Date(b?.timestamp || 0).getTime()
  );

  const imported = [];
  let skippedExisting = 0;
  let skippedInvalid = 0;

  const denom = Math.max(sortedInput.length - 1, 1);
  const importedAt = new Date().toISOString();
  const relInputPath = path.relative(process.cwd(), args.inputPath);

  for (let i = 0; i < sortedInput.length; i += 1) {
    const sourceEvent = sortedInput[i];
    const payload = sourceEvent?.payload || {};
    const timestamp = toIsoTimestamp(sourceEvent?.timestamp);
    const title = String(payload?.label || payload?.title || '').trim();
    const description = String(payload?.summary || payload?.description || '').trim();
    if (!title || !description) {
      skippedInvalid += 1;
      continue;
    }

    const sourceEventId = String(payload?.sourceEventId || slugify(`${timestamp}-${title}`));
    const storyKey = `development-journey:${sourceEventId}`;
    const fallbackKey = dedupeKeyFromTimestampAndTitle(timestamp, title);

    if (
      existingStoryKeys.has(storyKey) ||
      existingSourceEventIds.has(sourceEventId) ||
      existingFallbackKeys.has(fallbackKey)
    ) {
      skippedExisting += 1;
      continue;
    }

    const categoryRaw = String(payload?.category || 'strategy_doc');
    const combinedText = `${title} ${description} ${(payload?.evidenceRefs || []).join(' ')}`;
    const timelineTrack = mapTrack(categoryRaw, combinedText);
    const project = mapProject(categoryRaw, combinedText, args.defaultProject);
    const evidenceRefs = uniqueStrings(Array.isArray(payload?.evidenceRefs) ? payload.evidenceRefs : []);
    const point = Math.round((i / denom) * 100);

    const timelineEvent = {
      id: makeEventId(),
      userId,
      eventType: 'historical_event',
      actor: args.actor || String(sourceEvent?.actor || 'tnf-journey-backfill-agent'),
      timestamp,
      payload: {
        title,
        description,
        point,
        category: toCategoryLabel(categoryRaw),
        segment: timelineTrack,
        timelineTrack,
        timelineCategory: 'development-journey',
        project,
        evidenceRefs,
        sources: uniqueStrings([...evidenceRefs, relInputPath]),
        storyKey,
        source: args.source,
        sourceEventId,
        confidence: normalizeConfidence(payload?.confidence),
        isPrivate: true,
        narrativeNodeRefs: [],
        narrativeConnections: [],
        narrativeConnectionRefs: [],
        accessScope: 'owner_and_agents',
        importMetadata: {
          importedAt,
          inputPath: relInputPath,
          originalActor: sourceEvent?.actor || null,
          originalCategory: categoryRaw,
          originalMetadata: payload?.metadata || null,
        },
      },
    };

    imported.push(timelineEvent);
    existingStoryKeys.add(storyKey);
    existingSourceEventIds.add(sourceEventId);
    existingFallbackKeys.add(fallbackKey);
  }

  const summary = {
    ok: true,
    dryRun: args.dryRun,
    userId,
    inputPath: args.inputPath,
    storePath: args.storePath,
    inputEvents: sortedInput.length,
    importedEvents: imported.length,
    skippedExisting,
    skippedInvalid,
    importedByProject: summarizeBy(imported, (event) => event.payload.project),
    importedByTrack: summarizeBy(imported, (event) => event.payload.timelineTrack),
    importedByCategory: summarizeBy(imported, (event) => event.payload.category),
  };

  if (args.dryRun) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (imported.length > 0) {
    const outputStore = ensureStoreShape(store);
    outputStore.timelineEvents.push(...imported);

    await fs.mkdir(path.dirname(args.storePath), { recursive: true });
    if (args.backup) {
      const backupPath = `${args.storePath}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`;
      await fs.writeFile(backupPath, JSON.stringify(store, null, 2));
      summary.backupPath = backupPath;
    }
    await fs.writeFile(args.storePath, `${JSON.stringify(outputStore, null, 2)}\n`, 'utf8');
  }

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
