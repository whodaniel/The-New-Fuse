#!/usr/bin/env node
/**
 * update_node.mjs
 * Updates a node's reading status and lens classification.
 *
 * Usage:
 *   node scripts/trackers/update_node.mjs --id "PROTO_14" --status ANALYZED \
 *     --agent "claude-v1" --intent "governance" --maturity "stable" \
 *     --actionability "monitor" --criticality "critical" --confidence 0.98
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../');
const trackerPath = path.join(root, 'codebase_tracker.json');
const mapPath = path.join(root, 'apps/frontend/src/data/codebase_map.json');

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace('--', '');
      const next = args[i + 1];
      flags[key] = next && !next.startsWith('--') ? next : true;
      i++;
    }
  }
  return flags;
}

function main() {
  if (!fs.existsSync(trackerPath)) {
    console.error(`❌ Tracker not found. Run init_tracker.mjs first.`);
    process.exit(1);
  }
  if (!fs.existsSync(mapPath)) {
    console.error(`❌ codebase_map.json not found.`);
    process.exit(1);
  }

  const flags = parseArgs();
  if (!flags.id) {
    console.error('❌ Missing --id parameter');
    process.exit(1);
  }

  const tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf-8'));
  const node = tracker.nodes[flags.id];
  if (!node) {
    console.error(`❌ Node ${flags.id} not found in tracker`);
    process.exit(1);
  }

  // Track old status for progress counter update
  const oldStatus = node.read_status;
  const newStatus = flags.status || oldStatus;

  // Only decrement old + increment new if status actually changes
  if (newStatus !== oldStatus) {
    tracker.progress[oldStatus]--;
    tracker.progress[newStatus]++;
  }

  // Update state
  node.read_status = newStatus;
  if (flags.agent) node.read_by = flags.agent;
  if (newStatus === 'ANALYZED' || newStatus === 'READING') {
    node.read_at = new Date().toISOString();
  }
  if (flags.status === 'ANALYZED') {
    node.review_count++;
    node.last_reviewer = flags.agent || null;
  }

  // Update lenses
  const lensKeys = ['intent', 'scope', 'maturity', 'actionability', 'ownership', 'semantic_vibe', 'criticality'];
  lensKeys.forEach(k => {
    if (flags[k] !== undefined) node.lenses[k] = flags[k];
  });

  if (flags.confidence) node.confidence = parseFloat(flags.confidence);
  if (flags.findings) node.key_findings.push(flags.findings);
  if (flags.dependencies) node.dependencies_crossed = flags.dependencies.split(',').map(s => s.trim());

  tracker.last_updated = new Date().toISOString();

  fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2));
  console.log(`✅ Updated ${flags.id} → ${newStatus}`);
  if (node.lenses.intent) {
    console.log(`   intent: ${node.lenses.intent} | maturity: ${node.lenses.maturity} | actionability: ${node.lenses.actionability}`);
  }
}

main();
