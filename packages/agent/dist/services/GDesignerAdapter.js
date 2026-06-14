"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GDesignerAdapter = void 0;
const BaseService_1 = require("../core/BaseService");
const core_1 = require("../types/core");
const uuid_1 = require("uuid");
class GDesignerAdapter extends BaseService_1.BaseService {
    constructor() {
        super({ name: 'GDesignerAdapter' });
        this.logger = new core_1.Logger('GDesignerAdapter');
        this.nodeMapping = {
            'startNode': this.mapStartNode,
            'taskNode': this.mapTaskNode,
            'decisionNode': this.mapDecisionNode,
            'endNode': this.mapEndNode,
        };
        this.logger.info('GDesignerAdapter initialized.');
    }
    adaptWorkflow(gdesignerWorkflow) {
        this.logger.info(`Adapting workflow: ${gdesignerWorkflow.name} (${gdesignerWorkflow.id})`);
        const steps = [];
        let stepOrder = 0;
        for (const node of gdesignerWorkflow.nodes) {
            const mapFunction = this.nodeMapping[node.type];
            if (mapFunction) {
                try {
                    const partialStep = mapFunction.call(this, node, stepOrder++);
                    const step = {
                        id: (0, uuid_1.v4)(),
                        name: node.data?.label || `${node.type}-${node.id}`,
                        order: stepOrder - 1,
                        type: node.type,
                        config: node.data || {},
                        ...partialStep,
                    };
                    steps.push(step);
                }
                catch (error) {
                    this.logger.error(`Error mapping node ${node.id} (type: ${node.type}): ${error instanceof Error ? error.message : String(error)}`);
                }
            }
            else {
                this.logger.warn(`No mapping function found for GDesigner node type: ${node.type}`);
            }
        }
        this.processEdges(steps, gdesignerWorkflow.edges, gdesignerWorkflow.nodes);
        const definition = {
            name: gdesignerWorkflow.name,
            description: `Adapted from GDesigner workflow ${gdesignerWorkflow.id}`,
            steps: steps,
        };
        this.logger.info(`Successfully adapted workflow "${gdesignerWorkflow.name}". Found ${steps.length} steps.`);
        return definition;
    }
    processEdges(steps, edges, nodes) {
        const nodeToStepMap = new Map(nodes.map((node, i) => [node.id, steps[i]]));
        for (const edge of edges) {
            const sourceStep = nodeToStepMap.get(edge.source);
            const targetStep = nodeToStepMap.get(edge.target);
            if (sourceStep && targetStep) {
                if (!targetStep.dependsOn) {
                    targetStep.dependsOn = [];
                }
                targetStep.dependsOn.push(sourceStep.id);
            }
        }
    }
    mapStartNode(node, stepOrder) {
        this.logger.debug(`Mapping start node: ${JSON.stringify(node.data)}`);
        return {
            name: node.data?.label || 'Start',
            type: 'workflow-start',
            order: stepOrder,
            config: { trigger: node.data?.trigger || 'manual' },
        };
    }
    mapTaskNode(node, stepOrder) {
        this.logger.debug(`Mapping task node: ${JSON.stringify(node.data)}`);
        return {
            name: node.data?.label || 'Task Step',
            type: 'task-execution',
            order: stepOrder,
            config: {
                taskType: node.data?.taskType || 'generic',
                taskParams: node.data?.params || {},
            },
        };
    }
    mapDecisionNode(node, stepOrder) {
        this.logger.debug(`Mapping decision node: ${JSON.stringify(node.data)}`);
        return {
            name: node.data?.label || 'Decision',
            type: 'decision',
            order: stepOrder,
            config: {
                condition: node.data?.condition || 'true',
            },
        };
    }
    mapEndNode(node, stepOrder) {
        this.logger.debug(`Mapping end node: ${JSON.stringify(node.data)}`);
        return {
            name: node.data?.label || 'End',
            type: 'workflow-end',
            order: stepOrder,
            config: { outcome: node.data?.outcome || 'success' },
        };
    }
}
exports.GDesignerAdapter = GDesignerAdapter;
//# sourceMappingURL=GDesignerAdapter.js.map