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
exports.securityConfig = void 0;
const config_1 = require("@nestjs/config");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class EnvironmentVariables {
    JWT_SECRET;
    JWT_EXPIRES_IN = '15m';
    JWT_REFRESH_SECRET;
    JWT_REFRESH_EXPIRES_IN = '7d';
    BCRYPT_SALT_ROUNDS = 12;
    RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    RATE_LIMIT_MAX = 100;
    RATE_LIMIT_SKIP_SUCCESSFUL = false;
    MFA_ISSUER = 'The New Fuse';
    MFA_WINDOW = 1;
    AUDIT_ENABLED = true;
    AUDIT_RETENTION_DAYS = 90;
    CORS_ORIGIN = 'http://localhost:3000';
    CORS_CREDENTIALS = true;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "JWT_SECRET", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "JWT_EXPIRES_IN", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "JWT_REFRESH_SECRET", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "JWT_REFRESH_EXPIRES_IN", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], EnvironmentVariables.prototype, "BCRYPT_SALT_ROUNDS", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], EnvironmentVariables.prototype, "RATE_LIMIT_WINDOW_MS", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], EnvironmentVariables.prototype, "RATE_LIMIT_MAX", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], EnvironmentVariables.prototype, "RATE_LIMIT_SKIP_SUCCESSFUL", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "MFA_ISSUER", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], EnvironmentVariables.prototype, "MFA_WINDOW", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], EnvironmentVariables.prototype, "AUDIT_ENABLED", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], EnvironmentVariables.prototype, "AUDIT_RETENTION_DAYS", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "CORS_ORIGIN", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], EnvironmentVariables.prototype, "CORS_CREDENTIALS", void 0);
exports.securityConfig = (0, config_1.registerAs)('security', () => {
    const validatedConfig = (0, class_transformer_1.plainToClass)(EnvironmentVariables, process.env, {
        enableImplicitConversion: true,
    });
    const errors = (0, class_validator_1.validateSync)(validatedConfig, { skipMissingProperties: false });
    if (errors.length > 0) {
        throw new Error(`Configuration validation error: ${errors.toString()}`);
    }
    return {
        jwt: {
            secret: validatedConfig.JWT_SECRET,
            expiresIn: validatedConfig.JWT_EXPIRES_IN,
            refreshSecret: validatedConfig.JWT_REFRESH_SECRET,
            refreshExpiresIn: validatedConfig.JWT_REFRESH_EXPIRES_IN,
        },
        bcrypt: {
            saltRounds: validatedConfig.BCRYPT_SALT_ROUNDS,
        },
        rateLimiting: {
            windowMs: validatedConfig.RATE_LIMIT_WINDOW_MS,
            max: validatedConfig.RATE_LIMIT_MAX,
            skipSuccessfulRequests: validatedConfig.RATE_LIMIT_SKIP_SUCCESSFUL,
        },
        mfa: {
            issuer: validatedConfig.MFA_ISSUER,
            window: validatedConfig.MFA_WINDOW,
        },
        audit: {
            enabled: validatedConfig.AUDIT_ENABLED,
            retentionDays: validatedConfig.AUDIT_RETENTION_DAYS,
        },
        cors: {
            origin: validatedConfig.CORS_ORIGIN.split(',').map(origin => origin.trim()),
            credentials: validatedConfig.CORS_CREDENTIALS,
        },
    };
});
//# sourceMappingURL=security.config.js.map