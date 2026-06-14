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
/**
 * DTO class for Workflow model to be used with Swagger
 */
export class WorkflowDto {
    constructor() {
        this.id = '';
        this.name = '';
        this.description = '';
        this.steps = {};
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}
__decorate([
    ApiProperty({ description: 'Unique identifier for the workflow' }),
    __metadata("design:type", String)
], WorkflowDto.prototype, "id", void 0);
__decorate([
    ApiProperty({ description: 'Name of the workflow' }),
    __metadata("design:type", String)
], WorkflowDto.prototype, "name", void 0);
__decorate([
    ApiProperty({ description: 'Description of the workflow' }),
    __metadata("design:type", String)
], WorkflowDto.prototype, "description", void 0);
__decorate([
    ApiProperty({ description: 'Steps in the workflow represented as JSON' }),
    __metadata("design:type", Object)
], WorkflowDto.prototype, "steps", void 0);
__decorate([
    ApiProperty({ description: 'When the workflow was created' }),
    __metadata("design:type", Date)
], WorkflowDto.prototype, "createdAt", void 0);
__decorate([
    ApiProperty({ description: 'When the workflow was last updated' }),
    __metadata("design:type", Date)
], WorkflowDto.prototype, "updatedAt", void 0);
/**
 * DTO class for WorkflowExecution model to be used with Swagger
 */
export class WorkflowExecutionDto {
    constructor() {
        this.id = '';
        this.workflowId = '';
        this.status = '';
        this.startedAt = new Date();
    }
}
__decorate([
    ApiProperty({ description: 'Unique identifier for the execution' }),
    __metadata("design:type", String)
], WorkflowExecutionDto.prototype, "id", void 0);
__decorate([
    ApiProperty({ description: 'ID of the workflow being executed' }),
    __metadata("design:type", String)
], WorkflowExecutionDto.prototype, "workflowId", void 0);
__decorate([
    ApiProperty({ description: 'Current status of the execution', example: 'RUNNING' }),
    __metadata("design:type", String)
], WorkflowExecutionDto.prototype, "status", void 0);
__decorate([
    ApiProperty({ description: 'Result of the workflow execution', required: false }),
    __metadata("design:type", Object)
], WorkflowExecutionDto.prototype, "result", void 0);
__decorate([
    ApiProperty({ description: 'When the execution started' }),
    __metadata("design:type", Date)
], WorkflowExecutionDto.prototype, "startedAt", void 0);
__decorate([
    ApiProperty({ description: 'When the execution completed', required: false }),
    __metadata("design:type", Date)
], WorkflowExecutionDto.prototype, "completedAt", void 0);
//# sourceMappingURL=workflow.dto.js.map