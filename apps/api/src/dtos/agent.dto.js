var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e;
import { IsString, IsEnum, IsOptional, IsObject, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AgentType, AgentStatus, AgentCapability } from '@the-new-fuse/types';
// Re-export types for use in entities
export { AgentType, AgentStatus, AgentCapability };
export class CreateAgentDto {
    name = '';
    type = AgentType.BASIC;
    capabilities;
    config;
    description;
    metadata;
}
__decorate([
    ApiProperty(),
    IsString(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "name", void 0);
__decorate([
    ApiProperty({ enum: AgentType }),
    IsEnum(AgentType),
    __metadata("design:type", typeof (_a = typeof AgentType !== "undefined" && AgentType) === "function" ? _a : Object)
], CreateAgentDto.prototype, "type", void 0);
__decorate([
    ApiProperty({ required: false }),
    IsArray(),
    IsOptional(),
    __metadata("design:type", Array)
], CreateAgentDto.prototype, "capabilities", void 0);
__decorate([
    ApiProperty({ required: false }),
    IsObject(),
    IsOptional(),
    __metadata("design:type", Object)
], CreateAgentDto.prototype, "config", void 0);
__decorate([
    ApiProperty({ required: false }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "description", void 0);
__decorate([
    ApiProperty({ required: false }),
    IsObject(),
    IsOptional(),
    __metadata("design:type", Object)
], CreateAgentDto.prototype, "metadata", void 0);
export class UpdateAgentDto {
    name;
    type;
    capabilities;
    config;
    description;
    status;
}
__decorate([
    ApiProperty({ required: false }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "name", void 0);
__decorate([
    ApiProperty({ required: false, enum: AgentType }),
    IsEnum(AgentType),
    IsOptional(),
    __metadata("design:type", typeof (_b = typeof AgentType !== "undefined" && AgentType) === "function" ? _b : Object)
], UpdateAgentDto.prototype, "type", void 0);
__decorate([
    ApiProperty({ required: false }),
    IsArray(),
    IsOptional(),
    __metadata("design:type", Array)
], UpdateAgentDto.prototype, "capabilities", void 0);
__decorate([
    ApiProperty({ required: false }),
    IsObject(),
    IsOptional(),
    __metadata("design:type", Object)
], UpdateAgentDto.prototype, "config", void 0);
__decorate([
    ApiProperty({ required: false }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "description", void 0);
__decorate([
    ApiProperty({ required: false, enum: AgentStatus }),
    IsEnum(AgentStatus),
    IsOptional(),
    __metadata("design:type", typeof (_c = typeof AgentStatus !== "undefined" && AgentStatus) === "function" ? _c : Object)
], UpdateAgentDto.prototype, "status", void 0);
export class AgentResponseDto {
    id = '';
    name = '';
    type = AgentType.BASIC;
    status = AgentStatus.IDLE;
    capabilities = [];
    description;
    createdAt = new Date();
    updatedAt = new Date();
}
__decorate([
    ApiProperty(),
    __metadata("design:type", String)
], AgentResponseDto.prototype, "id", void 0);
__decorate([
    ApiProperty(),
    __metadata("design:type", String)
], AgentResponseDto.prototype, "name", void 0);
__decorate([
    ApiProperty({ enum: AgentType }),
    __metadata("design:type", typeof (_d = typeof AgentType !== "undefined" && AgentType) === "function" ? _d : Object)
], AgentResponseDto.prototype, "type", void 0);
__decorate([
    ApiProperty({ enum: AgentStatus }),
    __metadata("design:type", typeof (_e = typeof AgentStatus !== "undefined" && AgentStatus) === "function" ? _e : Object)
], AgentResponseDto.prototype, "status", void 0);
__decorate([
    ApiProperty({ type: [String] }),
    __metadata("design:type", Array)
], AgentResponseDto.prototype, "capabilities", void 0);
__decorate([
    ApiProperty({ required: false }),
    __metadata("design:type", String)
], AgentResponseDto.prototype, "description", void 0);
__decorate([
    ApiProperty(),
    __metadata("design:type", Date)
], AgentResponseDto.prototype, "createdAt", void 0);
__decorate([
    ApiProperty(),
    __metadata("design:type", Date)
], AgentResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=agent.dto.js.map