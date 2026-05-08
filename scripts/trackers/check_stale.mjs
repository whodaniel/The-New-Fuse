#!/usr/bin/env node
/**
 * check_stale.mjs
 * Detects which nodes have source files newer than their last analysis
 * and marks them as STALE in codebase_tracker.json.
 * Usage:
 *   node scripts/trackers/check_stale.mjs [--auto-fix]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../');
const trackerPath = path.join(root, 'codebase_tracker.json');
const mapPath = path.join(root, 'apps/frontend/src/data/codebase_map.json');
const sourceFiles = [
  path.join(root, 'TNF_EXHAUSTIVE_AST_MAP.md'),
  path.join(root, 'AGENTS.md'),
];

function getMtime(file) {
  try { return fs.statSync(file).mtimeMs; } catch { return 0; }
}

function main() {
  if (!fs.existsSync(trackerPath)) {
    console.error('❌ Tracker not found. Run init_tracker.mjs first.');
    process.exit(1);
  }

  const tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf-8'));
  const map = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
  
  // Build source file mtime lookup
  const srcMap = {}; // nodeId -> max mtime of contributing files
  const getSourceMtime = (nodeId) => {
    if (nodeId.startsWith('DOMAIN_')) return getMtime(path.join(root, 'AGENTS.md'));
    if (nodeId.startsWith('PROTO_')) {
      const idx = parseInt(nodeId.replace('PROTO_', ''));
      const protoFiles = fs.readdirSync(path.join(root, 'docs/protocols')).filter(f => f.endsWith('.md'));
      if (protoFiles[idx]) {
        return getMtime(path.join(root, 'docs/protocols', protoFiles[idx]));
      }
    }
    // For code nodes, check if map has a path hint (not stored in current schema)
    return Math.max(...sourceFiles.map(getMtime));
  };

  let staleCount = 0;
  Object.keys(tracker.nodes).forEach(nodeId => {
    const node = tracker.nodes[nodeId];
    if (node.read_status !== 'ANALYZED') return;
    
    const sourceMtime = getSourceMtime(nodeId);
    if (sourceMtime <= 0) return;
    
    const readAt = node.read_at ? new Date(node.read_at).getTime() : 0;
    if (sourceMtime > readAt) {
      const oldStatus = node.read_status;
      if (oldStatus !== 'STALE') {
        tracker.progress[oldStatus]--;
        tracker.progress['STALE']++;
        node.read_status = 'STALE';
        staleCount++;
      }
    }
  });

  tracker.last_updated = new Date().toISOString();
  fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2));

  if (staleCount > 0) {
    console.log(`⚠️  Found ${staleCount} stale nodes (source changed after last analysis)`);
    console.log(`   → Run report_tracker.mjs to see details`);
  } else {
    console.log('✅ All analyzed nodes are up to date.');
  }
}

main();
