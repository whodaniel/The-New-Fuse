var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
export class WorkflowStepDto {
    id = '';
    type = '';
    config = {};
    nextSteps = [];
}
__decorate([
    ApiProperty(),
    IsString(),
    __metadata("design:type", String)
], WorkflowStepDto.prototype, "id", void 0);
__decorate([
    ApiProperty(),
    IsString(),
    __metadata("design:type", String)
], WorkflowStepDto.prototype, "type", void 0);
__decorate([
    ApiProperty(),
    IsObject(),
    __metadata("design:type", Object)
], WorkflowStepDto.prototype, "config", void 0);
__decorate([
    ApiProperty({ type: [String] }),
    IsArray(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], WorkflowStepDto.prototype, "nextSteps", void 0);
export class CreateWorkflowDto {
    name = '';
    description;
    steps = [];
    metadata;
}
__decorate([
    ApiProperty(),
    IsString(),
    __metadata("design:type", String)
], CreateWorkflowDto.prototype, "name", void 0);
__decorate([
    ApiProperty({ required: false }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateWorkflowDto.prototype, "description", void 0);
__decorate([
    ApiProperty({ type: [WorkflowStepDto] }),
    IsArray(),
    ValidateNested({ each: true }),
    Type(() => WorkflowStepDto),
    __metadata("design:type", Array)
], CreateWorkflowDto.prototype, "steps", void 0);
__decorate([
    ApiProperty({ required: false }),
    IsObject(),
    IsOptional(),
    __metadata("design:type", Object)
], CreateWorkflowDto.prototype, "metadata", void 0);
export class UpdateWorkflowDto {
    name;
    description;
    steps;
    metadata;
}
__decorate([
    ApiProperty({ required: false }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateWorkflowDto.prototype, "name", void 0);
__decorate([
    ApiProperty({ required: false }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateWorkflowDto.prototype, "description", void 0);
__decorate([
    ApiProperty({ type: [WorkflowStepDto], required: false }),
    IsArray(),
    ValidateNested({ each: true }),
    Type(() => WorkflowStepDto),
    IsOptional(),
    __metadata("design:type", Array)
], UpdateWorkflowDto.prototype, "steps", void 0);
__decorate([
    ApiProperty({ required: false }),
    IsObject(),
    IsOptional(),
    __metadata("design:type", Object)
], UpdateWorkflowDto.prototype, "metadata", void 0);
export class WorkflowResponseDto {
    id = '';
    name = '';
    description;
    steps = [];
    metadata;
    createdAt = new Date();
    updatedAt = new Date();
}
__decorate([
    ApiProperty(),
    __metadata("design:type", String)
], WorkflowResponseDto.prototype, "id", void 0);
__decorate([
    ApiProperty(),
    __metadata("design:type", String)
], WorkflowResponseDto.prototype, "name", void 0);
__decorate([
    ApiProperty({ required: false }),
    __metadata("design:type", String)
], WorkflowResponseDto.prototype, "description", void 0);
__decorate([
    ApiProperty({ type: [WorkflowStepDto] }),
    __metadata("design:type", Array)
], WorkflowResponseDto.prototype, "steps", void 0);
__decorate([
    ApiProperty({ required: false }),
    __metadata("design:type", Object)
], WorkflowResponseDto.prototype, "metadata", void 0);
__decorate([
    ApiProperty(),
    __metadata("design:type", Date)
], WorkflowResponseDto.prototype, "createdAt", void 0);
__decorate([
    ApiProperty(),
    __metadata("design:type", Date)
], WorkflowResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=workflow.dto.js.map