#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import postgres from 'postgres';

function parseArgs(argv) {
  const args = {
    inputPath: path.join(
      process.cwd(),
      'reports',
      'personal-archaeology',
      'findings',
      'timeline-events-draft-start1-150.json'
    ),
    storePath: path.join(process.cwd(), 'apps', 'api', 'data', 'unified-task-ledger.json'),
    email: undefined,
    userId: undefined,
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
    if (token === '--email' && next) {
      args.email = String(next).trim();
      i += 1;
      continue;
    }
    if ((token === '--user' || token === '--user-id') && next) {
      args.userId = String(next).trim();
      i += 1;
    }
  }

  if (!args.userId && !args.email) {
    throw new Error('Provide --user-id or --email');
  }

  return args;
}

async function resolveUserId({ userId, email }) {
  if (userId) {
    return userId;
  }

  dotenv.config({ path: path.join(process.cwd(), '.env') });
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });

  const dbUrl = process.env.DATABASE_URL || process.env.MARKETPLACE_DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL/MARKETPLACE_DATABASE_URL not set; cannot resolve user by email');
  }

  const sql = postgres(dbUrl, { max: 1, connect_timeout: 8, idle_timeout: 5 });
  try {
    const rows = await sql`
      select id
      from users
      where lower(email) = lower(${email})
      limit 1
    `;
    if (!rows.length) {
      throw new Error(`No user found for email: ${email}`);
    }
    return rows[0].id;
  } finally {
    await sql.end({ timeout: 2 });
  }
}

function ensureStoreShape(store) {
  return {
    records: Array.isArray(store?.records) ? store.records : [],
    timelineEvents: Array.isArray(store?.timelineEvents) ? store.timelineEvents : [],
    goals: Array.isArray(store?.goals) ? store.goals : [],
    plans: Array.isArray(store?.plans) ? store.plans : [],
  };
}

function makeEventId() {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function storyKeyForDraftEvent(event) {
  const startSeq = event?.metadata?.startSeq;
  const endSeq = event?.metadata?.endSeq;
  if (Number.isFinite(startSeq) && Number.isFinite(endSeq)) {
    return `apple-notes-seq-${startSeq}-${endSeq}`;
  }
  return `draft-${String(event?.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
}

function makePayload(draftEvent, storyKey) {
  return {
    title: draftEvent.title,
    description: draftEvent.description,
    point: Number.isFinite(Number(draftEvent.point)) ? Number(draftEvent.point) : 50,
    category: draftEvent.category || 'Personal',
    segment: draftEvent.segment || draftEvent.category || 'Personal',
    confidence: 'moderate',
    evidenceRefs: Array.isArray(draftEvent.evidenceRefs) ? draftEvent.evidenceRefs : [],
    sources: Array.isArray(draftEvent.sources) ? draftEvent.sources : [],
    storyKey,
    source: draftEvent.source || 'personal-archaeology-import',
    isPrivate: true,
    importedAt: new Date().toISOString(),
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const userId = await resolveUserId(args);

  const rawDraft = await fs.readFile(args.inputPath, 'utf8');
  const draft = JSON.parse(rawDraft);
  const draftEvents = Array.isArray(draft?.events) ? draft.events : [];
  if (!draftEvents.length) {
    throw new Error(`No events found in draft input: ${args.inputPath}`);
  }

  let currentStore;
  try {
    currentStore = JSON.parse(await fs.readFile(args.storePath, 'utf8'));
  } catch {
    currentStore = { records: [], timelineEvents: [], goals: [], plans: [] };
  }

  const store = ensureStoreShape(currentStore);
  const existing = store.timelineEvents.filter((event) => event.userId === userId);
  const existingStoryKeys = new Set(
    existing
      .map((event) => event?.payload?.storyKey)
      .filter((value) => typeof value === 'string' && value.length > 0)
  );

  let created = 0;
  for (const event of draftEvents) {
    const storyKey = storyKeyForDraftEvent(event);
    if (existingStoryKeys.has(storyKey)) {
      continue;
    }

    const timestamp =
      typeof event.timestamp === 'string' && !Number.isNaN(Date.parse(event.timestamp))
        ? new Date(event.timestamp).toISOString()
        : new Date().toISOString();

    store.timelineEvents.push({
      id: makeEventId(),
      userId,
      eventType: 'historical_event',
      actor: userId,
      timestamp,
      payload: makePayload(event, storyKey),
    });

    existingStoryKeys.add(storyKey);
    created += 1;
  }

  await fs.mkdir(path.dirname(args.storePath), { recursive: true });
  await fs.writeFile(args.storePath, `${JSON.stringify(store, null, 2)}\n`, 'utf8');

  const totalForUser = store.timelineEvents.filter((event) => event.userId === userId).length;
  console.log(
    JSON.stringify(
      {
        ok: true,
        userId,
        storePath: args.storePath,
        inputPath: args.inputPath,
        created,
        totalForUser,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
