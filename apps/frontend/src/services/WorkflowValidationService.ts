/**
 * Workflow Validation Service - Comprehensive workflow validation
 */

import { Edge, Node } from 'reactflow';
import { Workflow } from './WorkflowService';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  id: string;
  type: 'structure' | 'node' | 'edge' | 'configuration' | 'dependency';
  severity: 'error' | 'warning';
  message: string;
  nodeId?: string;
  edgeId?: string;
  details?: Record<string, any>;
}

export interface ValidationWarning extends ValidationError {
  severity: 'warning';
}

class WorkflowValidationService {
  // Main validation method
  async validateWorkflow(workflow: Workflow): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Structural validation
    errors.push(...this.validateStructure(workflow.nodes, workflow.edges));

    // Node validation
    for (const node of workflow.nodes) {
      errors.push(...this.validateNode(node, workflow.nodes, workflow.edges));
    }

    // Edge validation
    for (const edge of workflow.edges) {
      errors.push(...this.validateEdge(edge, workflow.nodes));
    }

    // Workflow-level validation
    errors.push(...this.validateWorkflowLogic(workflow.nodes, workflow.edges));

    // Performance warnings
    warnings.push(...this.generatePerformanceWarnings(workflow.nodes, workflow.edges));

    // Separate errors and warnings
    const actualErrors = errors.filter((e) => e.severity === 'error');
    const actualWarnings = [...warnings, ...errors.filter((e) => e.severity === 'warning')];

    return {
      valid: actualErrors.length === 0,
      errors: actualErrors,
      warnings: actualWarnings,
    };
  }

  // Validate workflow structure
  private validateStructure(nodes: Node[], edges: Edge[]): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for empty workflow
    if (nodes.length === 0) {
      errors.push({
        id: 'empty-workflow',
        type: 'structure',
        severity: 'error',
        message: 'Workflow cannot be empty',
      });
      return errors;
    }

    // Check for start nodes
    const startNodes = nodes.filter((node) => !edges.some((edge) => edge.target === node.id));

    if (startNodes.length === 0) {
      errors.push({
        id: 'no-start-node',
        type: 'structure',
        severity: 'error',
        message: 'Workflow must have at least one start node (node with no incoming connections)',
      });
    }

    // Check for end nodes
    const endNodes = nodes.filter((node) => !edges.some((edge) => edge.source === node.id));

    if (endNodes.length === 0) {
      errors.push({
        id: 'no-end-node',
        type: 'structure',
        severity: 'warning',
        message: 'Workflow should have at least one end node (node with no outgoing connections)',
      });
    }

    // Check for isolated nodes
    const connectedNodeIds = new Set([
      ...edges.map((e) => e.source),
      ...edges.map((e) => e.target),
    ]);

    const isolatedNodes = nodes.filter((node) => !connectedNodeIds.has(node.id));

    isolatedNodes.forEach((node) => {
      errors.push({
        id: `isolated-node-${node.id}`,
        type: 'structure',
        severity: 'warning',
        message: `Node "${node.data?.name || node.id}" is not connected to the workflow`,
        nodeId: node.id,
      });
    });

    return errors;
  }

  // Validate individual nodes
  private validateNode(node: Node, allNodes: Node[], allEdges: Edge[]): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check node data
    if (!node.data) {
      errors.push({
        id: `node-no-data-${node.id}`,
        type: 'node',
        severity: 'error',
        message: `Node "${node.id}" has no data`,
        nodeId: node.id,
      });
      return errors;
    }

    // Check node name
    if (!node.data.name || node.data.name.trim() === '') {
      errors.push({
        id: `node-no-name-${node.id}`,
        type: 'node',
        severity: 'warning',
        message: `Node "${node.id}" has no name`,
        nodeId: node.id,
      });
    }

    // Type-specific validation
    switch (node.type) {
      case 'agent':
        errors.push(...this.validateAgentNode(node));
        break;
      case 'mcpTool':
        errors.push(...this.validateMCPToolNode(node));
        break;
      case 'condition':
        errors.push(...this.validateConditionNode(node, allEdges));
        break;
      case 'loop':
        errors.push(...this.validateLoopNode(node));
        break;
      case 'subworkflow':
        errors.push(...this.validateSubworkflowNode(node));
        break;
    }

    return errors;
  }

  // Validate agent nodes
  private validateAgentNode(node: Node): ValidationError[] {
    const errors: ValidationError[] = [];
    const config = node.data?.config || {};

    if (!config.agentId) {
      errors.push({
        id: `agent-no-id-${node.id}`,
        type: 'configuration',
        severity: 'error',
        message: `Agent node "${node.data?.name || node.id}" has no agent selected`,
        nodeId: node.id,
      });
    }

    return errors;
  }

  // Validate MCP tool nodes
  private validateMCPToolNode(node: Node): ValidationError[] {
    const errors: ValidationError[] = [];
    const config = node.data?.config || {};

    if (!config.mcpServer) {
      errors.push({
        id: `mcp-no-server-${node.id}`,
        type: 'configuration',
        severity: 'error',
        message: `MCP Tool node "${node.data?.name || node.id}" has no server selected`,
        nodeId: node.id,
      });
    }

    if (!config.mcpTool) {
      errors.push({
        id: `mcp-no-tool-${node.id}`,
        type: 'configuration',
        severity: 'error',
        message: `MCP Tool node "${node.data?.name || node.id}" has no tool selected`,
        nodeId: node.id,
      });
    }

    return errors;
  }

  // Validate condition nodes
  private validateConditionNode(node: Node, allEdges: Edge[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const config = node.data?.config || {};

    // Check for condition expression
    if (!config.expression || config.expression.trim() === '') {
      errors.push({
        id: `condition-no-expression-${node.id}`,
        type: 'configuration',
        severity: 'error',
        message: `Condition node "${node.data?.name || node.id}" has no condition expression`,
        nodeId: node.id,
      });
    }

    // Check for multiple output paths
    const outgoingEdges = allEdges.filter((edge) => edge.source === node.id);
    if (outgoingEdges.length < 2) {
      errors.push({
        id: `condition-single-path-${node.id}`,
        type: 'structure',
        severity: 'warning',
        message: `Condition node "${node.data?.name || node.id}" should have at least two output paths`,
        nodeId: node.id,
      });
    }

    return errors;
  }

  // Validate loop nodes
  private validateLoopNode(node: Node): ValidationError[] {
    const errors: ValidationError[] = [];
    const config = node.data?.config || {};

    if (!config.collection) {
      errors.push({
        id: `loop-no-collection-${node.id}`,
        type: 'configuration',
        severity: 'error',
        message: `Loop node "${node.data?.name || node.id}" has no collection specified`,
        nodeId: node.id,
      });
    }

    return errors;
  }

  // Validate subworkflow nodes
  private validateSubworkflowNode(node: Node): ValidationError[] {
    const errors: ValidationError[] = [];
    const config = node.data?.config || {};

    if (!config.subworkflowId) {
      errors.push({
        id: `subworkflow-no-id-${node.id}`,
        type: 'configuration',
        severity: 'error',
        message: `Subworkflow node "${node.data?.name || node.id}" has no subworkflow selected`,
        nodeId: node.id,
      });
    }

    return errors;
  }

  // Validate edges
  private validateEdge(edge: Edge, allNodes: Node[]): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check source node exists
    const sourceNode = allNodes.find((node) => node.id === edge.source);
    if (!sourceNode) {
      errors.push({
        id: `edge-invalid-source-${edge.id}`,
        type: 'edge',
        severity: 'error',
        message: `Edge "${edge.id}" has invalid source node "${edge.source}"`,
        edgeId: edge.id,
      });
    }

    // Check target node exists
    const targetNode = allNodes.find((node) => node.id === edge.target);
    if (!targetNode) {
      errors.push({
        id: `edge-invalid-target-${edge.id}`,
        type: 'edge',
        severity: 'error',
        message: `Edge "${edge.id}" has invalid target node "${edge.target}"`,
        edgeId: edge.id,
      });
    }

    // Check for self-loops
    if (edge.source === edge.target) {
      errors.push({
        id: `edge-self-loop-${edge.id}`,
        type: 'edge',
        severity: 'warning',
        message: `Edge "${edge.id}" creates a self-loop`,
        edgeId: edge.id,
      });
    }

    return errors;
  }

  // Validate workflow logic
  private validateWorkflowLogic(nodes: Node[], edges: Edge[]): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for circular dependencies
    const cycles = this.detectCycles(nodes, edges);
    cycles.forEach((cycle, index) => {
      errors.push({
        id: `circular-dependency-${index}`,
        type: 'dependency',
        severity: 'error',
        message: `Circular dependency detected: ${cycle.join(' → ')}`,
        details: { cycle },
      });
    });

    return errors;
  }

  // Detect cycles in the workflow graph
  private detectCycles(nodes: Node[], edges: Edge[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    // Build adjacency list
    const adjacencyList = new Map<string, string[]>();
    nodes.forEach((node) => adjacencyList.set(node.id, []));
    edges.forEach((edge) => {
      const neighbors = adjacencyList.get(edge.source) || [];
      neighbors.push(edge.target);
      adjacencyList.set(edge.source, neighbors);
    });

    // DFS to detect cycles
    const dfs = (nodeId: string, path: string[]): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor);
          const cycle = path.slice(cycleStart);
          cycle.push(neighbor); // Complete the cycle
          cycles.push(cycle);
        }
      }

      recursionStack.delete(nodeId);
    };

    // Check each unvisited node
    nodes.forEach((node) => {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    });

    return cycles;
  }

  // Generate performance warnings
  private generatePerformanceWarnings(nodes: Node[], edges: Edge[]): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check for too many nodes
    if (nodes.length > 50) {
      warnings.push({
        id: 'too-many-nodes',
        type: 'structure',
        severity: 'warning',
        message: `Workflow has ${nodes.length} nodes. Consider breaking it into smaller workflows for better performance.`,
      });
    }

    // Check for deeply nested structures
    const maxDepth = this.calculateMaxDepth(nodes, edges);
    if (maxDepth > 10) {
      warnings.push({
        id: 'deep-nesting',
        type: 'structure',
        severity: 'warning',
        message: `Workflow has a maximum depth of ${maxDepth} levels. Deep nesting can impact performance.`,
      });
    }

    return warnings;
  }

  // Calculate maximum depth of the workflow
  private calculateMaxDepth(nodes: Node[], edges: Edge[]): number {
    // Find start nodes
    const startNodes = nodes.filter((node) => !edges.some((edge) => edge.target === node.id));

    if (startNodes.length === 0) return 0;

    // Build adjacency list
    const adjacencyList = new Map<string, string[]>();
    nodes.forEach((node) => adjacencyList.set(node.id, []));
    edges.forEach((edge) => {
      const neighbors = adjacencyList.get(edge.source) || [];
      neighbors.push(edge.target);
      adjacencyList.set(edge.source, neighbors);
    });

    // BFS to find maximum depth
    let maxDepth = 0;
    const queue: { nodeId: string; depth: number }[] = startNodes.map((node) => ({
      nodeId: node.id,
      depth: 1,
    }));
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      maxDepth = Math.max(maxDepth, depth);

      const neighbors = adjacencyList.get(nodeId) || [];
      neighbors.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          queue.push({ nodeId: neighbor, depth: depth + 1 });
        }
      });
    }

    return maxDepth;
  }

  // Quick validation for real-time feedback
  validateNodeConfiguration(node: Node): ValidationError[] {
    return this.validateNode(node, [node], []);
  }

  // Validate edge connection
  validateEdgeConnection(sourceNode: Node, targetNode: Node): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for self-connection
    if (sourceNode.id === targetNode.id) {
      errors.push({
        id: 'self-connection',
        type: 'edge',
        severity: 'warning',
        message: 'Cannot connect a node to itself',
      });
    }

    // Type-specific connection rules
    if (sourceNode.type === 'input' && targetNode.type === 'input') {
      errors.push({
        id: 'input-to-input',
        type: 'edge',
        severity: 'error',
        message: 'Cannot connect input node to another input node',
      });
    }

    if (sourceNode.type === 'output' && targetNode.type === 'output') {
      errors.push({
        id: 'output-to-output',
        type: 'edge',
        severity: 'error',
        message: 'Cannot connect output node to another output node',
      });
    }

    return errors;
  }
}

// Export singleton instance
export const workflowValidationService = new WorkflowValidationService();
export default WorkflowValidationService;
