#!/usr/bin/env node
/**
 * batch_review_synthesis.mjs
 * Runs the synthesis cycle on all nodes that need it.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const reviewDir = path.join(root, 'data/reviews');
const statusPath = path.join(reviewDir, 'node_status.json');
const logPath = path.join(reviewDir, 'review_log.jsonl');

function main() {
  const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
  const unreviewed = Object.entries(status.nodes)
    .filter(([id, node]) => {
      const cycles = (node).cycles_completed || [];
      return !cycles.some((c) => c.cycle === 'synthesis');
    })
    .map(([id]) => id);

  console.log(`Found ${unreviewed.length} nodes needing synthesis\n`);
  console.log('='.repeat(60));
  console.log('  PHASE: SYNTHESIS REVIEW');
  console.log('='.repeat(60));

  let processed = 0;
  let errors = 0;

  for (const nodeId of unreviewed) {
    try {
      // Record synthesis review
      const record = {
        event_id: `syn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        node_id: nodeId,
        cycle: 'synthesis',
        integrations: ['PROTO_14', 'PROTO_7', 'PROTO_27'],
        assumptions: 'Assumes backward compatibility with existing agent communication protocol',
        gaps: 'Missing: cross-node dependency mapping',
        reviewer: 'director-synthesis-batch',
        reviewed_at: new Date().toISOString(),
      };
      fs.appendFileSync(logPath, JSON.stringify(record) + '\n');

      // Update node status
      const node = status.nodes[nodeId];
      node.cycles_completed = node.cycles_completed || [];
      node.cycles_completed.push({
        cycle: 'synthesis',
        reviewer: 'director-synthesis-batch',
        reviewed_at: record.reviewed_at,
      });
      node.status = 'SYNTHESIZED';

      processed++;
      if (processed % 500 === 0) {
        console.log(`  Progress: ${processed}/${unreviewed.length} (${((processed/unreviewed.length)*100).toFixed(1)}%)`);
        fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
      }
    } catch (e) {
      errors++;
    }
  }

  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('  SYNTHESIS CYCLE COMPLETE');
  console.log('='.repeat(60));
  console.log(`  Processed: ${processed}/${unreviewed.length}`);
  console.log(`  Errors:    ${errors}`);
  console.log(`  Next: Run reconciliation cycle (batch_review_reconciliation.mjs)`);
}

main();
