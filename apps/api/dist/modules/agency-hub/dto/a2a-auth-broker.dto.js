"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizeAgentTokenDto = exports.UpsertAuthBrokerPolicyDto = exports.RevokeAllAgentTokensDto = exports.RevokeAgentTokenDto = exports.ApproveAgentTokenRequestDto = exports.RequestAgentTokenDto = void 0;
const class_validator_1 = require("class-validator");
class RequestAgentTokenDto {
}
exports.RequestAgentTokenDto = RequestAgentTokenDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], RequestAgentTokenDto.prototype, "agentId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], RequestAgentTokenDto.prototype, "integration", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], RequestAgentTokenDto.prototype, "accountRef", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(128),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RequestAgentTokenDto.prototype, "requestedScopes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], RequestAgentTokenDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], RequestAgentTokenDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(60),
    (0, class_validator_1.Max)(3600),
    __metadata("design:type", Number)
], RequestAgentTokenDto.prototype, "ttlSeconds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], RequestAgentTokenDto.prototype, "runtimeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RequestAgentTokenDto.prototype, "bindIp", void 0);
class ApproveAgentTokenRequestDto {
}
exports.ApproveAgentTokenRequestDto = ApproveAgentTokenRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], ApproveAgentTokenRequestDto.prototype, "requestId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    (0, class_validator_1.MaxLength)(256),
    __metadata("design:type", String)
], ApproveAgentTokenRequestDto.prototype, "mfaProof", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(128),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ApproveAgentTokenRequestDto.prototype, "approvedScopes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(60),
    (0, class_validator_1.Max)(3600),
    __metadata("design:type", Number)
], ApproveAgentTokenRequestDto.prototype, "approvedTtlSeconds", void 0);
class RevokeAgentTokenDto {
}
exports.RevokeAgentTokenDto = RevokeAgentTokenDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], RevokeAgentTokenDto.prototype, "tokenId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], RevokeAgentTokenDto.prototype, "requestId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], RevokeAgentTokenDto.prototype, "reason", void 0);
class RevokeAllAgentTokensDto {
}
exports.RevokeAllAgentTokensDto = RevokeAllAgentTokensDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], RevokeAllAgentTokensDto.prototype, "agentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], RevokeAllAgentTokensDto.prototype, "integration", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], RevokeAllAgentTokensDto.prototype, "reason", void 0);
class UpsertAuthBrokerPolicyDto {
}
exports.UpsertAuthBrokerPolicyDto = UpsertAuthBrokerPolicyDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(256),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpsertAuthBrokerPolicyDto.prototype, "allowedScopes", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(256),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpsertAuthBrokerPolicyDto.prototype, "allowedActions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(256),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpsertAuthBrokerPolicyDto.prototype, "stepUpActions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(256),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpsertAuthBrokerPolicyDto.prototype, "singleUseActions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(256),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpsertAuthBrokerPolicyDto.prototype, "allowedAccountRefs", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(60),
    (0, class_validator_1.Max)(3600),
    __metadata("design:type", Number)
], UpsertAuthBrokerPolicyDto.prototype, "maxTtlSeconds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(60),
    (0, class_validator_1.Max)(3600),
    __metadata("design:type", Number)
], UpsertAuthBrokerPolicyDto.prototype, "defaultTtlSeconds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpsertAuthBrokerPolicyDto.prototype, "requireRuntimeBinding", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpsertAuthBrokerPolicyDto.prototype, "requireIpBinding", void 0);
class AuthorizeAgentTokenDto {
}
exports.AuthorizeAgentTokenDto = AuthorizeAgentTokenDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], AuthorizeAgentTokenDto.prototype, "agentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], AuthorizeAgentTokenDto.prototype, "integration", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], AuthorizeAgentTokenDto.prototype, "accountRef", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], AuthorizeAgentTokenDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(128),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AuthorizeAgentTokenDto.prototype, "requiredScopes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], AuthorizeAgentTokenDto.prototype, "runtimeId", void 0);
//# sourceMappingURL=a2a-auth-broker.dto.js.map