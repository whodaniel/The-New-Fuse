/**
 * TNF Orchestrator - Direct messaging to page-agent
 */

import { WebSocket } from 'ws';
import crypto from 'crypto';
import fs from 'fs';

const RELAY_URL = 'ws://localhost:3000/ws';
const CHANNEL = 'green';
const MY_ID = `orchestrator-${Date.now()}`;

let ws = null;
let pageAgents = [];
let logFile = '/tmp/orchestrator.log';

function log(...args) {
  const msg = args.join(' ');
  console.log(msg);
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
}

function connect() {
  return new Promise((resolve) => {
    ws = new WebSocket(RELAY_URL);
    ws.on('open', () => log('[Connected]'));
    ws.on('message', handleMessage);
    ws.on('error', (e) => log('[Error]', e.message));
    ws.on('close', () => { log('[Disconnected]'); setTimeout(() => connect(), 2000); });
    setTimeout(resolve, 500);
  });
}

function send(msg) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
    log('[Sent]', msg.type);
  }
}

function handleMessage(data) {
  try {
    const msg = JSON.parse(data.toString());
    const payload = msg.payload || {};
    const content = payload.content || '';
    const from = payload.from || msg.source || '';
    
    if (msg.type === 'AGENT_LIST') {
      pageAgents = (msg.agents || []).filter(a => a.platform === 'browser-page');
      log('[Page agents found]:', pageAgents.map(a => a.id).join(', '));
    }
    
    if (msg.type === 'WELCOME') {
      send({
        id: crypto.randomUUID(), type: 'AGENT_REGISTER', timestamp: Date.now(), source: MY_ID,
        payload: { agent: { id: MY_ID, name: 'TNF Orchestrator', platform: 'orchestrator', status: 'active', capabilities: ['code-execution'], channels: [CHANNEL] } }
      });
      setTimeout(() => send({ id: crypto.randomUUID(), type: 'JOIN', timestamp: Date.now(), source: MY_ID, channel: CHANNEL }), 500);
      setTimeout(() => sendDirectPrompt(), 2500);
    }
    
    if ((msg.type === 'MESSAGE_SEND' || msg.type === 'CHANNEL_MESSAGE') && content && from !== MY_ID) {
      if (!content.startsWith('🎯')) {
        log('\n' + '='.repeat(50));
        log('🤖 RESPONSE from', from + ':');
        log('='.repeat(50));
        log(content);
        log('='.repeat(50) + '\n');
      }
    }
  } catch (e) {}
}

function sendDirectPrompt() {
  if (pageAgents.length === 0) {
    log('[No page agents, using broadcast]');
    pageAgents = [{ id: 'broadcast' }];
  }
  
  const target = pageAgents[0].id;
  log('[Sending to]', target);
  
  send({
    id: crypto.randomUUID(),
    type: 'MESSAGE_SEND',
    timestamp: Date.now(),
    source: MY_ID,
    channel: CHANNEL,
    payload: {
      to: target,
      content: `TNF Orchestrator here. Please analyze thenewfuse.com and list:
1. Key issues (bug fixes, UX improvements)
2. Priority order
3. Specific files that need changes

Be specific and actionable.`,
      messageType: 'text',
    },
  });
}

async function main() {
  log('=== ORCHESTRATOR STARTED ===');
  await connect();
  setInterval(() => ws?.readyState === WebSocket.OPEN && send({ type: 'PING' }), 25000);
  setInterval(() => { if (ws?.readyState === WebSocket.OPEN) sendDirectPrompt(); }, 60000);
}
main();
