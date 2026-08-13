#!/usr/bin/env node
/**
 * human_gate_accumulator.mjs
 * Central accumulator for all human interventions across the full review.
 * Does NOT block — appends to queue and allows the Director to keep running.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const reviewDir = path.join(root, 'data/reviews');
const gatePath = path.join(reviewDir, 'human_gate_queue.json');

function initGate() {
  if (!fs.existsSync(gatePath)) {
    fs.writeFileSync(gatePath, JSON.stringify({
      version: '1.0.0',
      created_at: new Date().toISOString(),
      total_items: 0,
      open_items: 0,
      resolved_items: 0,
      by_severity: { critical: 0, high: 0, medium: 0, low: 0 },
      by_type: { contradiction: 0, sensitive: 0, missing: 0, architecture: 0, policy: 0, other: 0 },
      items: [],
    }, null, 2));
  }
}

export function recordHumanGate(data) {
  initGate();
  const gate = JSON.parse(fs.readFileSync(gatePath, 'utf-8'));

  const item = {
    id: `HITL_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    node_id: data.node_id || 'unknown',
    type: data.type || 'other',
    severity: data.severity || 'medium',
    cycle: data.cycle || 'unknown',
    status: 'open',
    description: data.description || 'No description provided',
    recommendation: data.recommendation || 'No recommendation provided',
    context: data.context || {},
    created_at: new Date().toISOString(),
    resolved_at: null,
    resolution: null,
  };

  gate.items.push(item);
  gate.total_items++;
  gate.open_items++;
  gate.by_severity[item.severity] = (gate.by_severity[item.severity] || 0) + 1;
  gate.by_type[item.type] = (gate.by_type[item.type] || 0) + 1;

  fs.writeFileSync(gatePath, JSON.stringify(gate, null, 2));
  console.log(`  🚩 Human Gate recorded: ${item.id} (${item.type}, ${item.severity})`);
  return item.id;
}

export function resolveHumanGate(itemId, resolution, rationale) {
  initGate();
  const gate = JSON.parse(fs.readFileSync(gatePath, 'utf-8'));
  const item = gate.items.find(i => i.id === itemId);
  if (item) {
    item.status = 'resolved';
    item.resolution = resolution;
    item.resolved_at = new Date().toISOString();
    gate.open_items--;
    gate.resolved_items++;
    fs.writeFileSync(gatePath, JSON.stringify(gate, null, 2));
    return true;
  }
  return false;
}

export function getGateReport() {
  initGate();
  return JSON.parse(fs.readFileSync(gatePath, 'utf-8'));
}

// CLI usage
if (process.argv.includes('--report')) {
  const report = getGateReport();
  console.log('\n' + '='.repeat(60));
  console.log('  HUMAN INTERVENTION REPORT');
  console.log('  Generated:', new Date(report.created_at).toLocaleString());
  console.log('='.repeat(60));
  console.log(`  Total items:     ${report.total_items}`);
  console.log(`  Open:            ${report.open_items}`);
  console.log(`  Resolved:        ${report.resolved_items}`);
  console.log(`\n  By Severity:`);
  Object.entries(report.by_severity).forEach(([k, v]) => console.log(`    ${k}: ${v}`));
  console.log(`\n  By Type:`);
  Object.entries(report.by_type).forEach(([k, v]) => console.log(`    ${k}: ${v}`));
  console.log(`\n  OPEN ITEMS:`);
  report.items.filter(i => i.status === 'open').forEach(item => {
    console.log(`  [${item.severity.toUpperCase()}] ${item.node_id}: ${item.type}`);
    console.log(`    → ${item.description.substring(0, 120)}${item.description.length > 120 ? '...' : ''}`);
    console.log(`    → Recommendation: ${item.recommendation.substring(0, 120)}...`);
  });
  console.log('='.repeat(60));
}
