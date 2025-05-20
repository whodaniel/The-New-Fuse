import { Injectable } from '@nestjs/common';
import { NodeRegistry } from './NodeRegistry.js';
import { A2ANode } from '../nodes/A2ANode.js';
import { A2ANodeComponent } from '../../components/workflow/A2ANodeComponent.js';
import { ConfigurationManager } from '../../config/A2AConfig.js';

@Injectable()
export class A2ANodeRegistry implements NodeRegistry {
    constructor(private config: ConfigurationManager) {}

    registerNodes(): void {
        return {
            nodeTypes: {
                a2aAgent: A2ANode
            },
            componentTypes: {
                a2aAgent: A2ANodeComponent
            },
            defaults: {
                a2aAgent: {
                    type: 'A2A_AGENT',
                    category: 'Agents',
                    protocol: this.config.getConfig().protocolVersion
                }
            }
        };
    }

    getNodeValidators() {
        return {
            a2aAgent: (config: any) => {
                if (!config.agentType) {
                    throw new Error('Agent type must be specified');
                }
                return true;
            }
        };
    }
}