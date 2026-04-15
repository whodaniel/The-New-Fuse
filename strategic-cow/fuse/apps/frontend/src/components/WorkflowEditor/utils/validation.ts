// @ts-nocheck
// Validation utilities for N8n workflows and dynamic validation

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface WorkflowValidationOptions {
  checkCircularDependencies?: boolean;
  checkRequiredParameters?: boolean;
  checkConnections?: boolean;
  strictMode?: boolean;
}

/**
 * Validates an N8n workflow structure
 */
export function validateN8nWorkflow(
  workflow: any,
  options: WorkflowValidationOptions = {}
): ValidationResult {
  const {
    checkCircularDependencies = true,
    checkRequiredParameters = true,
    checkConnections = true,
    strictMode = false,
  } = options;

  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic structure validation
  if (!workflow) {
    errors.push('Workflow is null or undefined');
    return { isValid: false, errors, warnings };
  }

  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    errors.push('Workflow must have a nodes array');
    return { isValid: false, errors, warnings };
  }

  if (!workflow.connections) {
    errors.push('Workflow must have a connections object');
    return { isValid: false, errors, warnings };
  }

  // Check for at least one start node
  const startNodes = workflow.nodes.filter(
    (node: any) => node.type === 'n8n-nodes-base.start' || node.type === 'start'
  );

  if (startNodes.length === 0) {
    warnings.push('Workflow should have at least one start node');
  } else if (startNodes.length > 1) {
    warnings.push('Multiple start nodes found - only one will be executed');
  }

  // Validate individual nodes
  workflow.nodes.forEach((node: any, index: number) => {
    if (!node.id) {
      errors.push(`Node at index ${index} is missing an ID`);
    }

    if (!node.type) {
      errors.push(`Node ${node.id || index} is missing a type`);
    }

    if (!node.name) {
      warnings.push(`Node ${node.id || index} is missing a name`);
    }

    // Check required parameters if enabled
    if (checkRequiredParameters) {
      validateNodeParameters(node, errors, warnings);
    }
  });

  // Check connections if enabled
  if (checkConnections) {
    validateConnections(workflow, errors, warnings);
  }

  // Check for circular dependencies if enabled
  if (checkCircularDependencies) {
    const circularCheck = checkCircularDependencies(workflow);
    if (!circularCheck.isValid) {
      errors.push(...circularCheck.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates node parameters based on node type
 */
function validateNodeParameters(node: any, errors: string[], warnings: string[]): void {
  const parameters = node.parameters || {};

  switch (node.type) {
    case 'n8n-nodes-base.httpRequest':
    case 'httpRequest':
      if (!parameters.url) {
        errors.push(`HTTP Request node ${node.id} is missing required URL parameter`);
      }
      if (!parameters.method) {
        warnings.push(`HTTP Request node ${node.id} is missing method parameter (defaults to GET)`);
      }
      break;

    case 'n8n-nodes-base.slack':
    case 'slack':
      if (!parameters.channel) {
        errors.push(`Slack node ${node.id} is missing required channel parameter`);
      }
      if (!parameters.text && !parameters.blocks) {
        errors.push(`Slack node ${node.id} is missing message content (text or blocks)`);
      }
      break;

    case 'n8n-nodes-base.code':
    case 'code':
      if (!parameters.code) {
        errors.push(`Code node ${node.id} is missing required code parameter`);
      }
      break;
  }
}

/**
 * Validates workflow connections
 */
function validateConnections(workflow: any, errors: string[], warnings: string[]): void {
  const { nodes, connections } = workflow;
  const nodeIds = new Set(nodes.map((node: any) => node.id));

  // Check that all connections reference existing nodes
  Object.keys(connections).forEach((sourceNodeId) => {
    if (!nodeIds.has(sourceNodeId)) {
      errors.push(`Connection references non-existent source node: ${sourceNodeId}`);
      return;
    }

    const nodeConnections = connections[sourceNodeId];
    if (nodeConnections.main) {
      nodeConnections.main.forEach((connection: any, index: number) => {
        if (!nodeIds.has(connection.node)) {
          errors.push(
            `Connection from ${sourceNodeId} references non-existent target node: ${connection.node}`
          );
        }
      });
    }
  });

  // Check for isolated nodes (nodes with no connections)
  const connectedNodes = new Set();
  Object.keys(connections).forEach((sourceId) => {
    connectedNodes.add(sourceId);
    const nodeConnections = connections[sourceId];
    if (nodeConnections.main) {
      nodeConnections.main.forEach((connection: any) => {
        connectedNodes.add(connection.node);
      });
    }
  });

  nodes.forEach((node: any) => {
    if (!connectedNodes.has(node.id) && node.type !== 'n8n-nodes-base.start') {
      warnings.push(`Node ${node.id} (${node.name}) appears to be isolated`);
    }
  });
}

/**
 * Checks for circular dependencies in workflow
 */
function checkCircularDependencies(workflow: any): ValidationResult {
  const { connections } = workflow;
  const errors: string[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCircularDependency(nodeId: string): boolean {
    if (!connections[nodeId]) return false;

    if (recursionStack.has(nodeId)) {
      errors.push(`Circular dependency detected involving node: ${nodeId}`);
      return true;
    }

    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const nodeConnections = connections[nodeId];
    if (nodeConnections.main) {
      for (const connection of nodeConnections.main) {
        if (hasCircularDependency(connection.node)) {
          return true;
        }
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // Check all nodes for circular dependencies
  Object.keys(connections).forEach((nodeId) => {
    if (!visited.has(nodeId)) {
      hasCircularDependency(nodeId);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  };
}

/**
 * Creates a dynamic validator for specific node types
 */
export function createDynamicValidator(nodeType: string) {
  return function (parameters: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (nodeType) {
      case 'httpRequest':
      case 'n8n-nodes-base.httpRequest':
        if (!parameters.url) {
          errors.push('URL is required for HTTP Request nodes');
        } else {
          try {
            new URL(parameters.url);
          } catch {
            errors.push('URL must be a valid URL format');
          }
        }

        if (
          parameters.method &&
          !['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(parameters.method)
        ) {
          warnings.push(`Unusual HTTP method: ${parameters.method}`);
        }
        break;

      case 'slack':
      case 'n8n-nodes-base.slack':
        if (!parameters.channel) {
          errors.push('Channel is required for Slack nodes');
        } else if (!parameters.channel.startsWith('#') && !parameters.channel.startsWith('@')) {
          warnings.push('Slack channel should typically start with # or @');
        }

        if (!parameters.text && !parameters.blocks) {
          errors.push('Either text or blocks must be provided for Slack messages');
        }
        break;

      case 'code':
      case 'n8n-nodes-base.code':
        if (!parameters.code) {
          errors.push('Code is required for Code nodes');
        } else if (parameters.code.length > 10000) {
          warnings.push('Code is very long - consider breaking into smaller functions');
        }
        break;

      default:
        warnings.push(`No specific validation available for node type: ${nodeType}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  };
}

/**
 * Validates ReactFlow data structure
 */
export function validateReactFlowData(nodes: any[], edges: any[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate nodes
  if (!Array.isArray(nodes)) {
    errors.push('Nodes must be an array');
  } else {
    nodes.forEach((node, index) => {
      if (!node.id) {
        errors.push(`Node at index ${index} is missing an ID`);
      }
      if (!node.type) {
        errors.push(`Node ${node.id || index} is missing a type`);
      }
      if (!node.position) {
        errors.push(`Node ${node.id || index} is missing position data`);
      }
    });
  }

  // Validate edges
  if (!Array.isArray(edges)) {
    errors.push('Edges must be an array');
  } else {
    const nodeIds = new Set(nodes.map((node) => node.id));

    edges.forEach((edge, index) => {
      if (!edge.id) {
        errors.push(`Edge at index ${index} is missing an ID`);
      }
      if (!edge.source) {
        errors.push(`Edge ${edge.id || index} is missing source`);
      } else if (!nodeIds.has(edge.source)) {
        errors.push(`Edge ${edge.id || index} references non-existent source node: ${edge.source}`);
      }
      if (!edge.target) {
        errors.push(`Edge ${edge.id || index} is missing target`);
      } else if (!nodeIds.has(edge.target)) {
        errors.push(`Edge ${edge.id || index} references non-existent target node: ${edge.target}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export default {
  validateN8nWorkflow,
  createDynamicValidator,
  validateReactFlowData,
};
