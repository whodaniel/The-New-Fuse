#!/usr/bin/env node

/**
 * TNF Local Cron Provisioner
 * 
 * Automatically generates a local crontab based on the system job registry
 * and user-specific environmental configuration.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '../..');
const REGISTRY_PATH = path.join(REPO_ROOT, 'data/protocols/cron-jobs.registry.json');
const CATALOG_PATH = path.join(REPO_ROOT, 'data/protocols/chronological-process-catalog.json');
const NODE_PATH = process.execPath;

function provision() {
  console.log('Initializing TNF Local Cron Provisioning...');

  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error('Error: Cron registry not found.');
    process.exit(1);
  }

  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  
  let newCronEntries = [];

  // 1. Process System & Tenant Jobs from Registry
  registry.jobs.forEach(job => {
    const entry = catalog.entries[job.schedule_id];
    if (!entry || entry.cadence === 'manual') return;

    const logDir = path.join(process.env.HOME, '.tnf/poll-jobs', job.schedule_id);
    fs.mkdirSync(logDir, { recursive: true });

    // Build the local command
    const cronCommand = `cd "${REPO_ROOT}" && "${NODE_PATH}" scripts/protocols/run-chronological-process.cjs --process-id "${job.schedule_id}" >> "${logDir}/cron.log" 2>&1`;
    
    newCronEntries.push(`${entry.cadence} ${cronCommand} # tnf-chronological:${job.schedule_id}`);
  });

  // 2. Add local-specific health checks
  const heartbeatDir = path.join(process.env.HOME, '.tnf/terminal-heartbeat/logs');
  fs.mkdirSync(heartbeatDir, { recursive: true });
  newCronEntries.push(`*/30 * * * * cd "${path.join(process.env.HOME, '.tnf/terminal-heartbeat')}" && "${NODE_PATH}" "${path.join(process.env.HOME, '.tnf/bin/terminal-heartbeat-pulse.cjs')}" >> "${heartbeatDir}/cron.log" 2>&1 # tnf-terminal-heartbeat`);

  // 3. Update Crontab
  try {
    let currentCrontab = '';
    try {
      currentCrontab = execSync('crontab -l', { encoding: 'utf8' });
    } catch (e) {
      // No existing crontab
    }

    // Filter out existing TNF entries to prevent duplicates
    const otherEntries = currentCrontab.split('\n').filter(line => 
      line.trim() && !line.includes('# tnf-') && !line.includes('# perplexity-')
    );

    const finalCrontab = [...otherEntries, ...newCronEntries].join('\n') + '\n';
    
    const tmpPath = path.join(REPO_ROOT, '.gemini/tmp/new_crontab');
    fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
    fs.writeFileSync(tmpPath, finalCrontab);
    
    execSync(`crontab "${tmpPath}"`);
    console.log(`Successfully provisioned ${newCronEntries.length} TNF cron jobs to local crontab.`);
  } catch (err) {
    console.error('Failed to update crontab:', err.message);
  }
}

provision();
