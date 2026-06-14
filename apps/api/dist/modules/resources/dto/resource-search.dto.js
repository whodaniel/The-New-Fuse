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
exports.ResourceSearchEnvelopeDto = exports.ResourceDto = exports.ResourceSearchMetaDto = exports.ResourceSearchRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ResourceSearchRequestDto {
}
exports.ResourceSearchRequestDto = ResourceSearchRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Free-text search string' }),
    __metadata("design:type", String)
], ResourceSearchRequestDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ['skill', 'workflow', 'template', 'tool', 'integration', 'all'],
        default: 'all',
    }),
    __metadata("design:type", Object)
], ResourceSearchRequestDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: [
            'development',
            'productivity',
            'communication',
            'data',
            'automation',
            'ai',
            'other',
            'all',
        ],
        default: 'all',
    }),
    __metadata("design:type", Object)
], ResourceSearchRequestDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], ResourceSearchRequestDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    __metadata("design:type", Boolean)
], ResourceSearchRequestDto.prototype, "featured", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['popular', 'recent', 'rating', 'name'], default: 'popular' }),
    __metadata("design:type", Object)
], ResourceSearchRequestDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Enable trait screening for this query', default: true }),
    __metadata("design:type", Boolean)
], ResourceSearchRequestDto.prototype, "traitScreen", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Trait-screening candidate limit', minimum: 1 }),
    __metadata("design:type", Number)
], ResourceSearchRequestDto.prototype, "traitLimit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Trait-screening threshold', minimum: 0, maximum: 1 }),
    __metadata("design:type", Number)
], ResourceSearchRequestDto.prototype, "traitThreshold", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Return envelope { items, traitScreen } instead of legacy array',
        default: false,
    }),
    __metadata("design:type", Boolean)
], ResourceSearchRequestDto.prototype, "includeTraitMeta", void 0);
class ResourceSearchMetaDto {
}
exports.ResourceSearchMetaDto = ResourceSearchMetaDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ResourceSearchMetaDto.prototype, "enabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ResourceSearchMetaDto.prototype, "used", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        nullable: true,
        enum: ['high', 'medium', 'low'],
    }),
    __metadata("design:type", Object)
], ResourceSearchMetaDto.prototype, "confidence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], ResourceSearchMetaDto.prototype, "traitFilters", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], ResourceSearchMetaDto.prototype, "requiredAgentIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ResourceSearchMetaDto.prototype, "fallbackToBroadSearch", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ResourceSearchMetaDto.prototype, "beforeTraitCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ResourceSearchMetaDto.prototype, "afterTraitCount", void 0);
class ResourceDto {
}
exports.ResourceDto = ResourceDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResourceDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResourceDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResourceDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResourceDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResourceDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], ResourceDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResourceDto.prototype, "author", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResourceDto.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ResourceDto.prototype, "downloads", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ResourceDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ResourceDto.prototype, "reviews", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ResourceDto.prototype, "featured", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResourceDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResourceDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], ResourceDto.prototype, "icon", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], ResourceDto.prototype, "previewImage", void 0);
class ResourceSearchEnvelopeDto {
}
exports.ResourceSearchEnvelopeDto = ResourceSearchEnvelopeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ResourceDto] }),
    __metadata("design:type", Array)
], ResourceSearchEnvelopeDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: ResourceSearchMetaDto }),
    __metadata("design:type", ResourceSearchMetaDto)
], ResourceSearchEnvelopeDto.prototype, "traitScreen", void 0);
//# sourceMappingURL=resource-search.dto.js.map