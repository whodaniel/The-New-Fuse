#!/usr/bin/env node

/**
 * TNF REDIS-NATIVE RELAY MONITOR (v6)
 * 
 * Subscribes directly to the Redis Bus to bypass WebSocket overhead.
 * Performs verified Tab-then-Enter injections for terminal agents.
 */

const { RedisAgentClient } = require('/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/scripts/lib/redis-agent-client.cjs');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

// Configuration
const ALIAS_SOURCE_FILE = path.join(process.env.HOME, '.tnf', 'local-subdirector', 'state', 'local-subdirector-heartbeat.json');
const DIRECT_PROMPT_VERIFY_MS = 500;

function log(message, metadata = {}) {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({ timestamp, message, role: 'Relay-Monitor', ...metadata }));
}

async function readTerminalContents(windowId) {
  const { stdout } = await execFileAsync('osascript', [
    '-e', `tell application "Terminal" to contents of selected tab of window id ${Number(windowId)}`,
  ]);
  return String(stdout || '');
}

async function pressTerminalKey(windowId, keyCode) {
  await execFileAsync('osascript', [
    '-e', 'tell application "Terminal" to activate',
    '-e', `tell application "Terminal" to set frontmost of window id ${Number(windowId)} to true`,
    '-e', 'delay 0.1',
    '-e', `tell application "System Events" to tell process "Terminal" to key code ${Number(keyCode)}`,
  ]);
}

async function submitPromptIfNeeded(windowId, marker, pendingPrefix) {
  let contents = await readTerminalContents(windowId);
  let hasQueueHint = contents.includes('tab to queue message');
  let hasMarker = contents.includes(marker) || contents.includes(pendingPrefix);
  let pending = hasMarker || hasQueueHint;

  if (!pending) return { submitted: false, enterAttempts: 0, pending: false };

  let submitted = false;
  let enterAttempts = 0;

  // satisfy composer
  if (hasQueueHint) {
    await pressTerminalKey(windowId, 48); // Tab
    await new Promise(r => setTimeout(r, 250));
  }

  while (pending && enterAttempts < 3) {
    await pressTerminalKey(windowId, 36); // Enter
    submitted = true;
    enterAttempts += 1;
    await new Promise(r => setTimeout(r, 500));
    contents = await readTerminalContents(windowId);
    hasQueueHint = contents.includes('tab to queue message');
    hasMarker = contents.includes(marker) || contents.includes(pendingPrefix);
    pending = hasMarker || hasQueueHint;
    
    if (pending && hasQueueHint) {
      await pressTerminalKey(windowId, 48); // Tab
      await new Promise(r => setTimeout(r, 250));
    }
  }

  return { submitted, enterAttempts, pending };
}

async function flushAnyPendingTnfPrompt(windowId) {
  let contents = await readTerminalContents(windowId);
  let pending =
    contents.includes('› TNF wake') ||
    contents.includes('› TNF heartbeat') ||
    contents.includes('tab to queue message');
  
  if (!pending) return { enterAttempts: 0, pending: false };

  let enterAttempts = 0;
  while (pending && enterAttempts < 3) {
    if (contents.includes('tab to queue message')) {
      await pressTerminalKey(windowId, 48); // Tab
      await new Promise(r => setTimeout(r, 250));
    }
    await pressTerminalKey(windowId, 36); // Enter
    enterAttempts += 1;
    await new Promise(r => setTimeout(r, 500));
    contents = await readTerminalContents(windowId);
    pending =
      contents.includes('› TNF wake') ||
      contents.includes('› TNF heartbeat') ||
      contents.includes('tab to queue message');
  }
  return { enterAttempts, pending };
}

async function inject(agentId, prompt, pingId) {
  try {
    if (!fs.existsSync(ALIAS_SOURCE_FILE)) {
      log('Alias source file missing', { path: ALIAS_SOURCE_FILE });
      return;
    }
    const raw = fs.readFileSync(ALIAS_SOURCE_FILE, 'utf8');
    const sessions = JSON.parse(raw).sessions;
    const session = sessions.find(s => s.agentId === agentId);
    
    if (session?.tty && session?.windowId) {
      log('Injecting prompt', { agentId, tty: session.tty, pingId });
      
      // Pre-injection: aggressive line clear
      await pressTerminalKey(session.windowId, 9); // Ctrl+C
      await new Promise(r => setTimeout(r, 100));
      await pressTerminalKey(session.windowId, 36); // Enter
      await new Promise(r => setTimeout(r, 200));

      // Injection
      const escapedPrompt = prompt.replace(/[\\"]/g, '\\$&');
      await execFileAsync('osascript', [
        '-e', `tell application "Terminal" to do script "${escapedPrompt}\\n" in selected tab of window id ${Number(session.windowId)}`,
      ]);
      
      await new Promise(r => setTimeout(r, 500));
      const res = await submitPromptIfNeeded(session.windowId, prompt.slice(0, 20), '› TNF');
      
      if (res.pending) {
        await flushAnyPendingTnfPrompt(session.windowId);
      }
    }
  } catch (e) {
    log('Injection failed', { error: e.message });
  }
}

async function publishActivity(agentId, activityType, metadata) {
  try {
    const client = new RedisAgentClient();
    await client.initialize();
    await client.publisher.publish(
      'agent:activity',
      JSON.stringify({
        agentId,
        activityType,
        metadata,
        timestamp: new Date().toISOString(),
      })
    );
    await client.cleanup();
  } catch (_error) {
    // Fail silently
  }
}

async function main() {
  log('Starting Redis-Native Monitor');
  const client = new RedisAgentClient();
  await client.initialize();

  // Subscribe to the ingress bus directly
  client.onMessage('tnf:bus:ingress', async (envelope) => {
    if (envelope.type === 'event' && envelope.payload?.eventType === 'wake_ping') {
      const data = envelope.payload.data;
      if (data.targetAgentId && data.customPrompt) {
        await inject(data.targetAgentId, data.customPrompt, data.pingId);
        
        await publishActivity(data.targetAgentId, 'prompt_injected', {
          pingId: data.pingId,
          method: 'terminal-do-script'
        });
      }
    }
  });

  log('Subscribed to tnf:bus:ingress');
}

main().catch(err => {
  log('Monitor Fatal Error', { error: err.message });
  process.exit(1);
});
