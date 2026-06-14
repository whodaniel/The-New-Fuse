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
exports.ResourceSearchProtocolResponseEnvelopeDto = exports.ResourceSearchProtocolRequestEnvelopeDto = exports.ResourceSearchProtocolTraceDto = exports.ResourceSearchProtocolActorDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const resource_search_dto_1 = require("./resource-search.dto");
class ResourceSearchProtocolActorDto {
}
exports.ResourceSearchProtocolActorDto = ResourceSearchProtocolActorDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResourceSearchProtocolActorDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], ResourceSearchProtocolActorDto.prototype, "roles", void 0);
class ResourceSearchProtocolTraceDto {
}
exports.ResourceSearchProtocolTraceDto = ResourceSearchProtocolTraceDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResourceSearchProtocolTraceDto.prototype, "correlation_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], ResourceSearchProtocolTraceDto.prototype, "causation_id", void 0);
class ResourceSearchProtocolRequestEnvelopeDto {
}
exports.ResourceSearchProtocolRequestEnvelopeDto = ResourceSearchProtocolRequestEnvelopeDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResourceSearchProtocolRequestEnvelopeDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ default: 'sgp/0.1' }),
    __metadata("design:type", String)
], ResourceSearchProtocolRequestEnvelopeDto.prototype, "spec", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['DISCOVER.REQUEST', 'QUERY.REQUEST'] }),
    __metadata("design:type", String)
], ResourceSearchProtocolRequestEnvelopeDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResourceSearchProtocolRequestEnvelopeDto.prototype, "tenant", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResourceSearchProtocolRequestEnvelopeDto.prototype, "resource", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResourceSearchProtocolRequestEnvelopeDto.prototype, "sent_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: ResourceSearchProtocolActorDto }),
    __metadata("design:type", ResourceSearchProtocolActorDto)
], ResourceSearchProtocolRequestEnvelopeDto.prototype, "actor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: ResourceSearchProtocolTraceDto }),
    __metadata("design:type", ResourceSearchProtocolTraceDto)
], ResourceSearchProtocolRequestEnvelopeDto.prototype, "trace", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: resource_search_dto_1.ResourceSearchRequestDto }),
    __metadata("design:type", resource_search_dto_1.ResourceSearchRequestDto)
], ResourceSearchProtocolRequestEnvelopeDto.prototype, "payload", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], ResourceSearchProtocolRequestEnvelopeDto.prototype, "sig", void 0);
class ResourceSearchProtocolResponseEnvelopeDto {
}
exports.ResourceSearchProtocolResponseEnvelopeDto = ResourceSearchProtocolResponseEnvelopeDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResourceSearchProtocolResponseEnvelopeDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ default: 'sgp/0.1' }),
    __metadata("design:type", String)
], ResourceSearchProtocolResponseEnvelopeDto.prototype, "spec", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['DISCOVER.RESPONSE', 'QUERY.RESPONSE', 'ERROR'] }),
    __metadata("design:type", String)
], ResourceSearchProtocolResponseEnvelopeDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResourceSearchProtocolResponseEnvelopeDto.prototype, "tenant", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResourceSearchProtocolResponseEnvelopeDto.prototype, "resource", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResourceSearchProtocolResponseEnvelopeDto.prototype, "sent_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: ResourceSearchProtocolActorDto }),
    __metadata("design:type", ResourceSearchProtocolActorDto)
], ResourceSearchProtocolResponseEnvelopeDto.prototype, "actor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: ResourceSearchProtocolTraceDto }),
    __metadata("design:type", ResourceSearchProtocolTraceDto)
], ResourceSearchProtocolResponseEnvelopeDto.prototype, "trace", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        oneOf: [
            {
                type: 'array',
                items: { $ref: (0, swagger_1.getSchemaPath)(resource_search_dto_1.ResourceDto) },
            },
            {
                $ref: (0, swagger_1.getSchemaPath)(resource_search_dto_1.ResourceSearchEnvelopeDto),
            },
        ],
    }),
    __metadata("design:type", Object)
], ResourceSearchProtocolResponseEnvelopeDto.prototype, "payload", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], ResourceSearchProtocolResponseEnvelopeDto.prototype, "sig", void 0);
//# sourceMappingURL=resource-search-protocol.dto.js.map