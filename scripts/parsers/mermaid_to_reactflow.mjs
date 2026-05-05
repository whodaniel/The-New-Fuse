import fs from 'fs';
import path from 'path';

/**
 * TNF Mermaid Parser
 * Converts massive Mermaid diagrams into a hierarchical JSON structure for ReactFlow.
 * Specifically designed for TNF_EXHAUSTIVE_AST_MAP.md
 */

function parseMermaid(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const nodesMap = new Map();
  const edges = [];
  
  // 1. Extract class definitions for styling
  const classDefMap = new Map();
  
  // 2. Main parsing loop
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('```') || line.startsWith('flowchart') || line.startsWith('classDef')) {
      if (line.startsWith('classDef')) {
        const match = line.match(/classDef\s+(\w+)\s+/);
        if (match) classDefMap.set(match[1], match[1]);
      }
      continue;
    }

    // Parse Nodes: ID[Label]:::Kind or ID[Label]
    // Regex for: ID[Label text]:::kind
    const nodeMatch = line.match(/^(\w+)\[([^\]]+)\](:::(\w+))?$/);
    if (nodeMatch) {
      const id = nodeMatch[1];
      const label = nodeMatch[2];
      const kind = nodeMatch[4] || 'default';
      nodesMap.set(id, { id, label, kind, children: [] });
      continue;
    }

    // Parse Edges: ID1 --> ID2
    const edgeMatch = line.match(/^(\w+)\s+-->\s+(\w+)$/);
    if (edgeMatch) {
      const source = edgeMatch[1];
      const target = edgeMatch[2];
      edges.push({ source, target });
      
      // Build hierarchy
      const sourceNode = nodesMap.get(source);
      const targetNode = nodesMap.get(target);
      if (sourceNode && targetNode) {
        sourceNode.children.push(target);
        targetNode.parentId = source;
      }
      continue;
    }
  }

  // Convert to ReactFlow format
  const rfNodes = Array.from(nodesMap.values()).map(node => ({
    id: node.id,
    type: node.kind === 'mth' ? 'method' : (node.kind === 'cls' ? 'class' : (node.kind === 'file' ? 'file' : 'premium')),
    data: { 
      label: node.label,
      kind: node.kind,
      parentId: node.parentId,
      childCount: node.children.length
    },
    position: { x: 0, y: 0 },
  }));

  const rfEdges = edges.map((edge, index) => ({
    id: `e-${index}`,
    source: edge.source,
    target: edge.target,
    animated: true,
  }));

  return { nodes: rfNodes, edges: rfEdges };
}

const inputPath = path.join(process.cwd(), 'TNF_EXHAUSTIVE_AST_MAP.md');
const outputPath = path.join(process.cwd(), 'apps/frontend/src/data/codebase_map.json');

console.log(`Parsing ${inputPath}...`);
const result = parseMermaid(inputPath);

const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(`Successfully generated ${result.nodes.length} nodes and ${result.edges.length} edges at ${outputPath}`);
