import { Node, Edge } from "reactflow";
import { nodeConfigurationSchema } from '../schemas/nodeConfiguration.js';
import { NodeType } from '../types.js';

export function validateWorkflow(nodes: Node[], edges: Edge[]): string[] {
  const errors: string[] = [];

  // Validate nodes
  nodes.forEach((node) => {
    const nodeType = node.type as keyof typeof nodeConfigurationSchema;
    const schema = nodeConfigurationSchema[nodeType];

    if (!schema) {
      errors.push(`Invalid node type: ${nodeType}`);
      return;
    }

    // Validate required configuration
    Object.entries(schema).forEach(([key, field]) => {
      if (field.validation?.required && !node.data?.config?.[key]) {
        errors.push(
          `Node "${node.data?.label}" (${node.id}): Missing required field "${field.label}"`,
        );
      }
    });
  });

  // Validate edges
  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) {
      errors.push(
        `Invalid edge: Missing ${!sourceNode ? "source" : "target"} node`,
      );
      return;
    }

    // Validate port compatibility
    const sourceNodeType = sourceNode.type as NodeType;
    const targetNodeType = targetNode.type as NodeType;

    if (
      !isPortCompatible(
        sourceNodeType,
        targetNodeType,
        edge.sourceHandle!,
        edge.targetHandle!,
      )
    ) {
      errors.push(
        `Incompatible connection between "${sourceNode.data?.label}" and "${targetNode.data?.label}"`,
      );
    }
  });

  // Validate for cycles
  if (hasCycles(nodes, edges)) {
    errors.push("Workflow contains cycles, which are not allowed");
  }

  return errors;
}

function isPortCompatible(
  sourceType: NodeType,
  targetType: NodeType,
  sourcePortId: string,
  targetPortId: string,
): boolean {
  const sourceOutput = sourceType.outputs.find((p) => p.id === sourcePortId);
  const targetInput = targetType.inputs.find((p) => p.id === targetPortId);

  if (!sourceOutput || !targetInput) {
    return false;
  }

  return sourceOutput.type === targetInput.type || targetInput.type === "any";
}

function hasCycles(nodes: Node[], edges: Edge[]): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoingEdges = edges.filter((e) => e.source === nodeId);
    for (const edge of outgoingEdges) {
      if (!visited.has(edge.target)) {
        if (dfs(edge.target)) {
          return true;
        }
      } else if (recursionStack.has(edge.target)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) {
        return true;
      }
    }
  }

  return false;
}
