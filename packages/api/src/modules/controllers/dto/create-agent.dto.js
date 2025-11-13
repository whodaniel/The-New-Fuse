var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';
import { AgentType } from '@the-new-fuse/types';
export class CreateAgentDto {
    name = '';
    type = AgentType.ASSISTANT;
    capabilities = [];
    metadata;
    ownerId;
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "name", void 0);
__decorate([
    IsEnum(AgentType),
    IsNotEmpty(),
    __metadata("design:type", typeof (_a = typeof AgentType !== "undefined" && AgentType) === "function" ? _a : Object)
], CreateAgentDto.prototype, "type", void 0);
__decorate([
    IsArray(),
    IsOptional(),
    __metadata("design:type", Array)
], CreateAgentDto.prototype, "capabilities", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateAgentDto.prototype, "metadata", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "ownerId", void 0);
//# sourceMappingURL=create-agent.dto.js.map