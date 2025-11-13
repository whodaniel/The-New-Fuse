"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GDesignerAdapter = void 0;
const BaseService_1 = require("../core/BaseService"); // Corrected import path
const common_1 = require("@nestjs/common");
/**
 * Adapts workflows designed in a graphical tool (like GDesigner)
 * to the internal workflow/task representation.
 */
class GDesignerAdapter extends BaseService_1.BaseService {
    logger;
    nodeMapping;
    constructor() {
        super({ name: 'GDesignerAdapter' });
        this.logger = new common_1.Logger('GDesignerAdapter');
        // TODO: Define the mapping from GDesigner node types to internal Step/Task types
        this.nodeMapping = {
            'startNode': this.mapStartNode,
            'taskNode': this.mapTaskNode,
            'decisionNode': this.mapDecisionNode,
            'endNode': this.mapEndNode,
            // Add mappings for all relevant GDesigner node types
        };
        this.logger.log('GDesignerAdapter initialized.');
    }
    /**
     * Converts a GDesigner workflow structure into an internal WorkflowDefinition.
     * @param gdesignerWorkflow The workflow data from GDesigner.
     * @returns A WorkflowDefinition object.
     */
    adaptWorkflow(gdesignerWorkflow) {
        this.logger.log(`Adapting workflow: ${gdesignerWorkflow.name} (${gdesignerWorkflow.id}));

    const steps: WorkflowStep[] = [];
    let stepOrder = 0;

    // Basic topological sort or traversal logic might be needed here
    // This is a simplified example assuming nodes can be processed somewhat linearly
    for (const node of gdesignerWorkflow.nodes) {
      const mapFunction = this.nodeMapping[node.type];
      if (mapFunction) {
        try {
          const partialStep = mapFunction.call(this, node.data, stepOrder++);
          // TODO: Add more robust step creation logic (ID generation, linking dependencies based on edges)
          const step: WorkflowStep = {
            // Default/placeholder values`, id, step - $, { node, : .id } `, // Need proper UUID generation
            name: node.data?.label || `, $, { node, : .type } - $, { node, : .id }, order, stepOrder - 1, type, node.type, // Or a mapped internal type
        config, node.data || {}, ...partialStep); // Overwrite defaults with mapped values
    }
    ;
    steps;
}
exports.GDesignerAdapter = GDesignerAdapter;
try { }
catch (error) {
    `
          this.logger.error(Error mapping node ${node.id}`(type, $, { node, : .type });
    $;
    {
        error instanceof Error ? error.message : String(error);
    }
    ;
    // Decide how to handle mapping errors (skip step, fail adaptation?)`
}
`
      } else {
        this.logger.warn(No mapping function found for GDesigner node type: ${node.type});
      }
    }

    // TODO: Process edges to set step dependencies (dependsOn)

    const definition: Partial<WorkflowDefinition> = {
      version: '1.0.0',
      nodes: steps as any, // Convert steps to WorkflowNode[] format
      // initialContext: {}, // Extract from start node?`;
;
`

    this.logger.log(Successfully adapted workflow "${gdesignerWorkflow.name}". Found ${steps.length} steps.);
    return definition;
  }
` 
// --- Example Mapping Functions ---`
`
  private mapStartNode(nodeData: any, stepOrder: number): Partial<WorkflowStep> {
    this.logger.debug(Mapping start node: ${JSON.stringify(nodeData)});
    return {
      name: nodeData?.label || 'Start',
      type: 'workflow-start', // Internal type
      order: stepOrder,
      config: { trigger: nodeData?.trigger || 'manual' },
    };
  }
`;
mapTaskNode(nodeData, any, stepOrder, number);
Partial < WorkflowStep > {} `
    this.logger.debug(Mapping task node: ${JSON.stringify(nodeData)}`;
;
// This might create a WorkflowStep that references a Task, or embed task details
return {
    name: nodeData?.label || 'Task Step',
    type: 'task-execution', // Internal type
    order: stepOrder,
    config: {
        taskType: nodeData?.taskType || 'generic',
        taskParams: nodeData?.params || {},
        // assignedAgent: nodeData?.agent, // Map agent assignment
    },
    // relatedTaskId: 'task-id-to-be-created' // Link to a Task if managed separately
};
mapDecisionNode(nodeData, any, stepOrder, number);
Partial < WorkflowStep > {
    this: .logger.debug(Mapping, decision, node, $, { JSON, : .stringify(nodeData) }),
    return: {
        name: nodeData?.label || 'Decision',
        type: 'decision', // Internal type
        order: stepOrder,
        config: {
            condition: nodeData?.condition || 'true', // Condition logic
            // Outputs based on condition might be handled by edge processing
        },
    }
};
mapEndNode(nodeData, any, stepOrder, number);
Partial < WorkflowStep > {} `
    this.logger.debug(Mapping end node: ${JSON.stringify(nodeData)}`;
;
return {
    name: nodeData?.label || 'End',
    type: 'workflow-end', // Internal type
    order: stepOrder,
    config: { outcome: nodeData?.outcome || 'success' },
};
//# sourceMappingURL=GDesignerAdapter.js.map