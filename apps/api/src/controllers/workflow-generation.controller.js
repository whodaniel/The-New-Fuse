var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
// This is a simplified DTO representing the expected output from the Planner Agent
class PlannerOutputDto {
    steps;
}
// This represents the structure ReactFlow expects
class WorkflowDto {
    nodes;
    edges;
}
let WorkflowGenerationController = class WorkflowGenerationController {
    generateWorkflowFromPlan(plannerOutput) {
        const nodes = [];
        const edges = [];
        const initialX = 100;
        const initialY = 100;
        const nodeSpacingY = 200; // Vertical spacing between nodes
        // Create an Input node
        const inputNode = {
            id: 'input-node',
            type: 'input',
            position: { x: initialX, y: initialY },
            data: { label: 'Start' },
        };
        nodes.push(inputNode);
        let previousNodeId = inputNode.id;
        // Create nodes and edges from the planner steps
        plannerOutput.steps.forEach((step, index) => {
            const nodeId = `agent-node-${step.step}`;
            const nodeY = initialY + (index + 1) * nodeSpacingY;
            const agentNode = {
                id: nodeId,
                type: 'agent', // Using the 'agent' type from your nodeTypes.ts
                position: { x: initialX, y: nodeY },
                data: {
                    label: `Step ${step.step}: ${step.task}`,
                    config: {
                        agentId: step.agentId,
                    },
                    name: step.task, // Display task name on the node
                },
            };
            nodes.push(agentNode);
            // Create an edge from the previous node to this one
            const edge = {
                id: `edge-${previousNodeId}-to-${nodeId}`,
                source: previousNodeId,
                target: nodeId,
                animated: true,
            };
            edges.push(edge);
            previousNodeId = nodeId;
        });
        // Create an Output node
        const outputNode = {
            id: 'output-node',
            type: 'output',
            position: { x: initialX, y: initialY + (plannerOutput.steps.length + 1) * nodeSpacingY },
            data: { label: 'End' },
        };
        nodes.push(outputNode);
        // Create a final edge to the output node
        const finalEdge = {
            id: `edge-${previousNodeId}-to-output-node`,
            source: previousNodeId,
            target: outputNode.id,
        };
        edges.push(finalEdge);
        return { nodes, edges };
    }
};
__decorate([
    Post('generate-from-plan'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Generate a visual workflow from a planner agent output.' }),
    ApiResponse({ status: 200, description: 'Workflow generated successfully.', type: WorkflowDto }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PlannerOutputDto]),
    __metadata("design:returntype", WorkflowDto)
], WorkflowGenerationController.prototype, "generateWorkflowFromPlan", null);
WorkflowGenerationController = __decorate([
    ApiTags('Workflow Generation'),
    Controller('workflow-generation')
], WorkflowGenerationController);
export { WorkflowGenerationController };
//# sourceMappingURL=workflow-generation.controller.js.map