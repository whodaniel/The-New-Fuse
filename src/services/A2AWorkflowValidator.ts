import { Injectable } from '@nestjs/common';
import { WorkflowValidator } from '../workflow/types.js';
import { A2ANode } from '../workflow/nodes/A2ANode.js';
import { AgentCapabilityService } from './AgentCapabilityService.js';

@Injectable()
export class A2AWorkflowValidator implements WorkflowValidator {
    constructor(private capabilityService: AgentCapabilityService) {}

    async validateWorkflow(nodes: A2ANode[]): Promise<ValidationResult> {
        const errors = [];
        const warnings = [];

        for (const node of nodes) {
            const capabilities = await this.capabilityService.discoverCapabilities(node.id);
            
            if (capabilities.error) {
                errors.push(`Node ${node.id}: ${capabilities.error}`);
                continue;
            }

            const configValidation = this.validateNodeConfiguration(node, capabilities);
            errors.push(...configValidation.errors);
            warnings.push(...configValidation.warnings);

            const connectionValidation = await this.validateConnections(node, nodes);
            errors.push(...connectionValidation.errors);
            warnings.push(...connectionValidation.warnings);
        }

        return { errors, warnings, isValid: errors.length === 0 };
    }

    private validateNodeConfiguration(node: A2ANode, capabilities: any) {
        const errors = [];
        const warnings = [];

        if (!capabilities.supported_types.includes(node.config.agentType)) {
            errors.push(`Invalid agent type for node ${node.id}`);
        }

        if (!node.config.securityLevel) {
            warnings.push(`No security level specified for node ${node.id}`);
        }

        return { errors, warnings };
    }

    private async validateConnections(node: A2ANode, allNodes: A2ANode[]) {
        const errors = [];
        const warnings = [];

        const connectedNodes = allNodes.filter(n => 
            n.inputs?.some(i => i.sourceNode === node.id) ||
            node.inputs?.some(i => i.sourceNode === n.id)
        );

        for (const connectedNode of connectedNodes) {
            const compatibility = await this.checkNodeCompatibility(node, connectedNode);
            errors.push(...compatibility.errors);
            warnings.push(...compatibility.warnings);
        }

        return { errors, warnings };
    }

    private async checkNodeCompatibility(nodeA: A2ANode, nodeB: A2ANode) {
        const errors = [];
        const warnings = [];

        const capA = await this.capabilityService.discoverCapabilities(nodeA.id);
        const capB = await this.capabilityService.discoverCapabilities(nodeB.id);

        if (!this.formatsCompatible(capA.output_formats, capB.input_formats)) {
            errors.push(`Incompatible data formats between ${nodeA.id} and ${nodeB.id}`);
        }

        return { errors, warnings };
    }

    private formatsCompatible(outputFormats: string[], inputFormats: string[]): boolean {
        return outputFormats.some(format => inputFormats.includes(format));
    }
}