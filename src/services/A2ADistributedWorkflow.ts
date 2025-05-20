import { Injectable } from '@nestjs/common';
import { A2ACoordinator } from './A2ACoordinator.js';
import { A2ATracer } from './A2ATracer.js';
import { A2ALogger } from './A2ALogger.js';

@Injectable()
export class A2ADistributedWorkflow {
    constructor(
        private coordinator: A2ACoordinator,
        private tracer: A2ATracer,
        private logger: A2ALogger
    ) {}

    async executeDistributedWorkflow(workflow: any) {
        return await this.tracer.traceOperation('execute_workflow', 
            { workflowId: workflow.id },
            async () => {
                const executionPlan = this.createExecutionPlan(workflow);
                return await this.executeSteps(executionPlan);
            }
        );
    }

    private createExecutionPlan(workflow: any) {
        const nodes = workflow.nodes || [];
        return this.topologicalSort(nodes).map(node => ({
            nodeId: node.id,
            dependencies: node.inputs?.map(i => i.sourceNode) || [],
            status: 'pending'
        }));
    }

    private async executeSteps(plan: any[]) {
        const results = new Map();
        const inProgress = new Set();

        while (plan.some(step => step.status === 'pending')) {
            const readySteps = plan.filter(step => 
                step.status === 'pending' &&
                step.dependencies.every(dep => results.has(dep))
            );

            await Promise.all(readySteps.map(async step => {
                inProgress.add(step.nodeId);
                try {
                    const agentId = await this.coordinator.routeTask({
                        nodeId: step.nodeId,
                        inputs: this.collectInputs(step, results)
                    });
                    
                    this.logger.logProtocolMessage({
                        type: 'STEP_STARTED',
                        nodeId: step.nodeId,
                        agentId
                    }, { workflow: true });

                    results.set(step.nodeId, {
                        status: 'completed',
                        agentId
                    });
                } catch (error) {
                    results.set(step.nodeId, {
                        status: 'failed',
                        error: error.message
                    });
                } finally {
                    inProgress.delete(step.nodeId);
                }
            }));
        }

        return Object.fromEntries(results);
    }

    private topologicalSort(nodes: any[]): any[] {
        // Implementation of topological sort for workflow nodes
        return nodes;
    }

    private collectInputs(step: any, results: Map<string, any>): any {
        return step.dependencies.reduce((acc, dep) => {
            acc[dep] = results.get(dep);
            return acc;
        }, {});
    }
}