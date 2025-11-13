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
import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { AgentType } from '@the-new-fuse/types';
export class UpdateAgentDto {
    name;
    type;
    capabilities;
    metadata;
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAgentDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsEnum(AgentType),
    __metadata("design:type", typeof (_a = typeof AgentType !== "undefined" && AgentType) === "function" ? _a : Object)
], UpdateAgentDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    __metadata("design:type", Array)
], UpdateAgentDto.prototype, "capabilities", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], UpdateAgentDto.prototype, "metadata", void 0);
//# sourceMappingURL=update-agent.dto.js.map