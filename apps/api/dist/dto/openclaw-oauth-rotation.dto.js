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
exports.ExecuteOpenClawOAuthBindingDto = exports.UpsertOpenClawOAuthBindingDto = exports.OPENCLAW_OAUTH_ACCESS_SCOPES = exports.OPENCLAW_PROVIDERS = void 0;
const class_validator_1 = require("class-validator");
exports.OPENCLAW_PROVIDERS = [
    'openai-codex',
    'anthropic',
    'google-antigravity',
    'kilo',
];
exports.OPENCLAW_OAUTH_ACCESS_SCOPES = ['personal', 'service'];
class UpsertOpenClawOAuthBindingDto {
}
exports.UpsertOpenClawOAuthBindingDto = UpsertOpenClawOAuthBindingDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], UpsertOpenClawOAuthBindingDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], UpsertOpenClawOAuthBindingDto.prototype, "service", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(exports.OPENCLAW_PROVIDERS),
    __metadata("design:type", String)
], UpsertOpenClawOAuthBindingDto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(8192),
    __metadata("design:type", String)
], UpsertOpenClawOAuthBindingDto.prototype, "accessToken", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(8192),
    __metadata("design:type", String)
], UpsertOpenClawOAuthBindingDto.prototype, "refreshToken", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpsertOpenClawOAuthBindingDto.prototype, "accountId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(320),
    __metadata("design:type", String)
], UpsertOpenClawOAuthBindingDto.prototype, "googleEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpsertOpenClawOAuthBindingDto.prototype, "googleProjectId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(exports.OPENCLAW_OAUTH_ACCESS_SCOPES),
    __metadata("design:type", String)
], UpsertOpenClawOAuthBindingDto.prototype, "accessScope", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpsertOpenClawOAuthBindingDto.prototype, "teamWideApproved", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpsertOpenClawOAuthBindingDto.prototype, "primaryModel", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(512),
    __metadata("design:type", String)
], UpsertOpenClawOAuthBindingDto.prototype, "fallbackModels", void 0);
class ExecuteOpenClawOAuthBindingDto {
}
exports.ExecuteOpenClawOAuthBindingDto = ExecuteOpenClawOAuthBindingDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ExecuteOpenClawOAuthBindingDto.prototype, "waitForSuccess", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(10),
    __metadata("design:type", Number)
], ExecuteOpenClawOAuthBindingDto.prototype, "timeoutSeconds", void 0);
//# sourceMappingURL=openclaw-oauth-rotation.dto.js.map