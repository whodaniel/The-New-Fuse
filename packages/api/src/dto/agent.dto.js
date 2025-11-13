var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsEnum, IsArray, IsObject, IsDateString } from 'class-validator';
import { AgentStatus } from '@the-new-fuse/database/generated/prisma';
export class CreateAgentDto {
    name;
    description;
    type;
    status;
    capabilities;
    provider;
    lastActive;
    metadata;
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
    IsString(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsEnum(AgentStatus),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], CreateAgentDto.prototype, "capabilities", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "provider", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "lastActive", void 0);
__decorate([
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], CreateAgentDto.prototype, "metadata", void 0);
export class UpdateAgentDto {
    name;
    description;
    type;
    status;
    capabilities;
    provider;
    lastActive;
    metadata;
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
    IsString(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsEnum(AgentStatus),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], UpdateAgentDto.prototype, "capabilities", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "provider", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "lastActive", void 0);
__decorate([
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], UpdateAgentDto.prototype, "metadata", void 0);
export class AgentResponseDto {
    id;
    name;
    description;
    type;
    status;
    capabilities;
    provider;
    lastActive;
    metadata;
    createdAt;
    updatedAt;
}
//# sourceMappingURL=agent.dto.js.map