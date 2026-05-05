import fs from 'fs';
import path from 'path';

/**
 * TNF Ecosystem Parser Engine (Super Cycle V2)
 * Parses Mermaid AST Map, Agent Profiles, and Protocol Documents into a unified ReactFlow JSON structure.
 */

import { fileURLToPath } from 'url';

// Resolve monorepo root based on script location
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MONOREPO_ROOT = path.resolve(__dirname, '../../');

function parseMermaid(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const nodesMap = new Map();
  const edges = [];
  
  const classDefMap = new Map();
  
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('```') || line.startsWith('flowchart') || line.startsWith('classDef')) {
      if (line.startsWith('classDef')) {
        const match = line.match(/classDef\s+(\w+)\s+/);
        if (match) classDefMap.set(match[1], match[1]);
      }
      continue;
    }

    const nodeMatch = line.match(/^(\w+)\[([^\]]+)\](:::(\w+))?$/);
    if (nodeMatch) {
      const id = nodeMatch[1];
      const label = nodeMatch[2];
      const kind = nodeMatch[4] || 'default';
      nodesMap.set(id, { id, label, kind, children: [], data: {} });
      continue;
    }

    const edgeMatch = line.match(/^(\w+)\s+-->\s+(\w+)$/);
    if (edgeMatch) {
      const source = edgeMatch[1];
      const target = edgeMatch[2];
      edges.push({ source, target });
      
      const sourceNode = nodesMap.get(source);
      const targetNode = nodesMap.get(target);
      if (sourceNode && targetNode) {
        sourceNode.children.push(target);
        targetNode.parentId = source;
      }
      continue;
    }
  }

  return { nodesMap, edges };
}

function expandMapWithAgentsAndProtocols(nodesMap, edges) {
  // Create super-nodes if they don't exist
  if (!nodesMap.has('TNF')) {
    nodesMap.set('TNF', { id: 'TNF', label: 'The New Fuse Ecosystem', kind: 'pkg', children: [], data: {} });
  }
  
  const tnfNode = nodesMap.get('TNF');

  // Create Agents Domain
  const agentsRootId = 'DOMAIN_AGENTS';
  nodesMap.set(agentsRootId, { id: agentsRootId, label: 'Agent Matrix & Personas', kind: 'premium', children: [], parentId: 'TNF', data: { authRequired: true } });
  edges.push({ source: 'TNF', target: agentsRootId });
  tnfNode.children.push(agentsRootId);

  // Parse AGENTS.md
  try {
    const agentsPath = path.join(MONOREPO_ROOT, 'AGENTS.md');
    if (fs.existsSync(agentsPath)) {
      const agentsContent = fs.readFileSync(agentsPath, 'utf-8');
      const skillMatches = [...agentsContent.matchAll(/- \*\*([\w-]+)\*\*/g)];
      
      skillMatches.forEach((match, index) => {
        const skillName = match[1];
        const skillId = `AGENT_SKILL_${index}`;
        nodesMap.set(skillId, { id: skillId, label: skillName, kind: 'cls', children: [], parentId: agentsRootId, data: { description: 'Agent Skill definition.', authRequired: true } });
        edges.push({ source: agentsRootId, target: skillId });
        nodesMap.get(agentsRootId).children.push(skillId);
      });
    }
  } catch(e) {
    console.warn('Failed to parse AGENTS.md', e.message);
  }

  // Create Protocols Domain
  const protocolsRootId = 'DOMAIN_PROTOCOLS';
  nodesMap.set(protocolsRootId, { id: protocolsRootId, label: 'Core Protocols & Directives', kind: 'premium', children: [], parentId: 'TNF', data: { authRequired: false } });
  edges.push({ source: 'TNF', target: protocolsRootId });
  tnfNode.children.push(protocolsRootId);

  // Read docs/protocols/
  try {
    const protocolsDir = path.join(MONOREPO_ROOT, 'docs/protocols');
    if (fs.existsSync(protocolsDir)) {
      const files = fs.readdirSync(protocolsDir).filter(f => f.endsWith('.md'));
      files.forEach((file, index) => {
        const protoId = `PROTO_${index}`;
        const label = file.replace('.md', '');
        
        // Add lock flag for specific sensitive protocols (e.g. governance, auth)
        const isAuthRequired = label.includes('GOVERNANCE') || label.includes('LIVING_STATE') || label.includes('SECURITY');
        
        nodesMap.set(protoId, { id: protoId, label: label, kind: 'file', children: [], parentId: protocolsRootId, data: { authRequired: isAuthRequired, description: `Protocol Document: ${file}` } });
        edges.push({ source: protocolsRootId, target: protoId });
        nodesMap.get(protocolsRootId).children.push(protoId);
      });
    }
  } catch(e) {
    console.warn('Failed to parse protocols', e.message);
  }

  return { nodesMap, edges };
}

function execute() {
  const inputPath = path.join(MONOREPO_ROOT, 'TNF_EXHAUSTIVE_AST_MAP.md');
  const outputPath = path.join(MONOREPO_ROOT, 'apps/frontend/src/data/codebase_map.json');

  console.log(`Parsing Core AST from ${inputPath}...`);
  let { nodesMap, edges } = parseMermaid(inputPath);
  
  console.log(`Injecting Deep Data (Agents, Protocols, Auth Matrix)...`);
  ({ nodesMap, edges } = expandMapWithAgentsAndProtocols(nodesMap, edges));

  // Convert to ReactFlow format
  const rfNodes = Array.from(nodesMap.values()).map(node => ({
    id: node.id,
    type: node.kind === 'mth' ? 'method' : (node.kind === 'cls' ? 'class' : (node.kind === 'file' ? 'file' : 'premium')),
    data: { 
      label: node.label,
      kind: node.kind,
      parentId: node.parentId,
      childCount: node.children.length,
      authRequired: node.data?.authRequired || false,
      description: node.data?.description || null
    },
    position: { x: 0, y: 0 },
  }));

  const rfEdges = edges.map((edge, index) => ({
    id: `e-${index}`,
    source: edge.source,
    target: edge.target,
    animated: true,
  }));

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify({ nodes: rfNodes, edges: rfEdges }, null, 2));
  console.log(`Successfully generated ${rfNodes.length} nodes and ${rfEdges.length} edges at ${outputPath}`);
}

execute();
