#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const TNF_ROOT = process.env.TNF_ROOT || process.env.TNF_ROOT_DIR || path.resolve(__dirname, '..');
const HANDOFF_PATH = path.join(os.homedir(), '.tnf', 'handoff-current.json');
const DIRECTOR_LOG = path.join(os.homedir(), '.tnf', 'director', 'logs', 'director.log');

function log(message) {
  console.log(`[handoff-pre-validator] ${message}`);
}

// Load handoff packet
let packet;
try {
  const raw = fs.readFileSync(HANDOFF_PATH, 'utf8');
  packet = JSON.parse(raw);
} catch (e) {
  log(`ERROR: Failed to read or parse handoff packet: ${e.message}`);
  process.exit(1);
}

// 1. Validate handoff packet structure
function validatePacket(pkt) {
  const requiredTopLevel = ['sessionKey', 'generatedAt', 'MISSION', 'STATE', 'IMMEDIATE_TASKS', 'POINTERS', 'HANDOFF_HISTORY', 'CLOUD_HEALTH'];
  for (const key of requiredTopLevel) {
    if (!(key in pkt)) {
      return { valid: false, error: `Missing top-level key: ${key}` };
    }
  }
  // Check that STATE is an array
  if (!Array.isArray(pkt.STATE)) {
    return { valid: false, error: 'STATE is not an array' };
  }
  // Optionally, check for certain expected strings in STATE? We'll just check that it's not empty.
  if (pkt.STATE.length === 0) {
    return { valid: false, error: 'STATE array is empty' };
  }
  return { valid: true, error: '' };
}

const validationResult = validatePacket(packet);
if (!validationResult.valid) {
  log(`ERROR: Handoff packet validation failed: ${validationResult.error}`);
} else {
  log('Handoff packet structure is valid.');
}

// 2. Check cycle completion enforcement by checking director log for recent success
function checkCycleEnforcement() {
  if (!fs.existsSync(DIRECTOR_LOG)) {
    return { ok: false, message: 'Director log file not found' };
  }
  try {
    const logContent = fs.readFileSync(DIRECTOR_LOG, 'utf8');
    const lines = logContent.trim().split('\n');
    // Look for the last completion message
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes('LDA Relay Delegation Cycle Complete')) {
        // Parse timestamp to check if it's recent (within last 5 minutes)
        const match = lines[i].match(/timestamp":"([^"]+)"/);
        if (match) {
          const timestamp = new Date(match[1]);
          const now = new Date();
          const diffMs = now - timestamp;
          const diffMin = diffMs / 1000 / 60;
          if (diffMin < 5) {
            return { ok: true, message: `Director cycle completed successfully ${diffMin.toFixed(1)} minutes ago` };
          } else {
            return { ok: false, message: `Director cycle completed but too old (${diffMin.toFixed(1)} minutes ago)` };
          }
        }
      }
    }
    return { ok: false, message: 'No recent completion message found in director log' };
  } catch (e) {
    return { ok: false, message: `Error reading director log: ${e.message}` };
  }
}

const cycleResult = checkCycleEnforcement();
if (!cycleResult.ok) {
  log(`WARNING: Cycle completion enforcement check failed: ${cycleResult.message}`);
} else {
  log(`SUCCESS: ${cycleResult.message}`);
}

// Now update the handoff packet with real status
// We'll replace the mock status lines with real ones based on our checks.

// We need to find the indices of the lines we want to replace in the STATE array.
const cycleIndex = packet.STATE.findIndex(s => s.includes('Cycle completion enforcement'));
const validationIndex = packet.STATE.findIndex(s => s.includes('Handoff packet validation pipeline'));

if (cycleIndex !== -1) {
  if (cycleResult.ok) {
    packet.STATE[cycleIndex] = 'Cycle completion enforcement: operational ✅';
  } else {
    packet.STATE[cycleIndex] = 'Cycle completion enforcement: failed (see logs)';
  }
} else {
  log('WARNING: Could not find Cycle completion enforcement line in STATE');
}

if (validationIndex !== -1) {
  if (validationResult.valid) {
    packet.STATE[validationIndex] = 'Handoff packet validation pipeline: operational ✅';
  } else {
    packet.STATE[validationIndex] = 'Handoff packet validation pipeline: failed (see logs)';
  }
} else {
  log('WARNING: Could not find Handoff packet validation pipeline line in STATE');
}

// Update the timestamp and add metadata about this validation run
packet.UPDATED = new Date().toISOString() + 'Z';
if (!packet.RECOVERY_METADATA) packet.RECOVERY_METADATA = [];
packet.RECOVERY_METADATA.push({
  timestamp: new Date().toISOString() + 'Z',
  provider: 'handoff-pre-validator',
  action: 'validation_run',
  status: validationResult.valid && cycleResult.ok ? 'success' : 'failure',
  details: {
    packetValid: validationResult.valid,
    packetError: validationResult.error,
    cycleOk: cycleResult.ok,
    cycleMessage: cycleResult.message
  }
});

// Write back the updated packet
try {
  fs.writeFileSync(HANDOFF_PATH, JSON.stringify(packet, null, 2));
  log('Successfully updated handoff-current.json with real validation status.');
} catch (e) {
  log(`ERROR: Failed to write updated handoff packet: ${e.message}`);
  process.exit(1);
}

// Exit with success only if both checks passed
if (validationResult.valid && cycleResult.ok) {
  log('All checks passed.');
  process.exit(0);
} else {
  log('One or more checks failed.');
  process.exit(1);
}
