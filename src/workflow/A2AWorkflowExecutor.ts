import { WorkflowExecutor, ExecutionContext } from './types.js';
import { A2AMessage } from '../protocols/types.js';
import { SecurityManager } from '../protocols/SecurityManager.js';

export class A2AWorkflowExecutor implements WorkflowExecutor {
    private securityManager: SecurityManager;

    constructor() {
        this.securityManager = new SecurityManager();
    }

    async executeNode(nodeId: string, context: ExecutionContext) {
        const node = context.getNode(nodeId);
        const inputs = await this.collectInputs(node, context);
        
        if (node.type === 'A2A_AGENT') {
            const message: A2AMessage = await this.securityManager.encryptMessage({
                type: 'WORKFLOW_STEP',
                payload: inputs,
                metadata: {
                    workflowId: context.workflowId,
                    nodeId,
                    timestamp: Date.now()
                }
            });
            
            return await node.process(message);
        }
        
        return await node.process(inputs);
    }

    private async collectInputs(node: any, context: ExecutionContext) {
        const inputs: Record<string, any> = {};
        for (const port of node.getInputPorts()) {
            inputs[port] = await context.getInputValue(node.id, port);
        }
        return inputs;
    }
}