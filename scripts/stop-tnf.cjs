#!/usr/bin/env node
/**
 * stop-tnf.cjs - Graceful shutdown of all TNF services
 * 
 * This script stops all background services started by boot-tnf.sh:
 * - Tauri desktop app
 * - Relay server  
 * - Redis server (if TNF-managed)
 * 
 * Usage: node scripts/stop-tnf.cjs [--force]
 * 
 * Options:
 *   --force    Force kill stubborn processes
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TMP_DIR = path.join(ROOT, '.tmp');

const forceKill = process.argv.includes('--force');

console.log('🔴 Stopping TNF services...\n');

// Stop a process by PID file
function stopProcess(name, pidFile) {
  if (!fs.existsSync(pidFile)) {
    console.log('✅ ' + name + ': Not running (no PID file)');
    return;
  }

  let pidStr;
  try {
    pidStr = fs.readFileSync(pidFile, 'utf8').trim();
  } catch (err) {
    console.log('⚠️  ' + name + ': Cannot read PID file');
    return;
  }

  const pid = parseInt(pidStr, 10);

  if (isNaN(pid)) {
    console.log('⚠️  ' + name + ': Invalid PID in file');
    try {
      fs.unlinkSync(pidFile);
    } catch (err) {}
    return;
  }

  // Check if process is running
  try {
    process.kill(pid, 0); // Signal 0 checks if process exists

    console.log('🛑 Stopping ' + name + ' (PID: ' + pid + ')...');

    const signal = forceKill ? 9 : 15; // SIGKILL or SIGTERM
    process.kill(pid, signal);
    console.log('📋 ' + name + ': Sent signal ' + signal);

  } catch (err) {
    if (err.code === 'EPERM') {
      console.log('⚠️  ' + name + ': Permission denied killing PID ' + pid);
    } else if (err.code === 'ESRCH') {
      console.log('✅ ' + name + ': Process already dead');
    }
  }

  try {
    fs.unlinkSync(pidFile);
  } catch (err) {}
}

// Stop services
stopProcess('Relay', path.join(TMP_DIR, 'relay.pid'));
stopProcess('Tauri', path.join(TMP_DIR, 'tauri.pid'));

console.log('\n✅ TNF services stopped');
console.log('\nNote: Redis is managed separately if TNF-managed');