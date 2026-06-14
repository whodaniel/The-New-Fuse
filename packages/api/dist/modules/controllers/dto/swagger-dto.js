/**
 * Swagger-compatible class versions of our types
 * These are needed because Swagger can't use interfaces/types directly as decorators,
 * they must be classes.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ApiProperty } from '@nestjs/swagger';
import { WorkflowStatus } from '@the-new-fuse/types';
/**
 * Swagger documentation class for Workflow (WorkflowDefinition)
 */
export class WorkflowDto {
}
__decorate([
    ApiProperty({ description: 'Unique identifier' }),
    __metadata("design:type", String)
], WorkflowDto.prototype, "id", void 0);
__decorate([
    ApiProperty({ description: 'Workflow name' }),
    __metadata("design:type", String)
], WorkflowDto.prototype, "name", void 0);
__decorate([
    ApiProperty({ description: 'Workflow description', required: false }),
    __metadata("design:type", String)
], WorkflowDto.prototype, "description", void 0);
__decorate([
    ApiProperty({ description: 'Workflow version' }),
    __metadata("design:type", String)
], WorkflowDto.prototype, "version", void 0);
__decorate([
    ApiProperty({
        description: 'Trigger type',
        enum: ['manual', 'event', 'schedule'],
        example: 'manual'
    }),
    __metadata("design:type", String)
], WorkflowDto.prototype, "triggerType", void 0);
__decorate([
    ApiProperty({ description: 'Trigger configuration', required: false }),
    __metadata("design:type", Object)
], WorkflowDto.prototype, "triggerConfig", void 0);
__decorate([
    ApiProperty({ description: 'Workflow steps', type: 'array', items: { type: 'object' } }),
    __metadata("design:type", Array)
], WorkflowDto.prototype, "steps", void 0);
__decorate([
    ApiProperty({ description: 'Initial context', required: false }),
    __metadata("design:type", Object)
], WorkflowDto.prototype, "initialContext", void 0);
__decorate([
    ApiProperty({ description: 'Tags', required: false, type: 'array', items: { type: 'string' } }),
    __metadata("design:type", Array)
], WorkflowDto.prototype, "tags", void 0);
__decorate([
    ApiProperty({ description: 'Creation timestamp' }),
    __metadata("design:type", Date)
], WorkflowDto.prototype, "createdAt", void 0);
__decorate([
    ApiProperty({ description: 'Last update timestamp' }),
    __metadata("design:type", Date)
], WorkflowDto.prototype, "updatedAt", void 0);
__decorate([
    ApiProperty({ description: 'Deletion timestamp', required: false }),
    __metadata("design:type", Date)
], WorkflowDto.prototype, "deletedAt", void 0);
/**
 * Swagger documentation class for WorkflowExecution (WorkflowInstance)
 */
export class WorkflowExecutionDto {
}
__decorate([
    ApiProperty({ description: 'Unique identifier' }),
    __metadata("design:type", String)
], WorkflowExecutionDto.prototype, "id", void 0);
__decorate([
    ApiProperty({ description: 'Workflow definition identifier' }),
    __metadata("design:type", String)
], WorkflowExecutionDto.prototype, "definitionId", void 0);
__decorate([
    ApiProperty({ description: 'Workflow definition version' }),
    __metadata("design:type", String)
], WorkflowExecutionDto.prototype, "definitionVersion", void 0);
__decorate([
    ApiProperty({
        description: 'Execution status',
        enum: ['pending', 'running', 'completed', 'failed', 'paused', 'cancelled'],
        example: 'running'
    }),
    __metadata("design:type", String)
], WorkflowExecutionDto.prototype, "status", void 0);
__decorate([
    ApiProperty({ description: 'Current step ID', required: false }),
    __metadata("design:type", String)
], WorkflowExecutionDto.prototype, "currentStepId", void 0);
__decorate([
    ApiProperty({ description: 'Runtime context data' }),
    __metadata("design:type", Object)
], WorkflowExecutionDto.prototype, "context", void 0);
__decorate([
    ApiProperty({ description: 'Start timestamp', required: false }),
    __metadata("design:type", Date)
], WorkflowExecutionDto.prototype, "startedAt", void 0);
__decorate([
    ApiProperty({ description: 'Completion timestamp', required: false }),
    __metadata("design:type", Date)
], WorkflowExecutionDto.prototype, "completedAt", void 0);
__decorate([
    ApiProperty({ description: 'Error message if failed', required: false }),
    __metadata("design:type", String)
], WorkflowExecutionDto.prototype, "error", void 0);
__decorate([
    ApiProperty({ description: 'Step execution history', type: 'array', items: { type: 'object' }, required: false }),
    __metadata("design:type", Array)
], WorkflowExecutionDto.prototype, "stepHistory", void 0);
__decorate([
    ApiProperty({ description: 'Creation timestamp' }),
    __metadata("design:type", Date)
], WorkflowExecutionDto.prototype, "createdAt", void 0);
__decorate([
    ApiProperty({ description: 'Last update timestamp' }),
    __metadata("design:type", Date)
], WorkflowExecutionDto.prototype, "updatedAt", void 0);
__decorate([
    ApiProperty({ description: 'Deletion timestamp', required: false }),
    __metadata("design:type", Date)
], WorkflowExecutionDto.prototype, "deletedAt", void 0);
/**
 * Swagger documentation class for Agent
 */
export class AgentDto {
}
__decorate([
    ApiProperty({ description: 'Unique identifier' }),
    __metadata("design:type", String)
], AgentDto.prototype, "id", void 0);
__decorate([
    ApiProperty({ description: 'Agent name' }),
    __metadata("design:type", String)
], AgentDto.prototype, "name", void 0);
__decorate([
    ApiProperty({ description: 'Agent type', example: 'assistant' }),
    __metadata("design:type", String)
], AgentDto.prototype, "type", void 0);
__decorate([
    ApiProperty({ description: 'Agent capabilities', type: 'array', items: { type: 'string' } }),
    __metadata("design:type", Array)
], AgentDto.prototype, "capabilities", void 0);
__decorate([
    ApiProperty({ description: 'Agent metadata', required: false }),
    __metadata("design:type", Object)
], AgentDto.prototype, "metadata", void 0);
__decorate([
    ApiProperty({
        description: 'Agent status',
        enum: ['active', 'inactive', 'busy', 'error'],
        example: 'active'
    }),
    __metadata("design:type", String)
], AgentDto.prototype, "status", void 0);
__decorate([
    ApiProperty({ description: 'Creation timestamp' }),
    __metadata("design:type", Date)
], AgentDto.prototype, "createdAt", void 0);
__decorate([
    ApiProperty({ description: 'Last update timestamp' }),
    __metadata("design:type", Date)
], AgentDto.prototype, "updatedAt", void 0);
__decorate([
    ApiProperty({ description: 'Deletion timestamp', required: false }),
    __metadata("design:type", Date)
], AgentDto.prototype, "deletedAt", void 0);
//# sourceMappingURL=swagger-dto.js.map