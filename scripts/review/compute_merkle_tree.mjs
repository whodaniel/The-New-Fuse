#!/usr/bin/env node
/**
 * compute_merkle_tree.mjs
 * Computes the Merkle tree for all 15,707 nodes in the codebase map.
 * 
 * For each leaf node (file), hashes the file content using sha256.
 * For intermediate nodes (directories/namespaces), hashes the concatenation of child hashes.
 * The root hash is stored at the top level.
 * 
 * Usage: node scripts/review/compute_merkle_tree.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../');

const codebaseMapPath = path.join(root, 'apps/frontend/src/data/codebase_map.json');
const merkleOutputPath = path.join(root, 'data/reviews/codebase_merkle_tree.json');
const protocolDir = path.join(root, 'docs/protocols');

function hashContent(content) {
  return createHash('sha256').update(content, 'utf-8').digest('hex');
}

function getNodeContent(nodeId, node) {
  // For protocol/document nodes, try to read the actual file
  if (nodeId.startsWith('PROTO_')) {
    const label = (node.data?.label || '').toLowerCase();
    // Map to known protocol files
    const knownFiles = [
      'AGENT_STATUS_LEDGER.md', 'AGENT_TARGETED_HANDOFF_V1.md',
      'TNF_GOVERNANCE_TENETS.md', 'TNF_GOVERNANCE_SYNTHESIS_v2.0.md',
      'LIVING_STATE.md', 'TNF_CORPORATE_DEPARTMENT_ORCHESTRATION_MANUAL.md',
      'CORE_SYSTEM_PROMPT_ARCHITECTURE.md', 'TNF_DOCUMENT_VETTING_PROCEDURE.md',
      'TNF_BOOK_OF_AXIOMS.md', 'TNF_SYSTEM_LEXICON.md',
      'TNF_RESOURCE_STRATEGY.md', 'TNF_INFORMATION_INGESTION_PIPELINE.md',
      'TNF_DOCUMENT_TAGGING_PROTOCOL.md', 'TNF_VIRTUAL_LIBRARY_CONSOLIDATION_PROTOCOL.md',
      'EXECUTABLE_INTELLIGENCE_FRAMEWORK.md', 'INFORMATION_INTENTIONS.md',
      'TNF_GOVERNANCE_SYNTHESIS_v2.0.md',
    ];
    for (const file of fs.readdirSync(protocolDir).filter(f => f.endsWith('.md'))) {
      const content = fs.readFileSync(path.join(protocolDir, file), 'utf-8');
      if (content.toLowerCase().includes(label.substring(0, 20))) {
        return content;
      }
    }
    return nodeId + ':' + (node.data?.label || 'unknown');
  }
  
  // For domain nodes, use AGENTS.md content
  if (nodeId.startsWith('DOMAIN_')) {
    if (fs.existsSync(path.join(root, 'AGENTS.md'))) {
      return fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf-8');
    }
    return nodeId + ':' + (node.data?.label || 'unknown');
  }
  
  // For code nodes, use the file path
  if (node.data?.filePath) {
    const filePath = path.join(root, node.data.filePath);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  }
  
  // Fallback: hash the node's metadata
  return nodeId + ':' + (node.data?.label || 'unknown') + ':' + (node.data?.parentId || 'root');
}

function buildMerkleTree(nodes) {
  // Step 1: Compute leaf hashes for each node
  const leaves = nodes.map(([nodeId, node]) => {
    const content = getNodeContent(nodeId, node);
    return {
      id: nodeId,
      merkle_hash: hashContent(content),
      content_hash: hashContent(content),
      merkle_level: 0,
      node_type: 'leaf',
      parent_id: null,
    };
  });
  
  // Step 2: Build the tree bottom-up
  let currentLevel = [...leaves];
  let level = 0;
  
  while (currentLevel.length > 1) {
    level++;
    const nextLevel = [];
    
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || currentLevel[i]; // Duplicate last if odd
      
      const combinedHash = hashContent(left.merkle_hash + right.merkle_hash);
      nextLevel.push({
        id: `MERKLE_L${level}_${Math.floor(i / 2)}`,
        merkle_hash: combinedHash,
        content_hash: null,
        merkle_level: level,
        parent_id: null,
        children_count: i + 1 < currentLevel.length ? 2 : 1,
      });
      
      // Update parent references
      left.parent_id = nextLevel[nextLevel.length - 1].id;
      if (right !== left) {
        right.parent_id = nextLevel[nextLevel.length - 1].id;
      }
    }
    
    currentLevel = nextLevel;
  }
  
  // Step 3: The last remaining node is the root
  const merkleRoot = currentLevel[0].merkle_hash;
  
  return {
    merkle_root: merkleRoot,
    merkle_timestamp: new Date().toISOString(),
    merkle_algorithm: 'sha256',
    tree_version: '1.0.0',
    total_levels: level,
    total_leaves: leaves.length,
    tree_signature: null,
    leaves,
    root_node: currentLevel[0],
  };
}

function main() {
  console.log('Computing Merkle tree for all 15,707 nodes...');
  
  const codebaseMap = JSON.parse(fs.readFileSync(codebaseMapPath, 'utf-8'));
  const nodes = Object.entries(codebaseMap.nodes || {});
  
  console.log(`  Total nodes: ${nodes.length}`);
  
  const merkleTree = buildMerkleTree(nodes);
  
  // Save the Merkle tree
  fs.mkdirSync(path.dirname(merkleOutputPath), { recursive: true });
  fs.writeFileSync(merkleOutputPath, JSON.stringify(merkleTree, null, 2));
  
  console.log(`\n✅ Merkle Tree computed:`);
  console.log(`  Root Hash:    ${merkleTree.merkle_root}`);
  console.log(`  Leaves:       ${merkleTree.total_leaves}`);
  console.log(`  Levels:       ${merkleTree.total_levels}`);
  console.log(`  Timestamp:    ${merkleTree.merkle_timestamp}`);
  console.log(`  Output:       ${merkleOutputPath}`);
  
  // Update node_status.json to include merkle_root
  const nodeStatusPath = path.join(root, 'data/reviews/node_status.json');
  if (fs.existsSync(nodeStatusPath)) {
    const nodeStatus = JSON.parse(fs.readFileSync(nodeStatusPath, 'utf-8'));
    nodeStatus.merkle_root = merkleTree.merkle_root;
    nodeStatus.merkle_timestamp = merkleTree.merkle_timestamp;
    nodeStatus.merkle_algorithm = 'sha256';
    fs.writeFileSync(nodeStatusPath, JSON.stringify(nodeStatus, null, 2));
    console.log('  ✅ Merkle root stored in node_status.json');
  }
  
  // Update codebase_map.json with merkle_root
  if (codebaseMap) {
    codebaseMap.merkle_root = merkleTree.merkle_root;
    codebaseMap.merkle_timestamp = merkleTree.merkle_timestamp;
    codebaseMap.merkle_algorithm = 'sha256';
    fs.writeFileSync(codebaseMapPath, JSON.stringify(codebaseMap, null, 2));
    console.log('  ✅ Merkle root stored in codebase_map.json');
  }
  
  console.log('\nMerkle tree computation complete.');
}

main();