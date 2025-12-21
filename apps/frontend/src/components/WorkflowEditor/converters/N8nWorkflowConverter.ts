/**
 * Enhanced N8N Workflow Converter
 * Provides complete feature parity with N8N workflow format
 *
 * Features:
 * - All 15+ node properties
 * - Multi-output connections (IF, Switch nodes)
 * - Pin data support
 * - Workflow settings
 * - Static data preservation
 * - Error handling configuration
 * - Retry logic
 * - Notes and annotations
 */

import { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow';

// ============================================================================
// N8N Type Definitions (Complete)
// ============================================================================

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, any>;

  // Advanced properties
  disabled?: boolean;
  notes?: string;
  notesInFlow?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  alwaysOutputData?: boolean;
  executeOnce?: boolean;
  onError?: 'stopWorkflow' | 'continueRegularOutput' | 'continueErrorOutput';
  continueOnFail?: boolean;
  webhookId?: string;
  extendsCredential?: string;
  rewireOutputLogTo?: string;
}

export interface N8nConnection {
  node: string;
  type: string;
  index: number;
}

export interface N8nConnections {
  [nodeName: string]: {
    [outputType: string]: N8nConnection[][];
  };
}

export interface N8nWorkflowSettings {
  saveDataErrorExecution?: 'all' | 'none';
  saveDataSuccessExecution?: 'all' | 'none';
  saveManualExecutions?: boolean;
  callerPolicy?: string;
  timezone?: string;
  executionTimeout?: number;
  executionOrder?: 'v0' | 'v1';
}

export interface N8nPinData {
  [nodeName: string]: any[];
}

export interface N8nWorkflow {
  id?: string;
  name: string;
  description?: string;
  active: boolean;
  isArchived?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  nodes: N8nNode[];
  connections: N8nConnections;
  settings?: N8nWorkflowSettings;
  staticData?: Record<string, any>;
  pinData?: N8nPinData;
  versionId?: string;
  activeVersionId?: string | null;
  versionCounter?: number;
  meta?: Record<string, any>;
  tags?: Array<{ id: string; name: string } | string>;
}

// ============================================================================
// ReactFlow Type Extensions
// ============================================================================

export interface EnhancedReactFlowNode extends ReactFlowNode {
  data: {
    label: string;
    type?: string;
    typeVersion?: number;

    // N8N properties
    disabled?: boolean;
    notes?: string;
    notesInFlow?: boolean;
    retryOnFail?: boolean;
    maxTries?: number;
    waitBetweenTries?: number;
    alwaysOutputData?: boolean;
    executeOnce?: boolean;
    onError?: 'stopWorkflow' | 'continueRegularOutput' | 'continueErrorOutput';
    continueOnFail?: boolean;

    // Core data
    parameters?: Record<string, any>;
    credentials?: Record<string, any>;
    webhookId?: string;

    // Output configuration
    outputTypes?: string[];
    outputCount?: number;
  };
}

export interface ReactFlowWorkflow {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
  isArchived?: boolean;
  nodes: EnhancedReactFlowNode[];
  edges: ReactFlowEdge[];
  settings?: N8nWorkflowSettings;
  pinData?: N8nPinData;
  staticData?: Record<string, any>;
  versionId?: string;
  activeVersionId?: string | null;
  versionCounter?: number;
  meta?: Record<string, any>;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// Node Type Mapping
// ============================================================================

const NODE_TYPE_MAP: Record<string, string> = {
  // Triggers
  'webhook-trigger': 'n8n-nodes-base.webhook',
  'webhook': 'n8n-nodes-base.webhook',
  'cron-trigger': 'n8n-nodes-base.cronTrigger',
  'manual-trigger': 'n8n-nodes-base.manualTrigger',
  'start': 'n8n-nodes-base.start',

  // Logic
  'if': 'n8n-nodes-base.if',
  'switch': 'n8n-nodes-base.switch',
  'merge': 'n8n-nodes-base.merge',
  'split': 'n8n-nodes-base.splitInBatches',

  // Data
  'set': 'n8n-nodes-base.set',
  'code': 'n8n-nodes-base.code',
  'function': 'n8n-nodes-base.function',

  // HTTP
  'http-request': 'n8n-nodes-base.httpRequest',
  'httpRequest': 'n8n-nodes-base.httpRequest',
  'respond-webhook': 'n8n-nodes-base.respondToWebhook',

  // Integrations
  'slack': 'n8n-nodes-base.slack',
  'gmail': 'n8n-nodes-base.gmail',
  'google-sheets': 'n8n-nodes-base.googleSheets',
};

// Reverse map for import
const REVERSE_NODE_TYPE_MAP: Record<string, string> = Object.entries(
  NODE_TYPE_MAP
).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {} as Record<string, string>);

// ============================================================================
// Multi-Output Node Configuration
// ============================================================================

interface NodeOutputConfig {
  type: string;
  count: number;
  outputTypes: string[];
  branchNames?: string[];
}

const MULTI_OUTPUT_NODES: Record<string, NodeOutputConfig> = {
  'n8n-nodes-base.if': {
    type: 'if',
    count: 2,
    outputTypes: ['main'],
    branchNames: ['true', 'false'],
  },
  'n8n-nodes-base.switch': {
    type: 'switch',
    count: -1, // Dynamic based on parameters
    outputTypes: ['main'],
    branchNames: [], // Dynamic
  },
  'n8n-nodes-base.merge': {
    type: 'merge',
    count: 1,
    outputTypes: ['main'],
  },
};

// ============================================================================
// N8N Workflow Converter Class
// ============================================================================

export class N8nWorkflowConverter {
  /**
   * Convert ReactFlow workflow to N8N format (EXPORT)
   */
  public convertToN8n(workflow: ReactFlowWorkflow): N8nWorkflow {
    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description || '',
      active: workflow.active ?? false,
      isArchived: workflow.isArchived ?? false,
      createdAt: workflow.createdAt || new Date(),
      updatedAt: workflow.updatedAt || new Date(),

      // Complete node conversion
      nodes: this.convertNodesToN8n(workflow.nodes),

      // Advanced connection handling
      connections: this.convertConnectionsToN8n(workflow.edges, workflow.nodes),

      // Settings conversion
      settings: this.convertSettingsToN8n(workflow.settings),

      // Pin data conversion
      pinData: workflow.pinData,

      // Static data
      staticData: workflow.staticData || {},

      // Metadata
      versionId: workflow.versionId,
      activeVersionId: workflow.activeVersionId || null,
      versionCounter: workflow.versionCounter || 1,
      meta: workflow.meta || {},
      tags: workflow.tags?.map((tag) =>
        typeof tag === 'string' ? { id: tag, name: tag } : tag
      ),
    };
  }

  /**
   * Convert N8N workflow to ReactFlow format (IMPORT)
   */
  public convertFromN8n(n8nWorkflow: N8nWorkflow): ReactFlowWorkflow {
    return {
      id: n8nWorkflow.id || this.generateId(),
      name: n8nWorkflow.name,
      description: n8nWorkflow.description,
      active: n8nWorkflow.active,
      isArchived: n8nWorkflow.isArchived,

      // Complete node import
      nodes: this.convertNodesFromN8n(n8nWorkflow.nodes),

      // Advanced edge creation
      edges: this.convertConnectionsFromN8n(
        n8nWorkflow.connections,
        n8nWorkflow.nodes
      ),

      // Import all metadata
      settings: n8nWorkflow.settings,
      pinData: n8nWorkflow.pinData,
      staticData: n8nWorkflow.staticData,
      versionId: n8nWorkflow.versionId,
      activeVersionId: n8nWorkflow.activeVersionId,
      versionCounter: n8nWorkflow.versionCounter,
      meta: n8nWorkflow.meta,
      tags: this.extractTagNames(n8nWorkflow.tags),
      createdAt: n8nWorkflow.createdAt,
      updatedAt: n8nWorkflow.updatedAt,
    };
  }

  // ==========================================================================
  // Node Conversion Methods
  // ==========================================================================

  private convertNodesToN8n(nodes: EnhancedReactFlowNode[]): N8nNode[] {
    return nodes.map((node) => ({
      id: node.id,
      name: node.data.label || node.id,
      type: this.mapNodeTypeToN8n(node.type || node.data.type || 'unknown'),
      typeVersion: node.data.typeVersion || 1,
      position: [node.position.x, node.position.y],

      // Advanced properties
      disabled: node.data.disabled ?? false,
      notes: node.data.notes,
      notesInFlow: node.data.notesInFlow ?? false,
      retryOnFail: node.data.retryOnFail ?? false,
      maxTries: node.data.maxTries ?? 3,
      waitBetweenTries: node.data.waitBetweenTries ?? 1000,
      alwaysOutputData: node.data.alwaysOutputData ?? false,
      executeOnce: node.data.executeOnce ?? false,
      onError: node.data.onError ?? 'stopWorkflow',
      continueOnFail: node.data.continueOnFail ?? false,

      // Core data
      parameters: node.data.parameters || {},
      credentials: node.data.credentials,
      webhookId: node.data.webhookId,
    }));
  }

  private convertNodesFromN8n(n8nNodes: N8nNode[]): EnhancedReactFlowNode[] {
    return n8nNodes.map((node, index) => {
      const nodeType = this.mapNodeTypeFromN8n(node.type);
      const outputConfig = MULTI_OUTPUT_NODES[node.type];

      return {
        id: node.id,
        type: nodeType,
        position: {
          x: node.position[0],
          y: node.position[1],
        },
        data: {
          label: node.name,
          type: node.type,
          typeVersion: node.typeVersion,

          // Advanced properties
          disabled: node.disabled,
          notes: node.notes,
          notesInFlow: node.notesInFlow,
          retryOnFail: node.retryOnFail,
          maxTries: node.maxTries,
          waitBetweenTries: node.waitBetweenTries,
          alwaysOutputData: node.alwaysOutputData,
          executeOnce: node.executeOnce,
          onError: node.onError,
          continueOnFail: node.continueOnFail,

          // Core data
          parameters: node.parameters,
          credentials: node.credentials,
          webhookId: node.webhookId,

          // Output configuration
          outputTypes: outputConfig?.outputTypes || ['main'],
          outputCount: outputConfig?.count || 1,
        },
      };
    });
  }

  // ==========================================================================
  // Connection Conversion Methods
  // ==========================================================================

  /**
   * Convert ReactFlow edges to N8N connections
   * Handles multi-output nodes and branching
   */
  private convertConnectionsToN8n(
    edges: ReactFlowEdge[],
    nodes: EnhancedReactFlowNode[]
  ): N8nConnections {
    const connections: N8nConnections = {};

    // Group edges by source node
    const edgesBySource = this.groupEdgesBySource(edges);

    Object.entries(edgesBySource).forEach(([sourceId, sourceEdges]) => {
      const node = nodes.find((n) => n.id === sourceId);
      if (!node) return;

      const outputTypes = node.data.outputTypes || ['main'];
      connections[sourceId] = {};

      outputTypes.forEach((outputType) => {
        // Get edges for this output type
        const typeEdges = sourceEdges.filter(
          (e) => this.getEdgeOutputType(e) === outputType
        );

        // Group by output index (for branching)
        const edgesByIndex = this.groupEdgesByOutputIndex(
          typeEdges,
          node.data.outputCount || 1
        );

        connections[sourceId][outputType] = edgesByIndex.map((indexGroup) =>
          indexGroup.map((edge) => ({
            node: edge.target,
            type: this.getEdgeConnectionType(edge),
            index: this.getTargetIndex(edge),
          }))
        );
      });
    });

    return connections;
  }

  /**
   * Convert N8N connections to ReactFlow edges
   * Handles multi-output nodes and branching
   */
  private convertConnectionsFromN8n(
    connections: N8nConnections,
    nodes: N8nNode[]
  ): ReactFlowEdge[] {
    const edges: ReactFlowEdge[] = [];
    let edgeId = 0;

    Object.entries(connections).forEach(([sourceNodeName, outputs]) => {
      const sourceNode = nodes.find((n) => n.name === sourceNodeName);
      if (!sourceNode) return;

      Object.entries(outputs).forEach(([outputType, branches]) => {
        branches.forEach((branch, branchIndex) => {
          branch.forEach((connection) => {
            const targetNode = nodes.find((n) => n.name === connection.node);
            if (!targetNode) return;

            const edge: ReactFlowEdge = {
              id: `e${edgeId++}`,
              source: sourceNode.id,
              target: targetNode.id,
              sourceHandle: `${outputType}-${branchIndex}`,
              targetHandle: `${connection.type}-${connection.index}`,
              type: 'default',
              animated: false,
              data: {
                outputType,
                branchIndex,
                branchName: this.getBranchName(
                  sourceNode.type,
                  branchIndex,
                  branches.length
                ),
              },
            };

            edges.push(edge);
          });
        });
      });
    });

    return edges;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private groupEdgesBySource(
    edges: ReactFlowEdge[]
  ): Record<string, ReactFlowEdge[]> {
    return edges.reduce((acc, edge) => {
      if (!acc[edge.source]) {
        acc[edge.source] = [];
      }
      acc[edge.source].push(edge);
      return acc;
    }, {} as Record<string, ReactFlowEdge[]>);
  }

  private groupEdgesByOutputIndex(
    edges: ReactFlowEdge[],
    outputCount: number
  ): ReactFlowEdge[][] {
    const groups: ReactFlowEdge[][] = Array.from(
      { length: outputCount },
      () => []
    );

    edges.forEach((edge) => {
      const index = this.getOutputIndex(edge);
      if (index < outputCount) {
        groups[index].push(edge);
      }
    });

    return groups;
  }

  private getEdgeOutputType(edge: ReactFlowEdge): string {
    return edge.sourceHandle?.split('-')[0] || 'main';
  }

  private getEdgeConnectionType(edge: ReactFlowEdge): string {
    return edge.targetHandle?.split('-')[0] || 'main';
  }

  private getOutputIndex(edge: ReactFlowEdge): number {
    const handle = edge.sourceHandle?.split('-')[1];
    return handle ? parseInt(handle, 10) : 0;
  }

  private getTargetIndex(edge: ReactFlowEdge): number {
    const handle = edge.targetHandle?.split('-')[1];
    return handle ? parseInt(handle, 10) : 0;
  }

  private getBranchName(
    nodeType: string,
    branchIndex: number,
    totalBranches: number
  ): string | undefined {
    const config = MULTI_OUTPUT_NODES[nodeType];
    if (!config || !config.branchNames) return undefined;

    return config.branchNames[branchIndex];
  }

  private mapNodeTypeToN8n(type: string): string {
    return NODE_TYPE_MAP[type] || type;
  }

  private mapNodeTypeFromN8n(n8nType: string): string {
    return REVERSE_NODE_TYPE_MAP[n8nType] || 'default';
  }

  private convertSettingsToN8n(
    settings?: N8nWorkflowSettings
  ): N8nWorkflowSettings {
    return {
      saveDataErrorExecution: settings?.saveDataErrorExecution || 'all',
      saveDataSuccessExecution: settings?.saveDataSuccessExecution || 'all',
      saveManualExecutions: settings?.saveManualExecutions ?? true,
      callerPolicy: settings?.callerPolicy || 'workflowsFromSameOwner',
      timezone: settings?.timezone || 'America/New_York',
      executionTimeout: settings?.executionTimeout || 3600,
      executionOrder: settings?.executionOrder || 'v1',
    };
  }

  private extractTagNames(
    tags?: Array<{ id: string; name: string } | string>
  ): string[] {
    if (!tags) return [];
    return tags.map((tag) => (typeof tag === 'string' ? tag : tag.name));
  }

  private generateId(): string {
    return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==========================================================================
  // Validation Methods
  // ==========================================================================

  /**
   * Validate N8N workflow structure
   */
  public validateN8nWorkflow(workflow: N8nWorkflow): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check required fields
    if (!workflow.name) {
      errors.push('Workflow name is required');
    }

    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      errors.push('Workflow must have a nodes array');
    }

    if (!workflow.connections || typeof workflow.connections !== 'object') {
      errors.push('Workflow must have a connections object');
    }

    // Validate nodes
    workflow.nodes?.forEach((node, index) => {
      if (!node.id) {
        errors.push(`Node at index ${index} missing id`);
      }
      if (!node.name) {
        errors.push(`Node at index ${index} missing name`);
      }
      if (!node.type) {
        errors.push(`Node at index ${index} missing type`);
      }
      if (!Array.isArray(node.position) || node.position.length !== 2) {
        errors.push(`Node at index ${index} has invalid position`);
      }
    });

    // Validate connections reference valid nodes
    const nodeNames = new Set(workflow.nodes?.map((n) => n.name) || []);
    Object.entries(workflow.connections || {}).forEach(
      ([sourceNode, outputs]) => {
        if (!nodeNames.has(sourceNode)) {
          errors.push(`Connection references non-existent source node: ${sourceNode}`);
        }

        Object.values(outputs).forEach((branches) => {
          branches.forEach((branch) => {
            branch.forEach((conn) => {
              if (!nodeNames.has(conn.node)) {
                errors.push(
                  `Connection references non-existent target node: ${conn.node}`
                );
              }
            });
          });
        });
      }
    );

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate ReactFlow workflow structure
   */
  public validateReactFlowWorkflow(workflow: ReactFlowWorkflow): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!workflow.name) {
      errors.push('Workflow name is required');
    }

    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      errors.push('Workflow must have a nodes array');
    }

    if (!workflow.edges || !Array.isArray(workflow.edges)) {
      errors.push('Workflow must have an edges array');
    }

    // Validate edges reference valid nodes
    const nodeIds = new Set(workflow.nodes?.map((n) => n.id) || []);
    workflow.edges?.forEach((edge, index) => {
      if (!nodeIds.has(edge.source)) {
        errors.push(`Edge at index ${index} references non-existent source node: ${edge.source}`);
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(`Edge at index ${index} references non-existent target node: ${edge.target}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const n8nConverter = new N8nWorkflowConverter();
export default n8nConverter;
