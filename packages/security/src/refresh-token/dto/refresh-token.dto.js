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
exports.ActiveTokenResponseDto = exports.RevokeAllTokensRequestDto = exports.RevokeTokenRequestDto = exports.RefreshTokenResponseDto = exports.RefreshTokenRequestDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RefreshTokenRequestDto {
    refreshToken;
    deviceInfo;
}
exports.RefreshTokenRequestDto = RefreshTokenRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Refresh token to be used for generating new access token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RefreshTokenRequestDto.prototype, "refreshToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Device information for tracking',
        example: 'iPhone 14 Pro, iOS 16.1',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RefreshTokenRequestDto.prototype, "deviceInfo", void 0);
class RefreshTokenResponseDto {
    accessToken;
    refreshToken;
    expiresIn;
    tokenType;
}
exports.RefreshTokenResponseDto = RefreshTokenResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'New JWT access token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }),
    __metadata("design:type", String)
], RefreshTokenResponseDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'New refresh token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }),
    __metadata("design:type", String)
], RefreshTokenResponseDto.prototype, "refreshToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token expiration time in seconds',
        example: 900
    }),
    __metadata("design:type", Number)
], RefreshTokenResponseDto.prototype, "expiresIn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token type',
        example: 'Bearer'
    }),
    __metadata("design:type", String)
], RefreshTokenResponseDto.prototype, "tokenType", void 0);
class RevokeTokenRequestDto {
    refreshToken;
}
exports.RevokeTokenRequestDto = RevokeTokenRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Refresh token to revoke',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RevokeTokenRequestDto.prototype, "refreshToken", void 0);
class RevokeAllTokensRequestDto {
    userId;
}
exports.RevokeAllTokensRequestDto = RevokeAllTokensRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User ID to revoke all tokens for',
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RevokeAllTokensRequestDto.prototype, "userId", void 0);
class ActiveTokenResponseDto {
    id;
    deviceInfo;
    ipAddress;
    userAgent;
    createdAt;
    expiresAt;
}
exports.ActiveTokenResponseDto = ActiveTokenResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token ID',
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    }),
    __metadata("design:type", String)
], ActiveTokenResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Device information',
        example: 'iPhone 14 Pro, iOS 16.1',
        nullable: true
    }),
    __metadata("design:type", Object)
], ActiveTokenResponseDto.prototype, "deviceInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'IP address when token was created',
        example: '192.168.1.100',
        nullable: true
    }),
    __metadata("design:type", Object)
], ActiveTokenResponseDto.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User agent when token was created',
        example: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X) AppleWebKit/605.1.15',
        nullable: true
    }),
    __metadata("design:type", Object)
], ActiveTokenResponseDto.prototype, "userAgent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token creation date',
        example: '2025-01-01T12:00:00Z'
    }),
    __metadata("design:type", Date)
], ActiveTokenResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token expiration date',
        example: '2025-02-01T12:00:00Z'
    }),
    __metadata("design:type", Date)
], ActiveTokenResponseDto.prototype, "expiresAt", void 0);
//# sourceMappingURL=refresh-token.dto.js.map