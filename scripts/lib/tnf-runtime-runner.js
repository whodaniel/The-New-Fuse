#!/usr/bin/env node
/**
 * TNF Runtime Runner
 * 
 * Safe wrapper for running TNF runtime scripts without duplicate execution.
 * 
 * Usage:
 *   ./scripts/lib/tnf-runtime-runner.js <script-name> [--args...]
 * 
 * Example:
 *   ./scripts/lib/tnf-runtime-runner.js tnf-director-loop
 *   ./scripts/lib/tnf-runtime-runner.js local-subdirector-runtime --mode=watch
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RUNTIME_DIR = path.join(__dirname, '..', 'runtime');
const GUARD_SCRIPT = path.join(__dirname, 'tnf-adhoc-guard.js');

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Usage: tnf-runtime-runner.js <script-name> [--args...]');
    console.error('');
    console.error('Available runtime scripts:');
    
    const scripts = fs.readdirSync(RUNTIME_DIR)
      .filter(f => f.endsWith('.cjs') || f.endsWith('.js'))
      .map(f => f.replace(/\.cjs$/, '').replace(/\.js$/, ''));
    
    scripts.forEach(s => console.error(`  - ${s}`));
    process.exit(1);
  }

  const scriptName = args[0];
  const scriptArgs = args.slice(1);
  
  const scriptPath = path.join(RUNTIME_DIR, `${scriptName}.cjs`);
  
  if (!fs.existsSync(scriptPath)) {
    const altPath = path.join(RUNTIME_DIR, `${scriptName}.js`);
    if (fs.existsSync(altPath)) {
      scriptPath = altPath;
    } else {
      console.error(`Error: Script not found: ${scriptName}`);
      process.exit(1);
    }
  }

  // Run through the ad-hoc guard
  const child = spawn('node', [GUARD_SCRIPT, scriptPath, ...scriptArgs], {
    stdio: 'inherit',
    cwd: path.dirname(__dirname),
    env: process.env
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

main();