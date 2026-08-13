#!/usr/bin/env node
/**
 * init_review.mjs
 * Initializes the review tracking system from codebase_map.json.
 * Creates initial state files with all nodes as UNREVIEWED.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../');
const mapPath = path.join(root, 'apps/frontend/src/data/codebase_map.json');

// Output paths
const reviewDir = path.join(root, 'data/reviews');
const logPath = path.join(reviewDir, 'review_log.jsonl');
const statusPath = path.join(reviewDir, 'node_status.json');
const contradictionsPath = path.join(reviewDir, 'contradictions.json');
const missingPath = path.join(reviewDir, 'missing.json');
const reportDir = path.join(root, 'reports/reviews');

function init() {
  console.log('🔧 Initializing Systematic Review Infrastructure...\n');

  // Ensure directories exist
  [reviewDir, reportDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Load codebase map
  const map = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
  const total = map.nodes.length;

  // Initialize status for all nodes
  const status = {
    version: '1.0.0',
    total_nodes: total,
    initialized_at: new Date().toISOString(),
    last_review_at: null,
    completion: {
      unreviewed: total,
      discovered: 0,
      challenged: 0,
      synthesized: 0,
      reconciled: 0,
    },
    flags: {
      contradictions: 0,
      orphans: 0,
      circulars: 0,
      stale: 0,
      duplicates: 0,
      missing: 0,
      sensitive: 0,
    },
    by_cycle: {
      unreviewed: total,
      discovery: 0,
      adversarial: 0,
      synthesis: 0,
      reconciliation: 0,
    },
    nodes: {},
  };

  map.nodes.forEach((node) => {
    status.nodes[node.id] = {
      status: 'UNREVIEWED',
      current_cycle: null,
      cycles_completed: [],
      flags: [],
      contradictions: [],
      last_reviewed_by: null,
      last_reviewed_at: null,
      confidence: null,
    };
  });

  // Write status file
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
  fs.writeFileSync(
    contradictionsPath,
    JSON.stringify({ version: '1.0.0', contradictions: [] }, null, 2)
  );
  fs.writeFileSync(
    missingPath,
    JSON.stringify({ version: '1.0.0', missing_files: [] }, null, 2)
  );

  // Create empty log file if not exists
  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, '');
  }

  console.log(`✅ Review infrastructure initialized`);
  console.log(`   Total nodes: ${total.toLocaleString()}`);
  console.log(`   Status file: ${statusPath}`);
  console.log(`   Log file: ${logPath}`);
  console.log(`   Contradictions: ${contradictionsPath}`);
  console.log(`   Missing files: ${missingPath}`);
  console.log(`\n📋 Run 'node scripts/review/review_node.mjs --id <ID> --cycle discovery' to begin.`);
  console.log(`📊 Run 'node scripts/review/audit_review.mjs' to check progress.`);
}

init();
