#!/usr/bin/env node
/**
 * init_tracker.mjs
 * Initializes codebase_tracker.json from codebase_map.json
 * Sets all nodes to UNREAD with empty lens classifications.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../');
const mapPath = path.join(root, 'apps/frontend/src/data/codebase_map.json');
const trackerPath = path.join(root, 'codebase_tracker.json');

function hashContent(label, data) {
  return crypto.createHash('sha256').update(label + JSON.stringify(data)).digest('hex').slice(0, 16);
}

function createEmptyState(node) {
  return {
    read_status: 'UNREAD',
    read_by: null,
    read_at: null,
    version_read: hashContent(node.data?.label || '', node.data),
    lenses: {
      intent: null,
      scope: null,
      maturity: null,
      actionability: null,
      ownership: null,
      semantic_vibe: null,
      criticality: null,
    },
    confidence: null,
    dependencies_crossed: [],
    key_findings: [],
    review_count: 0,
    last_reviewer: null,
  };
}

function main() {
  if (!fs.existsSync(mapPath)) {
    console.error(`❌ Map not found: ${mapPath}`);
    process.exit(1);
  }

  console.log('🔄 Loading codebase_map.json...');
  const map = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
  const total = map.nodes.length;

  const tracker = {
    tracker_version: '1.0.0',
    last_updated: new Date().toISOString(),
    total_nodes: total,
    progress: { UNREAD: total, READING: 0, ANALYZED: 0, STALE: 0 },
    lens_distribution: {},
    nodes: {},
  };

  for (const node of map.nodes) {
    tracker.nodes[node.id] = createEmptyState(node);
  }

  fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2));
  console.log(`✅ Initialized tracker for ${total} nodes at ${trackerPath}`);
  console.log(`   All nodes set to UNREAD.`);
}

main();
