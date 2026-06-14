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
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AgentCapability, AgentRole, AgentStatus, AgentTrustLevel } from './core/enums.js';
// Re-export the enums for external use
export { AgentCapability, AgentRole, AgentStatus, AgentTrustLevel };
export var AgentType;
(function (AgentType) {
    AgentType["BASIC"] = "BASIC";
    AgentType["CHAT"] = "CHAT";
    AgentType["WORKFLOW"] = "WORKFLOW";
    AgentType["TASK"] = "TASK";
    AgentType["ASSISTANT"] = "ASSISTANT";
    AgentType["ANALYSIS"] = "ANALYSIS";
    AgentType["CONVERSATIONAL"] = "CONVERSATIONAL";
    AgentType["IDE_EXTENSION"] = "IDE_EXTENSION";
    AgentType["API"] = "API";
    AgentType["GITHUB_JULES"] = "GITHUB_JULES";
    AgentType["DOMAIN_GAMING"] = "DOMAIN_GAMING";
})(AgentType || (AgentType = {}));
// Changed from interface to class that implements BaseEntity
export class Agent {
    constructor(data) {
        this.id = data.id || '';
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
        this.name = data.name || '';
        this.type = data.type || AgentType.ASSISTANT;
        this.status = data.status || AgentStatus.INACTIVE;
        this.trustLevel = data.trustLevel || AgentTrustLevel.EPHEMERAL;
        this.description = data.description;
        this.systemPrompt = data.systemPrompt;
        this.capabilities = data.capabilities;
        this.configuration = data.configuration;
    }
}
// Changed from interface to class
export class CreateAgentDto {
    constructor(data) {
        this.name = data.name || '';
        this.type = data.type || AgentType.ASSISTANT;
        this.description = data.description;
        this.systemPrompt = data.systemPrompt;
        this.capabilities = data.capabilities;
        this.configuration = data.configuration;
        this.metadata = data.metadata;
        this.role = data.role;
        this.provider = data.provider || 'default';
        this.trustLevel = data.trustLevel || AgentTrustLevel.EPHEMERAL;
    }
}
__decorate([
    ApiProperty({ required: true, description: "The agent's name" }),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "name", void 0);
__decorate([
    ApiProperty({ required: true, enum: AgentType, description: "The agent's type" }),
    IsEnum(AgentType),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "type", void 0);
__decorate([
    ApiProperty({ required: false, description: "A description of the agent's purpose" }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "description", void 0);
__decorate([
    ApiProperty({ required: false, description: 'The system-level instructions for the agent' }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "systemPrompt", void 0);
__decorate([
    ApiProperty({
        required: false,
        isArray: true,
        enum: AgentCapability,
        description: "The agent's capabilities",
    }),
    IsArray(),
    IsOptional(),
    __metadata("design:type", Array)
], CreateAgentDto.prototype, "capabilities", void 0);
__decorate([
    ApiProperty({
        required: false,
        type: 'object',
        additionalProperties: true,
        description: 'Agent-specific configuration',
    }),
    IsOptional(),
    __metadata("design:type", Object)
], CreateAgentDto.prototype, "configuration", void 0);
__decorate([
    ApiProperty({
        required: false,
        type: 'object',
        additionalProperties: true,
        description: 'Arbitrary metadata',
    }),
    IsOptional(),
    __metadata("design:type", Object)
], CreateAgentDto.prototype, "metadata", void 0);
__decorate([
    ApiProperty({ required: false, enum: AgentRole, description: 'The role of the agent' }),
    IsEnum(AgentRole),
    IsOptional(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "role", void 0);
__decorate([
    ApiProperty({ required: false, description: 'The provider of the agent' }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "provider", void 0);
__decorate([
    ApiProperty({
        required: false,
        enum: AgentTrustLevel,
        description: 'The trust level of the agent (default: EPHEMERAL)',
        default: AgentTrustLevel.EPHEMERAL,
    }),
    IsEnum(AgentTrustLevel),
    IsOptional(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "trustLevel", void 0);
// Changed from interface to class
export class UpdateAgentDto {
    constructor(data = {}) {
        this.name = data.name;
        this.description = data.description;
        this.systemPrompt = data.systemPrompt;
        this.capabilities = data.capabilities;
        this.configuration = data.configuration;
        this.status = data.status;
        this.metadata = data.metadata;
        this.type = data.type;
        this.role = data.role;
        this.trustLevel = data.trustLevel;
    }
}
__decorate([
    ApiProperty({ required: false, description: "The agent's name" }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "name", void 0);
__decorate([
    ApiProperty({ required: false, description: "A description of the agent's purpose" }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "description", void 0);
__decorate([
    ApiProperty({ required: false, description: 'The system-level instructions for the agent' }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "systemPrompt", void 0);
__decorate([
    ApiProperty({
        required: false,
        isArray: true,
        enum: AgentCapability,
        description: "The agent's capabilities",
    }),
    IsArray(),
    IsOptional(),
    __metadata("design:type", Array)
], UpdateAgentDto.prototype, "capabilities", void 0);
__decorate([
    ApiProperty({
        required: false,
        type: 'object',
        additionalProperties: true,
        description: 'Agent-specific configuration',
    }),
    IsOptional(),
    __metadata("design:type", Object)
], UpdateAgentDto.prototype, "configuration", void 0);
__decorate([
    ApiProperty({ required: false, enum: AgentStatus, description: "The agent's status" }),
    IsEnum(AgentStatus),
    IsOptional(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "status", void 0);
__decorate([
    ApiProperty({
        required: false,
        type: 'object',
        additionalProperties: true,
        description: 'Arbitrary metadata',
    }),
    IsOptional(),
    __metadata("design:type", Object)
], UpdateAgentDto.prototype, "metadata", void 0);
__decorate([
    ApiProperty({ required: false, enum: AgentType, description: "The agent's type" }),
    IsEnum(AgentType),
    IsOptional(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "type", void 0);
__decorate([
    ApiProperty({ required: false, enum: AgentRole, description: 'The role of the agent' }),
    IsEnum(AgentRole),
    IsOptional(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "role", void 0);
__decorate([
    ApiProperty({
        required: false,
        enum: AgentTrustLevel,
        description: 'The trust level of the agent',
    }),
    IsEnum(AgentTrustLevel),
    IsOptional(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "trustLevel", void 0);
export class AgentResponseDto {
    constructor(data) {
        this.id = data.id || '';
        this.name = data.name || '';
        this.type = data.type || AgentType.ASSISTANT;
        this.description = data.description;
        this.status = data.status || AgentStatus.INACTIVE;
        this.trustLevel = data.trustLevel || AgentTrustLevel.EPHEMERAL;
        this.capabilities = data.capabilities;
        this.provider = data.provider;
        this.lastActive = data.lastActive;
        this.metadata = data.metadata;
        this.profile = data.profile;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }
}
/**
 * Agent Profile DTO
 * Used for agent self-identification and discovery
 */
export class AgentProfileDto {
    constructor(data = {}) {
        this.about = data.about;
        this.personality = data.personality;
        this.avatar = data.avatar;
        this.emoji = data.emoji;
        this.tags = data.tags;
        this.creator = data.creator;
        this.version = data.version;
    }
}
__decorate([
    ApiProperty({ required: false, description: "About me - agent's self-description" }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AgentProfileDto.prototype, "about", void 0);
__decorate([
    ApiProperty({ required: false, description: "Agent's personality traits" }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AgentProfileDto.prototype, "personality", void 0);
__decorate([
    ApiProperty({ required: false, description: 'Avatar URL or image path' }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AgentProfileDto.prototype, "avatar", void 0);
__decorate([
    ApiProperty({ required: false, description: 'Signature emoji' }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AgentProfileDto.prototype, "emoji", void 0);
__decorate([
    ApiProperty({ required: false, description: 'Tags for discovery' }),
    IsArray(),
    IsOptional(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], AgentProfileDto.prototype, "tags", void 0);
__decorate([
    ApiProperty({ required: false, description: 'Creator or owner name' }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AgentProfileDto.prototype, "creator", void 0);
__decorate([
    ApiProperty({ required: false, description: 'Agent version' }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], AgentProfileDto.prototype, "version", void 0);
//# sourceMappingURL=agent.js.map