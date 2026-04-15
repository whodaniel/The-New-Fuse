#!/usr/bin/env node
/* eslint-disable no-console */
const WebSocket = require('ws');

const RELAY_URL = process.env.RELAY_URL || 'ws://localhost:3000/ws';
const AGENT_ID = process.env.AGENT_ID || `codex-monitor-${Date.now()}`;
const AGENT_NAME = process.env.AGENT_NAME || 'Codex Channel Monitor';
const CHANNEL_MODE = process.env.CHANNEL_MODE || 'all'; // all | include | regex
const CHANNEL_INCLUDE = (process.env.CHANNEL_INCLUDE || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const CHANNEL_REGEX = process.env.CHANNEL_REGEX ? new RegExp(process.env.CHANNEL_REGEX, 'i') : null;
const POST_INTRO = process.env.POST_INTRO !== 'false';
const ENGAGE = process.env.ENGAGE === 'true';
const HEARTBEAT_MS = Number(process.env.HEARTBEAT_MS || 25000);
const REFRESH_CHANNELS_MS = Number(process.env.REFRESH_CHANNELS_MS || 30000);
const IDLE_ALERT_MS = Number(process.env.IDLE_ALERT_MS || 120000);
const MAX_ECHO_LEN = Number(process.env.MAX_ECHO_LEN || 220);

let ws = null;
let reconnectTimer = null;
let heartbeatTimer = null;
let refreshTimer = null;
let idleTimer = null;

const joined = new Set();
const channelInfo = new Map();
const lastSeenAt = new Map();

function now() {
  return Date.now();
}

function build(type, payload = {}, channel) {
  return {
    id: `${now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    source: AGENT_ID,
    timestamp: now(),
    channel,
    payload,
  };
}

function send(type, payload = {}, channel) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(build(type, payload, channel)));
}

function log(msg, meta) {
  if (meta) {
    console.log(`[monitor] ${msg}`, meta);
  } else {
    console.log(`[monitor] ${msg}`);
  }
}

function shouldJoinChannel(ch) {
  if (!ch || !ch.id) return false;
  if (CHANNEL_MODE === 'all') return true;
  if (CHANNEL_MODE === 'include') {
    return CHANNEL_INCLUDE.includes(ch.id) || CHANNEL_INCLUDE.includes((ch.name || '').toLowerCase());
  }
  if (CHANNEL_MODE === 'regex') {
    if (!CHANNEL_REGEX) return false;
    return CHANNEL_REGEX.test(ch.id) || CHANNEL_REGEX.test(ch.name || '');
  }
  return false;
}

function joinMatchingChannels(channels) {
  for (const ch of channels) {
    channelInfo.set(ch.id, ch);
    if (!shouldJoinChannel(ch)) continue;
    if (joined.has(ch.id)) continue;
    joined.add(ch.id);
    send('CHANNEL_JOIN', { channelId: ch.id });
    lastSeenAt.set(ch.id, now());
    log(`Joined channel`, { id: ch.id, name: ch.name });
    if (POST_INTRO) {
      send(
        'MESSAGE_SEND',
        {
          messageId: `intro-${now()}`,
          to: 'broadcast',
          content: `Codex monitor online in ${ch.name || ch.id}.`,
          messageType: 'text',
          metadata: {
            senderId: AGENT_ID,
            senderHost: 'codex-cli',
            senderUrl: 'local-monitor://codex',
          },
        },
        ch.id
      );
    }
  }
}

function extractWakePing(payload) {
  const metadata = payload?.metadata || {};
  const content = String(payload?.content || '');
  if (metadata.eventType === 'wake_ping') {
    return {
      pingId: String(metadata.pingId || `wake-${now()}`),
      reason: String(metadata.reason || 'wake-ping'),
    };
  }
  const m = content.match(/\[WAKE_PING(?:\s+([^\]]+))?\]/i);
  if (m) {
    return {
      pingId: (m[1] || `wake-${now()}`).trim(),
      reason: 'wake-ping-content',
    };
  }
  return null;
}

function ackWakePing(channelId, ping) {
  send(
    'MESSAGE_SEND',
    {
      messageId: `wake-ack-${now()}`,
      to: 'broadcast',
      content: `[WAKE_ACK ${ping.pingId}] ${AGENT_NAME} active in ${channelId}`,
      messageType: 'event',
      metadata: {
        senderId: AGENT_ID,
        eventType: 'wake_ack',
        pingId: ping.pingId,
        reason: ping.reason,
      },
    },
    channelId
  );
  send('MESSAGE_SEND', {
    messageId: `wake-ack-log-${now()}`,
    to: 'broadcast',
    channel: 'fuse-activity-log',
    content: `[ACTIVITY] wake_ack`,
    messageType: 'event',
    metadata: {
      senderId: AGENT_ID,
      eventType: 'wake_ack',
      activityChannel: channelId,
      pingId: ping.pingId,
      reason: ping.reason,
    },
  }, 'fuse-activity-log');
}

function maybeEngage(channelId, payload) {
  if (!ENGAGE) return;
  const text = String(payload?.content || '').replace(/\s+/g, ' ').trim();
  if (!text) return;
  if (text.includes('[monitor]') || text.includes('[WAKE_ACK')) return;
  const clipped = text.length > MAX_ECHO_LEN ? `${text.slice(0, MAX_ECHO_LEN)}...` : text;
  send(
    'MESSAGE_SEND',
    {
      messageId: `engage-${now()}`,
      to: 'broadcast',
      content: `[monitor] Observed: ${clipped}`,
      messageType: 'text',
      metadata: {
        senderId: AGENT_ID,
        eventType: 'monitor_observation',
      },
    },
    channelId
  );
}

function onRelayMessage(msg) {
  if (msg.type === 'CHANNEL_LIST') {
    const channels = msg.payload?.channels || [];
    joinMatchingChannels(channels);
    return;
  }

  if (msg.type !== 'CHANNEL_MESSAGE' && msg.type !== 'MESSAGE_RECEIVE') return;
  const payload = msg.payload || {};
  const channelId = payload.channel;
  if (!channelId || !joined.has(channelId)) return;
  if (payload.from === AGENT_ID) return;

  lastSeenAt.set(channelId, now());
  const line = String(payload.content || '').replace(/\s+/g, ' ').slice(0, 250);
  console.log(`[${channelInfo.get(channelId)?.name || channelId}] ${payload.from}: ${line}`);

  const ping = extractWakePing(payload);
  if (ping) {
    ackWakePing(channelId, ping);
    return;
  }
  maybeEngage(channelId, payload);
}

function startTimers() {
  clearInterval(heartbeatTimer);
  clearInterval(refreshTimer);
  clearInterval(idleTimer);

  heartbeatTimer = setInterval(() => {
    send('HEARTBEAT', {});
  }, HEARTBEAT_MS);

  refreshTimer = setInterval(() => {
    send('CHANNEL_LIST', {});
  }, REFRESH_CHANNELS_MS);

  idleTimer = setInterval(() => {
    const t = now();
    for (const channelId of joined) {
      const last = lastSeenAt.get(channelId) || 0;
      if (t - last < IDLE_ALERT_MS) continue;
      const chName = channelInfo.get(channelId)?.name || channelId;
      send('MESSAGE_SEND', {
        messageId: `idle-log-${now()}`,
        to: 'broadcast',
        channel: 'fuse-activity-log',
        content: `[ACTIVITY] monitor_idle`,
        messageType: 'event',
        metadata: {
          senderId: AGENT_ID,
          eventType: 'monitor_idle',
          activityChannel: channelId,
          idleMs: t - last,
          channelName: chName,
        },
      }, 'fuse-activity-log');
      lastSeenAt.set(channelId, t);
    }
  }, Math.min(IDLE_ALERT_MS, 30000));
}

function cleanup() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (refreshTimer) clearInterval(refreshTimer);
  if (idleTimer) clearInterval(idleTimer);
}

function connect() {
  ws = new WebSocket(RELAY_URL);
  ws.on('open', () => {
    log('Connected to relay', { relay: RELAY_URL, agentId: AGENT_ID, channelMode: CHANNEL_MODE });
    send('AGENT_REGISTER', {
      agent: {
        id: AGENT_ID,
        name: AGENT_NAME,
        platform: 'codex-cli',
        status: 'active',
        capabilities: ['monitoring', 'wake-ack', 'channel-discovery'],
        channels: [],
      },
    });
    send('CHANNEL_LIST', {});
    startTimers();
  });

  ws.on('message', (raw) => {
    try {
      onRelayMessage(JSON.parse(raw.toString()));
    } catch (e) {
      log('Failed to parse relay message');
    }
  });

  ws.on('close', () => {
    log('Disconnected; reconnecting in 2s');
    cleanup();
    reconnectTimer = setTimeout(connect, 2000);
  });

  ws.on('error', (err) => {
    log('WebSocket error', { error: err?.message || String(err) });
  });
}

process.on('SIGINT', () => {
  cleanup();
  if (ws && ws.readyState === WebSocket.OPEN) {
    for (const channelId of joined) {
      send(
        'MESSAGE_SEND',
        {
          messageId: `offline-${now()}`,
          to: 'broadcast',
          content: `${AGENT_NAME} going offline.`,
          messageType: 'text',
          metadata: { senderId: AGENT_ID, eventType: 'monitor_offline' },
        },
        channelId
      );
    }
  }
  setTimeout(() => process.exit(0), 250);
});

connect();

