#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const ROOT = process.cwd();
const DEFAULT_MANIFEST = path.join(
  ROOT,
  'apps/casin8-games/docs/NANOBANANA_POKER_GRAPHICS_TASK_PACKET.json'
);

function parseArgs(argv) {
  const out = {
    relayUrl: process.env.RELAY_URL || process.env.TNF_RELAY_URL || process.env.RELAY_WS_URL || 'ws://127.0.0.1:3000/ws',
    channelRegex: process.env.CHANNEL_REGEX || 'red',
    manifestPath: process.env.MANIFEST_PATH || DEFAULT_MANIFEST,
    batchSize: Number(process.env.BATCH_SIZE || 6),
    batchDelayMs: Number(process.env.BATCH_DELAY_MS || 2500),
    maxAssets: Number(process.env.MAX_ASSETS || 0),
    assetId: process.env.ASSET_ID || '',
    monitorMs: Number(process.env.MONITOR_MS || 180000),
    channelId: process.env.CHANNEL_ID || '',
    compatibilityMode: process.env.COMPAT_MODE !== 'false',
    dryRun: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--relay-url' && argv[i + 1]) out.relayUrl = argv[++i];
    else if (a === '--channel-regex' && argv[i + 1]) out.channelRegex = argv[++i];
    else if (a === '--manifest' && argv[i + 1]) out.manifestPath = argv[++i];
    else if (a === '--batch-size' && argv[i + 1]) out.batchSize = Number(argv[++i]);
    else if (a === '--batch-delay-ms' && argv[i + 1]) out.batchDelayMs = Number(argv[++i]);
    else if (a === '--max-assets' && argv[i + 1]) out.maxAssets = Number(argv[++i]);
    else if (a === '--asset-id' && argv[i + 1]) out.assetId = argv[++i];
    else if (a === '--monitor-ms' && argv[i + 1]) out.monitorMs = Number(argv[++i]);
    else if (a === '--channel-id' && argv[i + 1]) out.channelId = argv[++i];
    else if (a === '--compat-mode') out.compatibilityMode = true;
    else if (a === '--no-compat-mode') out.compatibilityMode = false;
    else if (a === '--dry-run') out.dryRun = true;
  }
  return out;
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunk(items, size) {
  if (size <= 0) return [items];
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function loadManifest(manifestPath) {
  const abs = path.resolve(manifestPath);
  const raw = JSON.parse(fs.readFileSync(abs, 'utf8'));
  if (Array.isArray(raw.assets)) {
    return {
      globalStyleBlock: raw.globalStyleBlock || '',
      tasks: raw.assets.map((a) => ({
        id: a.id,
        lane: a.lane || null,
        groupName: a.groupName,
        filename: a.filename,
        expectedDimensions: a.expectedDimensions,
        requiredVariants: a.requiredVariants || [],
        prompt: a.prompt,
      })),
      sourcePath: abs,
    };
  }
  if (Array.isArray(raw.tasks)) {
    return {
      globalStyleBlock:
        raw.globalStyleBlock ||
        raw.tasks[0]?.promptParts?.globalStyleBlock ||
        '',
      tasks: raw.tasks.map((t) => ({
        id: t.assetId || t.taskId,
        lane: t.lane || null,
        groupName: t.groupName,
        filename: t.filename,
        expectedDimensions: t.expectedDimensions,
        requiredVariants: t.requiredVariants || [],
        prompt: t.prompt || t.promptParts?.assetPrompt || '',
      })),
      sourcePath: abs,
    };
  }
  throw new Error(`Expected assets[] or tasks[] in ${abs}`);
}

function buildRelayEnvelope(type, sourceId, payload = {}, channel) {
  return {
    id: makeId(type.toLowerCase()),
    type,
    source: sourceId,
    timestamp: Date.now(),
    channel,
    payload,
  };
}

function buildPromptBody(globalStyle, asset) {
  return [
    '[GRAPHICS_SWARM_TASK]',
    `asset_id: ${asset.id}`,
    `filename: ${asset.filename}`,
    `group: ${asset.groupName}`,
    `expected_dimensions: ${asset.expectedDimensions?.width || '?'}x${asset.expectedDimensions?.height || '?'}`,
    `required_variants: ${(asset.requiredVariants || []).join(', ') || 'n/a'}`,
    '',
    'global_style_block:',
    '```text',
    globalStyle || '',
    '```',
    '',
    'asset_prompt:',
    '```text',
    asset.prompt || '',
    '```',
    '',
    'output_requirements:',
    '- Return with TASK_RESULT tag and include asset_id + filename.',
    '- Include direct download URL(s) for generated file(s).',
    '- If set asset: return one file per required variant.',
  ].join('\n');
}

async function main() {
  const cfg = parseArgs(process.argv);
  const packet = loadManifest(cfg.manifestPath);
  const channelRegex = new RegExp(cfg.channelRegex, 'i');
  const agentId = makeId('codex-red-graphics');
  const runId = makeId('graphics-run');

  const allAssets = packet.tasks;
  let assets = allAssets;
  if (cfg.assetId) {
    assets = allAssets.filter((a) => a.id === cfg.assetId || a.taskId === cfg.assetId || a.filename === cfg.assetId);
  } else if (cfg.maxAssets > 0) {
    assets = allAssets.slice(0, cfg.maxAssets);
  }
  if (!assets.length) {
    throw new Error(`No assets selected. asset-id=${cfg.assetId || 'n/a'}`);
  }
  const batches = chunk(assets, cfg.batchSize);

  const replies = [];
  const channels = [];
  const joined = new Set();
  let ws = null;
  let readyToSend = false;
  let doneSending = false;
  let listRequestedAt = 0;
  let sendCount = 0;
  let ackCount = 0;

  function send(type, payload = {}, channel) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(buildRelayEnvelope(type, agentId, payload, channel)));
  }

  function log(line, meta) {
    if (meta) console.log(`[relay-red] ${line}`, meta);
    else console.log(`[relay-red] ${line}`);
  }

  function maybeReady() {
    if (!channels.length || !joined.size || readyToSend) return;
    readyToSend = true;
    log(`Joined ${joined.size} red channel(s). Starting prompt broadcast.`);
    void (async () => {
      for (let i = 0; i < batches.length; i += 1) {
        const batch = batches[i];
        log(`Sending batch ${i + 1}/${batches.length} (${batch.length} prompts)`);
        for (const asset of batch) {
          for (const channelId of joined) {
            const body = buildPromptBody(packet.globalStyleBlock, asset);
            const payload = cfg.compatibilityMode
              ? {
                  to: 'broadcast',
                  content: body,
                  messageType: 'text',
                }
              : {
                  messageId: makeId('graphics-task'),
                  to: 'broadcast',
                  content: body,
                  messageType: 'graphics-task',
                  metadata: {
                    senderId: agentId,
                    runId,
                    taskType: 'nanobanana-graphics',
                    assetId: asset.id,
                    filename: asset.filename,
                    group: asset.groupName,
                    requiresResponse: true,
                    priority: 'high',
                  },
                };
            if (!cfg.dryRun) send('MESSAGE_SEND', payload, channelId);
            sendCount += 1;
          }
        }
        if (i < batches.length - 1) {
          await sleep(cfg.batchDelayMs);
        }
      }
      doneSending = true;
      log(`Finished sending ${sendCount} prompt messages. Monitoring replies for ${cfg.monitorMs}ms...`);
    })();
  }

  await new Promise((resolve, reject) => {
    ws = new WebSocket(cfg.relayUrl);

    const timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for relay flow'));
    }, cfg.monitorMs + 120000);

    ws.on('open', () => {
      log(`Connected to ${cfg.relayUrl}`);
      send('AGENT_REGISTER', {
        agent: {
          id: agentId,
          name: 'Codex Red Graphics Swarm',
          platform: 'codex-cli',
          status: 'active',
          capabilities: ['graphics-task-broadcast', 'relay-monitoring'],
          channels: [],
        },
      });
      listRequestedAt = Date.now();
      send('CHANNEL_LIST', {});
    });

    ws.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === 'CHANNEL_LIST') {
        const discovered = (msg.payload && msg.payload.channels) || [];
        const unique = new Map();
        for (const ch of discovered) {
          const name = String(ch.name || '');
          const id = String(ch.id || '');
          if (!id) continue;
          if (cfg.channelId && id !== cfg.channelId) continue;
          if (!channelRegex.test(name) && !channelRegex.test(id)) continue;
          unique.set(id, { id, name });
        }
        channels.length = 0;
        const dedupByName = new Map();
        for (const ch of Array.from(unique.values())) {
          const key = String(ch.name || ch.id).toLowerCase();
          if (!dedupByName.has(key)) dedupByName.set(key, ch);
        }
        channels.push(...Array.from(dedupByName.values()));
        if (!channels.length) {
          log('No channels matched regex.', { regex: cfg.channelRegex, discovered: discovered.length });
          clearTimeout(timeout);
          ws.close();
          resolve();
          return;
        }
        log(`Matched channels: ${channels.map((c) => `${c.name || 'unnamed'}(${c.id})`).join(', ')}`);
        for (const ch of channels) {
          send('CHANNEL_JOIN', { channelId: ch.id });
        }
        // Some relay builds do not emit CHANNEL_JOINED. Fall back after short delay.
        setTimeout(() => {
          if (readyToSend || joined.size) return;
          for (const ch of channels) joined.add(ch.id);
          log('No CHANNEL_JOINED ack observed; proceeding after join-attempt fallback.');
          maybeReady();
        }, 1500);
        return;
      }

      if (msg.type === 'CHANNEL_JOINED') {
        const channelId = msg.channelId || msg.payload?.channelId;
        if (channelId) {
          joined.add(channelId);
          log(`Joined channel ${channelId}`);
          maybeReady();
        }
        return;
      }

      if (msg.type === 'BROADCAST_ACK') {
        ackCount += 1;
        return;
      }

      if (msg.type !== 'CHANNEL_MESSAGE' && msg.type !== 'MESSAGE_RECEIVE' && msg.type !== 'NEW_MESSAGE') {
        return;
      }

      const payload = msg.payload || msg.message || {};
      const channelId = payload.channel;
      const from = payload.from;
      const content = String(payload.content || '');
      const metadata = payload.metadata || {};

      if (!channelId || !joined.has(channelId)) return;
      if (from === agentId) return;

      const preview = content.replace(/\s+/g, ' ').slice(0, 220);
      console.log(`[reply][${channelId}] ${from}: ${preview}`);

      replies.push({
        at: new Date().toISOString(),
        channelId,
        from,
        metadata,
        content,
      });

      if (doneSending && Date.now() - listRequestedAt >= cfg.monitorMs) {
        // Continue until timer below closes, this keeps logs simple.
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    ws.on('close', () => {
      clearTimeout(timeout);
      resolve();
    });

    setTimeout(() => {
      const outPath = path.join(
        ROOT,
        'apps/casin8-games/docs',
        `NANOBANANA_RELAY_REPLIES_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      );
      fs.writeFileSync(
        outPath,
        JSON.stringify(
          {
            runId,
            relayUrl: cfg.relayUrl,
            inputPacket: packet.sourcePath,
            channelRegex: cfg.channelRegex,
            matchedChannels: channels,
            joinedChannels: Array.from(joined),
            sentMessages: sendCount,
            broadcastAcks: ackCount,
            repliesCount: replies.length,
            replies,
          },
          null,
          2
        )
      );
      log(`Saved replies log: ${outPath}`);
      ws.close();
    }, cfg.monitorMs);
  });
}

main().catch((err) => {
  console.error(`[relay-red] Failed: ${err && err.message ? err.message : String(err)}`);
  process.exit(1);
});
