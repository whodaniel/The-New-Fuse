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
exports.RedeemManagedAccountGrantDto = exports.CreateManagedAccountGrantDto = exports.ProvisionManagedAccountDto = void 0;
const class_validator_1 = require("class-validator");
class ProvisionManagedAccountDto {
}
exports.ProvisionManagedAccountDto = ProvisionManagedAccountDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['hosted_email', 'chatgpt', 'external']),
    __metadata("design:type", String)
], ProvisionManagedAccountDto.prototype, "accountType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], ProvisionManagedAccountDto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], ProvisionManagedAccountDto.prototype, "loginIdentifier", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    (0, class_validator_1.MaxLength)(512),
    __metadata("design:type", String)
], ProvisionManagedAccountDto.prototype, "secret", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ProvisionManagedAccountDto.prototype, "metadata", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], ProvisionManagedAccountDto.prototype, "createdByAgent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ProvisionManagedAccountDto.prototype, "createOnHosting", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], ProvisionManagedAccountDto.prototype, "hostingDomain", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], ProvisionManagedAccountDto.prototype, "hostingMailbox", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(10),
    (0, class_validator_1.Max)(10240),
    __metadata("design:type", Number)
], ProvisionManagedAccountDto.prototype, "hostingQuotaMb", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ProvisionManagedAccountDto.prototype, "allowChatgptAutomation", void 0);
class CreateManagedAccountGrantDto {
}
exports.CreateManagedAccountGrantDto = CreateManagedAccountGrantDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateManagedAccountGrantDto.prototype, "granteeAgentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(64),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateManagedAccountGrantDto.prototype, "scopes", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateManagedAccountGrantDto.prototype, "expiresAt", void 0);
class RedeemManagedAccountGrantDto {
}
exports.RedeemManagedAccountGrantDto = RedeemManagedAccountGrantDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(16),
    (0, class_validator_1.MaxLength)(256),
    __metadata("design:type", String)
], RedeemManagedAccountGrantDto.prototype, "grantToken", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], RedeemManagedAccountGrantDto.prototype, "granteeAgentId", void 0);
//# sourceMappingURL=email-custodian.dto.js.map