import { Injectable } from '@nestjs/common';
import { WorkflowEngine } from '../workflow/WorkflowEngine.js';
import { A2ANode } from '../workflow/nodes/A2ANode.js';
import { ConfigurationManager } from '../config/A2AConfig.js';

@Injectable()
export class A2AWorkflowService {
    constructor(
        private workflowEngine: WorkflowEngine,
        private config: ConfigurationManager
    ) {}

    async registerA2ANode(nodeConfig: any) {
        const node = new A2ANode(nodeConfig);
        await this.workflowEngine.registerNode(node);
        return node.getConfiguration();
    }

    async executeA2AWorkflow(workflowId: string, input: any) {
        return await this.workflowEngine.execute(workflowId, {
            input,
            protocol: 'A2A',
            version: this.config.getConfig().protocolVersion
        });
    }

    getA2ANodeTypes() {
        return [
            {
                type: 'A2A_AGENT',
                category: 'Agents',
                inputs: ['input', 'context', 'configuration'],
                outputs: ['result', 'error', 'status'],
                configurable: true
            }
        ];
    }
}