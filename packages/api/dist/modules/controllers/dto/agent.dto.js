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
import { AgentStatus } from '@the-new-fuse/types';
import { Allow } from 'class-validator';
/**
 * DTO class for Agent model to be used with Swagger
 */
export class AgentDto {
    constructor() {
        this.name = '';
    }
}
__decorate([
    Allow(),
    ApiProperty({ description: 'Unique identifier for the agent' }),
    __metadata("design:type", String)
], AgentDto.prototype, "id", void 0);
__decorate([
    Allow(),
    ApiProperty({ description: 'Name of the agent' }),
    __metadata("design:type", String)
], AgentDto.prototype, "name", void 0);
__decorate([
    Allow(),
    ApiProperty({ description: 'Type of the agent' }),
    __metadata("design:type", String)
], AgentDto.prototype, "type", void 0);
__decorate([
    Allow(),
    ApiProperty({ description: 'Current status of the agent', example: 'IDLE', enum: AgentStatus }),
    __metadata("design:type", String)
], AgentDto.prototype, "status", void 0);
__decorate([
    Allow(),
    ApiProperty({ description: 'ID of the user who owns this agent' }),
    __metadata("design:type", String)
], AgentDto.prototype, "userId", void 0);
__decorate([
    Allow(),
    ApiProperty({ description: 'List of capabilities this agent has', type: [String] }),
    __metadata("design:type", Array)
], AgentDto.prototype, "capabilities", void 0);
__decorate([
    Allow(),
    ApiProperty({ description: 'When the agent was created' }),
    __metadata("design:type", String)
], AgentDto.prototype, "createdAt", void 0);
__decorate([
    Allow(),
    ApiProperty({ description: 'When the agent was last updated' }),
    __metadata("design:type", String)
], AgentDto.prototype, "updatedAt", void 0);
__decorate([
    Allow(),
    ApiProperty({ description: 'Description of the agent' }),
    __metadata("design:type", String)
], AgentDto.prototype, "description", void 0);
__decorate([
    Allow(),
    ApiProperty({ description: 'Provider of the agent' }),
    __metadata("design:type", String)
], AgentDto.prototype, "provider", void 0);
__decorate([
    Allow(),
    ApiProperty({ description: 'Last active timestamp' }),
    __metadata("design:type", Date)
], AgentDto.prototype, "lastActive", void 0);
__decorate([
    Allow(),
    ApiProperty({ description: 'Additional metadata' }),
    __metadata("design:type", Object)
], AgentDto.prototype, "metadata", void 0);
__decorate([
    Allow(),
    ApiProperty({ description: 'System prompt for agent behavior', required: false }),
    __metadata("design:type", String)
], AgentDto.prototype, "systemPrompt", void 0);
__decorate([
    Allow(),
    ApiProperty({ description: 'Primary model identifier', required: false }),
    __metadata("design:type", String)
], AgentDto.prototype, "model", void 0);
__decorate([
    Allow(),
    ApiProperty({ description: 'Agent version', required: false }),
    __metadata("design:type", String)
], AgentDto.prototype, "version", void 0);
__decorate([
    Allow(),
    ApiProperty({
        description: 'Primary configuration payload',
        required: false,
        type: 'object',
        additionalProperties: true,
    }),
    __metadata("design:type", Object)
], AgentDto.prototype, "config", void 0);
__decorate([
    Allow(),
    ApiProperty({
        description: 'Configuration alias from legacy/new UI payloads',
        required: false,
        type: 'object',
        additionalProperties: true,
    }),
    __metadata("design:type", Object)
], AgentDto.prototype, "configuration", void 0);
__decorate([
    Allow(),
    ApiProperty({
        description: 'Public profile metadata',
        required: false,
        type: 'object',
        additionalProperties: true,
    }),
    __metadata("design:type", Object)
], AgentDto.prototype, "profile", void 0);
//# sourceMappingURL=agent.dto.js.map