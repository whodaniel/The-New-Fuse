var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
import { IsString, IsOptional, IsArray, IsObject, IsEnum } from 'class-validator';
import { AgentType, AgentStatus } from '@the-new-fuse/types';
export class CreateAgentDto {
    name;
    description;
    type;
    capabilities;
    config;
    systemPrompt;
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "description", void 0);
__decorate([
    IsEnum(AgentType),
    __metadata("design:type", typeof (_a = typeof AgentType !== "undefined" && AgentType) === "function" ? _a : Object)
], CreateAgentDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    __metadata("design:type", Array)
], CreateAgentDto.prototype, "capabilities", void 0);
__decorate([
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], CreateAgentDto.prototype, "config", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "systemPrompt", void 0);
export class UpdateAgentDto {
    name;
    description;
    capabilities;
    config;
    systemPrompt;
    status;
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    __metadata("design:type", Array)
], UpdateAgentDto.prototype, "capabilities", void 0);
__decorate([
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], UpdateAgentDto.prototype, "config", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "systemPrompt", void 0);
__decorate([
    IsOptional(),
    IsEnum(AgentStatus),
    __metadata("design:type", typeof (_b = typeof AgentStatus !== "undefined" && AgentStatus) === "function" ? _b : Object)
], UpdateAgentDto.prototype, "status", void 0);
export class AgentResponseDto {
    id;
    name;
    description;
    type;
    status;
    capabilities;
    config;
    systemPrompt;
    userId;
    createdAt;
    updatedAt;
}
//# sourceMappingURL=agent.dto.js.map