#!/usr/bin/env node
/**
 * report_tracker.mjs
 * Generates a progress report from codebase_tracker.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../');
const trackerPath = path.join(root, 'codebase_tracker.json');

function main() {
  if (!fs.existsSync(trackerPath)) {
    console.error(`❌ Tracker not found. Run init_tracker.mjs first.`);
    process.exit(1);
  }

  const tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf-8'));
  const total = tracker.total_nodes;
  const p = tracker.progress;
  const analyzedPct = ((p.ANALYZED / total) * 100).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('   TNF Codebase Reading Tracker — Progress Report v' + tracker.tracker_version);
  console.log('   Last Updated:', new Date(tracker.last_updated).toLocaleString());
  console.log('='.repeat(60));

  console.log(`\n📊 Overall Progress: ${p.ANALYZED} / ${total} nodes (${analyzedPct}%)`);
  console.log(`   ├─ UNREAD:   ${p.UNREAD.toLocaleString().padStart(6)} (${((p.UNREAD/total)*100).toFixed(1)}%)`);
  console.log(`   ├─ READING:  ${p.READING.toLocaleString().padStart(6)} (${((p.READING/total)*100).toFixed(1)}%)`);
  console.log(`   ├─ ANALYZED: ${p.ANALYZED.toLocaleString().padStart(6)} (${((p.ANALYZED/total)*100).toFixed(1)}%)`);
  console.log(`   └─ STALE:    ${p.STALE.toLocaleString().padStart(6)} (${((p.STALE/total)*100).toFixed(1)}%)`);

  // Lens distribution
  console.log('\n🔍 Lens Distribution:');
  const intentDist = {};
  let withIntent = 0;
  Object.values(tracker.nodes).forEach(node => {
    if (node.lenses?.intent) {
      intentDist[node.lenses.intent] = (intentDist[node.lenses.intent] || 0) + 1;
      withIntent++;
    }
  });
  if (withIntent === 0) {
    console.log('   (No nodes classified yet. Use update_node.mjs to classify.)');
  } else {
    Object.entries(intentDist).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
      console.log(`   • ${k}: ${v} nodes`);
    });
  }

  // Critical gaps
  const unReadCritical = Object.entries(tracker.nodes).filter(([id, n]) => {
    return n.read_status === 'UNREAD' && (n.lenses?.criticality === 'critical' || n.lenses?.criticality === 'important');
  });
  if (unReadCritical.length > 0) {
    console.log(`\n⚠️  Critical gaps (${unReadCritical.length} nodes):`);
    unReadCritical.slice(0, 10).forEach(([id]) => console.log(`   - ${id}`));
  }

  // Recently analyzed
  const recent = Object.entries(tracker.nodes)
    .filter(([id, n]) => n.read_at)
    .sort((a, b) => new Date(b[1].read_at) - new Date(a[1].read_at))
    .slice(0, 5);
  if (recent.length > 0) {
    console.log('\n🕐 Recently analyzed:');
    recent.forEach(([id, n]) => {
      console.log(`   • ${id} by ${n.read_by} (${n.lenses?.intent || 'unknown intent'})`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

main();
