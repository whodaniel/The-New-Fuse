#!/usr/bin/env node
/**
 * TNF Ad-Hoc Run Guard
 * 
 * This wrapper ensures that only one instance of a given TNF routine
 * runs at a time, even when triggered manually from multiple terminals.
 * 
 * Usage:
 *   node scripts/lib/tnf-adhoc-guard.js <script-path> [--arg1 --arg2]
 * 
 * The guard checks the existing lock file for the target script.
 * If a stale lock exists, it recovers. If an active lock exists, it exits.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOCK_DIR = path.join(process.env.HOME, '.tnf', 'locks');
const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// Ensure lock directory exists
if (!fs.existsSync(LOCK_DIR)) {
  fs.mkdirSync(LOCK_DIR, { recursive: true });
}

function getLockName(scriptPath) {
  // Extract a unique identifier from the script path
  // e.g., "scripts/runtime/tnf-director-loop.cjs" -> "tnf-director-loop"
  const basename = path.basename(scriptPath, '.cjs').replace('.js', '');
  return `tnf-${basename}`;
}

function getLockPath(lockName) {
  return path.join(LOCK_DIR, `${lockName}.lock`);
}

function getOwnerPath(lockName) {
  return path.join(LOCK_DIR, `${lockName}.owner.json`);
}