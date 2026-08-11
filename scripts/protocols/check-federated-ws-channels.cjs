#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { WebSocket } = require('ws');
const {
  buildRelayAgentRegister,
  buildRelayMessageSend,
  buildWorkerAgentIdentity,
} = require('../lib/federation-protocol.cjs');

const ROOT = path.resolve(__dirname, '../..');
const REPORT_DIR = path.join(ROOT, 'docs/protocols/reports');
const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const writeMode = args.includes('--write');
const keepAlive = args.includes('--keep-alive');
const relayUrl = readOption('--url', process.env.TNF_RELAY_WS_URL || 'ws://127.0.0.1:3000/ws');
const timeoutMs = readIntOption('--timeout-ms', 10000);
const settleMs = readIntOption('--settle-ms', 1500);
const holdMs = readIntOption('--hold-ms', keepAlive ? 0 : 8000);

function readOption(name, fallback) {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1] || fallback;
}

function readIntOption(name, fallback) {
  const value = Number.parseInt(readOption(name, String(fallback)), 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function envelope(type, source, payload = {}, channel) {
  return JSON.stringify({
    id: crypto.randomUUID(),
    type,
    source,
    channel,
    timestamp: Date.now(),
    payload,
  });
}

function protocolEnvelope(message) {
  return JSON.stringify({
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    ...message,
  });
}

async function connectAgent(agent, runId, clients, events) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(relayUrl);
    const state = {
      id: agent.id,
      ws,
      confirmed: false,
      inbox: [],
      channelMessages: [],
    };
    clients.set(agent.id, state);

    const timer = setTimeout(() => {
      reject(new Error(`timeout registering ${agent.id}; events=${state.inbox.map((msg) => msg.type).join(',')}`));
    }, timeoutMs);

    ws.on('open', () => {
      ws.send(protocolEnvelope(buildRelayAgentRegister(agent.identity, {
        name: agent.name,
        platform: agent.platform,
        capabilities: agent.capabilities || ['federated-ws-channel-check'],
        channels: agent.channels,
        metadata: {
          runId,
          ...(agent.metadata || {}),
        },
      })));
    });

    ws.on('message', (data) => {
      const parsed = JSON.parse(data.toString());
      state.inbox.push(parsed);
      events.push({ agentId: agent.id, type: parsed.type });

      if (parsed.type === 'REGISTRATION_ERROR') {
        clearTimeout(timer);
        reject(new Error(`${agent.id} registration error: ${JSON.stringify(parsed.payload)}`));
        return;
      }

      if (parsed.type === 'REGISTRATION_CONFIRMED') {
        state.confirmed = true;
        for (const channelId of agent.channels) {
          ws.send(envelope('CHANNEL_JOIN', agent.id, { channelId }));
        }
        clearTimeout(timer);
        resolve(state);
        return;
      }

      if (parsed.type === 'CHANNEL_MESSAGE') {
        state.channelMessages.push(parsed.payload || parsed);
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function hasToken(state, token) {
  return state.channelMessages.some((msg) => JSON.stringify(msg).includes(token));
}

function hasFederatedIdentity(state, identity) {
  return state.channelMessages.some((msg) => {
    const haystack = JSON.stringify(msg);
    return (
      haystack.includes(identity.idNumber) &&
      haystack.includes(identity.operationalHandle) &&
      (!identity.canonicalEntityId || haystack.includes(identity.canonicalEntityId))
    );
  });
}

async function waitForDelivery(connected, agents, greenToken, blueToken) {
  const startedAt = Date.now();
  let snapshot = null;
  while (Date.now() - startedAt <= holdMs) {
    snapshot = {
      greenDelivery: {
        gemini: hasToken(connected.gemini, greenToken),
        greenObserver: hasToken(connected.greenObserver, greenToken),
        blueLeakToGemini: hasToken(connected.gemini, blueToken),
        blueLeakToGreenObserver: hasToken(connected.greenObserver, blueToken),
      },
      blueDelivery: {
        kimi: hasToken(connected.kimi, blueToken),
        blueObserver: hasToken(connected.blueObserver, blueToken),
        greenLeakToKimi: hasToken(connected.kimi, greenToken),
        greenLeakToBlueObserver: hasToken(connected.blueObserver, greenToken),
      },
      identityDelivery: {
        greenHasSubdirectorId: hasFederatedIdentity(connected.gemini, agents.subGreen.identity),
        blueHasSubdirectorId: hasFederatedIdentity(connected.kimi, agents.subBlue.identity),
        geminiRegisteredIdNumber: agents.gemini.identity.idNumber,
        kimiRegisteredIdNumber: agents.kimi.identity.idNumber,
        subdirectorGreenIdNumber: agents.subGreen.identity.idNumber,
        subdirectorBlueIdNumber: agents.subBlue.identity.idNumber,
      },
    };
    const delivered =
      snapshot.greenDelivery.gemini &&
      snapshot.greenDelivery.greenObserver &&
      snapshot.blueDelivery.kimi &&
      snapshot.blueDelivery.blueObserver &&
      snapshot.identityDelivery.greenHasSubdirectorId &&
      snapshot.identityDelivery.blueHasSubdirectorId;
    if (delivered) return snapshot;
    await sleep(250);
  }
  return snapshot;
}

function closeClients(clients) {
  for (const state of clients.values()) {
    try {
      state.ws.close();
    } catch {
      // best effort
    }
  }
}

function holdBridgeClients(clients) {
  const interval = setInterval(() => {
    for (const state of clients.values()) {
      if (state.ws.readyState === WebSocket.OPEN) {
        state.ws.send(envelope('HEARTBEAT', state.id, { generatedAt: new Date().toISOString() }));
      }
    }
  }, 30000);

  const shutdown = () => {
    clearInterval(interval);
    closeClients(clients);
    process.exit(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

async function runCheck() {
  const runId = `fed-ws-${Date.now()}`;
  const greenToken = `TNF_GREEN_GEMINI_ONBOARD_${runId}`;
  const blueToken = `TNF_BLUE_KIMI_K3_ONBOARD_${runId}`;
  const clients = new Map();
  const events = [];

  const agents = {
    gemini: {
      id: 'web-gemini-green-agent',
      name: 'Gemini Web Green Agent',
      platform: 'gemini-web',
      channels: ['Green', 'fuse-activity-log'],
      metadata: {
        onboarding: 'fresh-context-required',
        assignedChannel: 'Green',
        webModel: 'Gemini',
      },
    },
    kimi: {
      id: 'web-kimi-k3-blue-agent',
      name: 'Kimi K3 Web Blue Agent',
      platform: 'kimi-k3-web',
      channels: ['Blue', 'fuse-activity-log'],
      metadata: {
        onboarding: 'fresh-context-required',
        assignedChannel: 'Blue',
        webModel: 'Kimi K3',
      },
    },
    greenObserver: {
      id: `${runId}-green-observer`,
      name: 'Green Channel Observer',
      platform: 'qa-probe',
      channels: ['Green'],
      metadata: { observerFor: 'Green' },
    },
    blueObserver: {
      id: `${runId}-blue-observer`,
      name: 'Blue Channel Observer',
      platform: 'qa-probe',
      channels: ['Blue'],
      metadata: { observerFor: 'Blue' },
    },
    subGreen: {
      id: `${runId}-subdirector-green-bridge`,
      name: 'Local Subdirector Green Bridge',
      platform: 'tnf-local-runtime',
      channels: ['Green'],
      metadata: { representedAgentId: 'tnf-local-subdirector' },
    },
    subBlue: {
      id: `${runId}-subdirector-blue-bridge`,
      name: 'Local Subdirector Blue Bridge',
      platform: 'tnf-local-runtime',
      channels: ['Blue'],
      metadata: { representedAgentId: 'tnf-local-subdirector' },
    },
  };

  for (const [key, agent] of Object.entries(agents)) {
    const channel = agent.channels[0] || null;
    const provider =
      key === 'gemini'
        ? 'GOOGLE_GEMINI'
        : key === 'kimi'
          ? 'MOONSHOT_KIMI'
          : 'TNF_RUNTIME';
    agent.identity = buildWorkerAgentIdentity({
      id: agent.id,
      operationalHandle: agent.id.toUpperCase().replace(/_/g, '-'),
      platform: agent.platform,
      provider,
      channelId: channel,
      daccRole: key.startsWith('sub') ? 'broker' : 'participant',
      aliases: [agent.id, agent.name, agent.platform, ...(agent.metadata?.webModel ? [agent.metadata.webModel] : [])],
      canonicalEntityIdParts: {
        category: 'AGENT',
        provider: 'TNF',
        name: provider,
        instance: key === 'kimi' ? 'BLUE' : key === 'gemini' ? 'GREEN' : channel || '001',
        scope: 'LOCAL',
      },
    });
  }

  const connected = {};
  for (const [key, agent] of Object.entries(agents)) {
    connected[key] = await connectAgent(agent, runId, clients, events);
  }

  await sleep(settleMs);
  connected.subGreen.ws.send(protocolEnvelope(buildRelayMessageSend(agents.subGreen.identity, {
    to: 'broadcast',
    channel: 'Green',
    content:
      `Local Subdirector onboarding for Gemini Web on Green. TOKEN:${greenToken}\n` +
      'Execute TNF Turn Zero, treat this as fresh context, stay on Green, report status/blockers, and do not assume prior TNF context.',
    metadata: { onboarding: true, target: 'Gemini Web', runId, expectedChannel: 'Green' },
  })));
  connected.subBlue.ws.send(protocolEnvelope(buildRelayMessageSend(agents.subBlue.identity, {
    to: 'broadcast',
    channel: 'Blue',
    content:
      `Local Subdirector onboarding for Kimi K3 Web on Blue. TOKEN:${blueToken}\n` +
      'Execute TNF Turn Zero, treat this as fresh context, stay on Blue, report status/blockers, and do not assume prior TNF context.',
    metadata: { onboarding: true, target: 'Kimi K3 Web', runId, expectedChannel: 'Blue' },
  })));

  const deliverySnapshot = await waitForDelivery(connected, agents, greenToken, blueToken);

  const result = {
    schema: 'tnf.federated-ws-channel-check.v1',
    generatedAt: new Date().toISOString(),
    host: os.hostname(),
    root: ROOT,
    relayUrl,
    runId,
    keepAlive,
    settleMs,
    holdMs,
    greenToken,
    blueToken,
    confirmed: Object.fromEntries([...clients].map(([id, state]) => [id, state.confirmed])),
    greenDelivery: deliverySnapshot.greenDelivery,
    blueDelivery: deliverySnapshot.blueDelivery,
    identityDelivery: deliverySnapshot.identityDelivery,
    receivedCounts: Object.fromEntries([...clients].map(([id, state]) => [id, state.channelMessages.length])),
    eventTypes: events.slice(0, 80).map((entry) => `${entry.agentId}:${entry.type}`),
  };

  result.ok =
    Object.values(result.confirmed).every(Boolean) &&
    result.greenDelivery.gemini &&
    result.greenDelivery.greenObserver &&
    !result.greenDelivery.blueLeakToGemini &&
    !result.greenDelivery.blueLeakToGreenObserver &&
    result.blueDelivery.kimi &&
    result.blueDelivery.blueObserver &&
    !result.blueDelivery.greenLeakToKimi &&
    !result.blueDelivery.greenLeakToBlueObserver &&
    result.identityDelivery.greenHasSubdirectorId &&
    result.identityDelivery.blueHasSubdirectorId;
  result.verdict = result.ok ? 'pass' : 'fail';

  if (writeMode) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
    const reportPath = path.join(REPORT_DIR, 'FEDERATED_WS_CHANNEL_CHECK_LATEST.json');
    fs.writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`);
    result.reportPath = reportPath;
  }

  if (!keepAlive) {
    closeClients(clients);
    await sleep(150);
  }

  return { result, clients };
}

runCheck()
  .then(async ({ result, clients }) => {
    if (jsonMode) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Federated WS channel check: ${result.verdict.toUpperCase()}`);
      console.log(`- Green/Gemini delivered: ${result.greenDelivery.gemini}`);
      console.log(`- Blue/Kimi delivered: ${result.blueDelivery.kimi}`);
      console.log(`- Federated ID# metadata delivered: ${result.identityDelivery.greenHasSubdirectorId && result.identityDelivery.blueHasSubdirectorId}`);
      console.log(`- Cross-channel leaks: ${result.greenDelivery.blueLeakToGemini || result.blueDelivery.greenLeakToKimi}`);
      if (result.reportPath) console.log(`report: ${result.reportPath}`);
      if (keepAlive) console.log('bridge agents are staying connected until this process exits');
    }
    if (keepAlive) {
      holdBridgeClients(clients);
      await new Promise(() => {});
    }
    process.exit(result.ok ? 0 : 1);
  })
  .catch((err) => {
    console.error(err.stack || err.message || String(err));
    process.exit(1);
  });
