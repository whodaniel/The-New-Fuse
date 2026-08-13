#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CATALOG_PATH = process.argv.includes('--catalog') 
  ? process.argv[process.argv.indexOf('--catalog') + 1] 
  : 'data/protocols/chronological-process-catalog.json';

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
const entries = Object.entries(catalog.entries || {});

const cronJobs = entries
  .filter(([_, proc]) => proc.runNow && proc.cadence !== 'manual')
  .map(([name, proc]) => {
    const schedule = proc.cadence;
    const run = proc.runNow;
    const cmd = run.args ? run.args.join(' ') : run.command || '';
    const cmdPath = cmd.replace(/\.cjs$/i, '.cjs').replace(/\.js$/i, '.js');
    
    return { schedule, name, command: cmd, timeout: run.timeoutMs || 30000 };
  });

console.log('# TNF Autonomous Testing Cron Schedule');
console.log(`# Generated: ${new Date().toISOString()}`);
console.log(`# Total jobs: ${cronJobs.length}\n`);

cronJobs.forEach(job => {
  const tags = `# tnf-autonomous:${job.name}`;
  console.log(`${job.schedule} cd "${process.env.PWD || process.cwd()}" &&`);
  console.log(`  node scripts/protocols/chronological-dispatch.cjs`);
  console.log(`  --process-id "${job.name}"`);
  console.log(`  >> logs/${job.name}.log 2>&1 ${tags}\n`);
});

console.log('\n# To install: crontab << EOF');
console.log(cronJobs.map(j => {
  const tags = `# tnf-autonomous:${j.name}`;
  return `${j.schedule} cd "${process.cwd()}" && node scripts/protocols/chronological-dispatch.cjs --process-id "${j.name}" >> logs/${j.name}.log 2>&1 ${tags}`;
}).join('\n'));
console.log(`# EOF`);