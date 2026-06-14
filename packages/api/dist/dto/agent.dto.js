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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AgentStatus } from '@the-new-fuse/types';
export class CreateAgentDto {
}
__decorate([
    ApiProperty({ description: 'Agent name' }),
    IsString(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "name", void 0);
__decorate([
    ApiPropertyOptional({ description: 'Agent description' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "description", void 0);
__decorate([
    ApiProperty({ description: 'Agent type' }),
    IsString(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "type", void 0);
__decorate([
    ApiPropertyOptional({ enum: AgentStatus, description: 'Agent status' }),
    IsOptional(),
    IsEnum(AgentStatus),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "status", void 0);
__decorate([
    ApiPropertyOptional({ description: 'Agent capabilities', type: [String] }),
    IsOptional(),
    IsArray(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], CreateAgentDto.prototype, "capabilities", void 0);
__decorate([
    ApiProperty({ description: 'Agent provider' }),
    IsString(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "provider", void 0);
__decorate([
    ApiPropertyOptional({ description: 'Last active timestamp' }),
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "lastActive", void 0);
__decorate([
    ApiPropertyOptional({ description: 'Agent metadata' }),
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], CreateAgentDto.prototype, "metadata", void 0);
export class UpdateAgentDto {
}
__decorate([
    ApiPropertyOptional({ description: 'Agent name' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "name", void 0);
__decorate([
    ApiPropertyOptional({ description: 'Agent description' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "description", void 0);
__decorate([
    ApiPropertyOptional({ description: 'Agent type' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "type", void 0);
__decorate([
    ApiPropertyOptional({ enum: AgentStatus, description: 'Agent status' }),
    IsOptional(),
    IsEnum(AgentStatus),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "status", void 0);
__decorate([
    ApiPropertyOptional({ description: 'Agent capabilities', type: [String] }),
    IsOptional(),
    IsArray(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], UpdateAgentDto.prototype, "capabilities", void 0);
__decorate([
    ApiPropertyOptional({ description: 'Agent provider' }),
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "provider", void 0);
__decorate([
    ApiPropertyOptional({ description: 'Last active timestamp' }),
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "lastActive", void 0);
__decorate([
    ApiPropertyOptional({ description: 'Agent metadata' }),
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], UpdateAgentDto.prototype, "metadata", void 0);
export class AgentResponseDto {
}
__decorate([
    ApiProperty({ description: 'Agent ID' }),
    __metadata("design:type", String)
], AgentResponseDto.prototype, "id", void 0);
__decorate([
    ApiProperty({ description: 'Agent name' }),
    __metadata("design:type", String)
], AgentResponseDto.prototype, "name", void 0);
__decorate([
    ApiPropertyOptional({ description: 'Agent description' }),
    __metadata("design:type", String)
], AgentResponseDto.prototype, "description", void 0);
__decorate([
    ApiProperty({ description: 'Agent type' }),
    __metadata("design:type", String)
], AgentResponseDto.prototype, "type", void 0);
__decorate([
    ApiProperty({ enum: AgentStatus, description: 'Agent status' }),
    __metadata("design:type", String)
], AgentResponseDto.prototype, "status", void 0);
__decorate([
    ApiProperty({ description: 'Agent capabilities', type: [String] }),
    __metadata("design:type", Array)
], AgentResponseDto.prototype, "capabilities", void 0);
__decorate([
    ApiProperty({ description: 'Agent provider' }),
    __metadata("design:type", String)
], AgentResponseDto.prototype, "provider", void 0);
__decorate([
    ApiProperty({ description: 'Last active timestamp' }),
    __metadata("design:type", Date)
], AgentResponseDto.prototype, "lastActive", void 0);
__decorate([
    ApiPropertyOptional({ description: 'Agent metadata' }),
    __metadata("design:type", Object)
], AgentResponseDto.prototype, "metadata", void 0);
__decorate([
    ApiProperty({ description: 'Creation timestamp' }),
    __metadata("design:type", Date)
], AgentResponseDto.prototype, "createdAt", void 0);
__decorate([
    ApiProperty({ description: 'Update timestamp' }),
    __metadata("design:type", Date)
], AgentResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=agent.dto.js.map