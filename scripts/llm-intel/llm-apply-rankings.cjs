#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const HOME = process.env.HOME || process.env.USERPROFILE;
const DATA_DIR = path.resolve(__dirname, '../../data/llm-intel');
const RECS_FILE = path.join(DATA_DIR, 'ranking-recommendations.json');
const REPORT_FILE = path.join(DATA_DIR, 'ranking-report-latest.md');

const CONFIG_FILES = {
  modelProviders: path.join(HOME, '.tnf/model-providers.json'),
  customProviders: path.join(HOME, '.tnf/custom-providers.json'),
  llmConfig: path.join(HOME, '.tnf/llm-config.json'),
  providerConfig: path.join(HOME, '.tnf/provider-config.json'),
  hermesConfig: path.join(HOME, '.hermes/config.yaml'),
  hermesFallback: path.join(HOME, '.hermes/model-fallback-chain.json'),
  openclawModels: path.join(HOME, '.openclaw/agents/main/agent/models.json'),
};

function loadJSON(f) {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; }
}

function saveJSON(f, data) {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(data, null, 2) + '\n');
}

function backup(f) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const bak = f + '.bak-' + ts;
  fs.copyFileSync(f, bak);
  return bak;
}

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function run() {
  const recs = loadJSON(RECS_FILE);
  if (!recs) {
    console.error('No ranking recommendations found. Run tnf:llm:optimize first.');
    process.exit(1);
  }

  const recommendations = recs.recommendations || [];
  if (!recommendations.length) {
    console.log('No recommendations to apply.');
    process.exit(0);
  }

  console.log('=== TNF LLM Rankings Apply ===');
  console.log(`Source: ${RECS_FILE}`);
  console.log(`Generated: ${recs.generatedAt || 'unknown'}`);
  console.log(`Recommendations: ${recommendations.length}`);
  console.log();

  const report = fs.existsSync(REPORT_FILE) ? fs.readFileSync(REPORT_FILE, 'utf8') : null;
  if (report) {
    console.log('--- Report Preview (first 40 lines) ---');
    console.log(report.split('\n').slice(0, 40).join('\n'));
    console.log('---');
    console.log();
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('Available config files to update:');
  const available = [];
  let idx = 1;
  for (const [name, filePath] of Object.entries(CONFIG_FILES)) {
    const exists = fs.existsSync(filePath);
    console.log(`  ${idx}. ${name} (${exists ? GREEN}exists${RESET} : ${RED}missing${RESET}) ${DIM}${filePath}${RESET}`);
    if (exists) available.push({ name, filePath, idx });
    idx++;
  }
  console.log();

  if (!available.length) {
    console.error('No config files found to update.');
    rl.close();
    process.exit(1);
  }

  const answer = await ask(rl, 'Apply ranking recommendations? [y/N] ');
  if (answer.toLowerCase() !== 'y') {
    console.log('Aborted. No changes made.');
    rl.close();
    process.exit(0);
  }

  const scopeAnswer = await ask(rl, `Which configs? [all / comma-separated numbers 1-${idx - 1} / preview] `);
  let targets = [];
  if (scopeAnswer.toLowerCase() === 'all') {
    targets = available;
  } else if (scopeAnswer.toLowerCase() === 'preview') {
    console.log('\nPreview of changes that would be applied:');
    for (const r of recommendations) {
      console.log(`  ${r.action.toUpperCase().padEnd(8)} ${r.model}  prio ${r.currentPriority ?? '-'} → ${r.proposedPriority ?? '-'}  (${r.reason})`);
    }
    console.log('\nRun again and choose "all" or specific numbers to apply.');
    rl.close();
    process.exit(0);
  } else {
    const nums = scopeAnswer.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    targets = available.filter(a => nums.includes(a.idx));
  }

  if (!targets.length) {
    console.log('No targets selected. Aborted.');
    rl.close();
    process.exit(0);
  }

  const reorderRecs = recommendations.filter(r => r.action === 'reorder');
  const addRecs = recommendations.filter(r => r.action === 'add');
  const removeEolRecs = recommendations.filter(r => r.action === 'remove-eol');
  const demoteRecs = recommendations.filter(r => r.action === 'demote');

  console.log(`\nApplying to ${targets.length} config file(s)...`);

  for (const target of targets) {
    console.log(`\n  Processing: ${target.name} (${target.filePath})`);
    const bakPath = backup(target.filePath);
    console.log(`  Backup: ${bakPath}`);

    try {
      const config = loadJSON(target.filePath);
      if (!config) {
        console.log(`  Skipped (could not parse JSON)`);
        continue;
      }

      let changes = 0;

      if (target.name === 'openclawModels' && Array.isArray(config)) {
        for (const r of removeEolRecs) {
          const i = config.findIndex(m => m.id === r.model || m.model === r.model || m.nvidiaId === r.model);
          if (i >= 0) {
            config[i].status = 'eol';
            config[i].eol = true;
            changes++;
          }
        }
        for (const r of demoteRecs) {
          const i = config.findIndex(m => m.id === r.model || m.model === r.model || m.nvidiaId === r.model);
          if (i >= 0) {
            config[i].priority = r.proposedPriority;
            changes++;
          }
        }
        for (const r of reorderRecs) {
          const i = config.findIndex(m => m.id === r.model || m.model === r.model || m.nvidiaId === r.model);
          if (i >= 0 && r.proposedPriority !== undefined) {
            config[i].priority = r.proposedPriority;
            changes++;
          }
        }
      } else if (target.name === 'modelProviders' && typeof config === 'object') {
        if (config.models && Array.isArray(config.models)) {
          const priorityMap = new Map();
          for (const r of reorderRecs) priorityMap.set(r.model, r.proposedPriority);
          for (const r of demoteRecs) priorityMap.set(r.model, r.proposedPriority);
          for (const r of addRecs) {
            if (!config.models.find(m => m.id === r.model)) {
              config.models.push({ id: r.model, priority: r.proposedPriority, provider: 'nvidia' });
              changes++;
            }
          }
          for (const m of config.models) {
            if (priorityMap.has(m.id)) {
              m.priority = priorityMap.get(m.id);
              changes++;
            }
          }
        }
      } else if (target.name === 'hermesFallback' && typeof config === 'object') {
        if (Array.isArray(config.chain)) {
          const priorityMap = new Map();
          for (const r of reorderRecs) priorityMap.set(r.model, r.proposedPriority);
          for (const r of demoteRecs) priorityMap.set(r.model, r.proposedPriority);
          config.chain.sort((a, b) => {
            const pa = priorityMap.get(a.model) ?? a.priority ?? 99;
            const pb = priorityMap.get(b.model) ?? b.priority ?? 99;
            return pa - pb;
          });
          for (const r of removeEolRecs) {
            const i = config.chain.findIndex(c => c.model === r.model);
            if (i >= 0) { config.chain.splice(i, 1); changes++; }
          }
          for (const r of addRecs) {
            if (!config.chain.find(c => c.model === r.model)) {
              config.chain.push({ model: r.model, priority: r.proposedPriority });
              changes++;
            }
          }
          changes += priorityMap.size;
        }
      } else {
        console.log(`  Skipped (no handler for config format)`);
        continue;
      }

      saveJSON(target.filePath, config);
      console.log(`  Applied ${changes} change(s)`);
    } catch (err) {
      console.error(`  Error: ${err.message}`);
      console.log(`  Restore from backup: ${bakPath}`);
    }
  }

  console.log('\nDone. Backups saved with .bak-* timestamps.');
  rl.close();
}

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';

run().catch(err => { console.error(err); process.exit(1); });
