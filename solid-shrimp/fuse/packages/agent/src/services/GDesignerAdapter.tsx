import { BaseService } from '../core/BaseService';
import { Logger } from '../types/core';
import { WorkflowDefinition, WorkflowStep, Task } from '@the-new-fuse/types';
import { v4 as uuidv4 } from 'uuid';

interface GDesignerWorkflow {
  id: string;
  name: string;
  nodes: Array<{ id: string; type: string; data: any; position: { x: number; y: number } }>;
  edges: Array<{ id: string; source: string; target: string; type?: string }>;
}

interface GDesignerNodeMapping {
  [gdesignerNodeType: string]: (node: GDesignerWorkflow['nodes'][0], stepOrder: number) => Partial<WorkflowStep | Task>;
}

export class GDesignerAdapter extends BaseService {
  private logger: Logger;
  private nodeMapping: GDesignerNodeMapping;

  constructor() {
    super({ name: 'GDesignerAdapter' });
    this.logger = new Logger('GDesignerAdapter');
    this.nodeMapping = {
      'startNode': this.mapStartNode,
      'taskNode': this.mapTaskNode,
      'decisionNode': this.mapDecisionNode,
      'endNode': this.mapEndNode,
    };
    this.logger.info('GDesignerAdapter initialized.');
  }

  adaptWorkflow(gdesignerWorkflow: GDesignerWorkflow): Partial<WorkflowDefinition> {
    this.logger.info(`Adapting workflow: ${gdesignerWorkflow.name} (${gdesignerWorkflow.id})`);

    const steps: WorkflowStep[] = [];
    let stepOrder = 0;

    for (const node of gdesignerWorkflow.nodes) {
      const mapFunction = this.nodeMapping[node.type];
      if (mapFunction) {
        try {
          const partialStep = mapFunction.call(this, node, stepOrder++);
          const step: WorkflowStep = {
            id: uuidv4(),
            name: node.data?.label || `${node.type}-${node.id}`,
            order: stepOrder - 1,
            type: node.type,
            config: node.data || {},
            ...partialStep,
          };
          steps.push(step);
        } catch (error) {
          this.logger.error(`Error mapping node ${node.id} (type: ${node.type}): ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        this.logger.warn(`No mapping function found for GDesigner node type: ${node.type}`);
      }
    }

    this.processEdges(steps, gdesignerWorkflow.edges, gdesignerWorkflow.nodes);

    const definition: Partial<WorkflowDefinition> = {
      name: gdesignerWorkflow.name,
      description: `Adapted from GDesigner workflow ${gdesignerWorkflow.id}`,
      steps: steps,
    };

    this.logger.info(`Successfully adapted workflow "${gdesignerWorkflow.name}". Found ${steps.length} steps.`);
    return definition;
  }

  private processEdges(steps: WorkflowStep[], edges: GDesignerWorkflow['edges'], nodes: GDesignerWorkflow['nodes']): void {
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

  private mapStartNode(node: GDesignerWorkflow['nodes'][0], stepOrder: number): Partial<WorkflowStep> {
    this.logger.debug(`Mapping start node: ${JSON.stringify(node.data)}`);
    return {
      name: node.data?.label || 'Start',
      type: 'workflow-start',
      order: stepOrder,
      config: { trigger: node.data?.trigger || 'manual' },
    };
  }

  private mapTaskNode(node: GDesignerWorkflow['nodes'][0], stepOrder: number): Partial<WorkflowStep> {
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

  private mapDecisionNode(node: GDesignerWorkflow['nodes'][0], stepOrder: number): Partial<WorkflowStep> {
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

  private mapEndNode(node: GDesignerWorkflow['nodes'][0], stepOrder: number): Partial<WorkflowStep> {
    this.logger.debug(`Mapping end node: ${JSON.stringify(node.data)}`);
    return {
      name: node.data?.label || 'End',
      type: 'workflow-end',
      order: stepOrder,
      config: { outcome: node.data?.outcome || 'success' },
    };
  }
}
