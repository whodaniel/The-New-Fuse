var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
class AgentPermissionDto {
    agentId = '';
    agentName = '';
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], AgentPermissionDto.prototype, "agentId", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], AgentPermissionDto.prototype, "agentName", void 0);
export class UserPermissionsDto {
    userId = '';
    allowedAgents = [];
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], UserPermissionsDto.prototype, "userId", void 0);
__decorate([
    IsArray(),
    ValidateNested({ each: true }),
    Type(() => AgentPermissionDto),
    __metadata("design:type", Array)
], UserPermissionsDto.prototype, "allowedAgents", void 0);
export class UpdateUserPermissionsDto {
    agentIds = [];
}
__decorate([
    IsArray(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], UpdateUserPermissionsDto.prototype, "agentIds", void 0);
//# sourceMappingURL=permission.dto.js.map