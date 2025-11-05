var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsNotEmpty, IsOptional, IsJSON, IsBoolean } from 'class-validator';
export class CreateInterfaceDto {
    name = '';
    description;
    workflowId = '';
    fields = ''; // JSON string representing the form fields
    isPublic;
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateInterfaceDto.prototype, "name", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateInterfaceDto.prototype, "description", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateInterfaceDto.prototype, "workflowId", void 0);
__decorate([
    IsJSON(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateInterfaceDto.prototype, "fields", void 0);
__decorate([
    IsBoolean(),
    IsOptional(),
    __metadata("design:type", Boolean)
], CreateInterfaceDto.prototype, "isPublic", void 0);
export class UpdateInterfaceDto {
    name;
    description;
    fields;
    isPublic;
}
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateInterfaceDto.prototype, "name", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateInterfaceDto.prototype, "description", void 0);
__decorate([
    IsJSON(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateInterfaceDto.prototype, "fields", void 0);
__decorate([
    IsBoolean(),
    IsOptional(),
    __metadata("design:type", Boolean)
], UpdateInterfaceDto.prototype, "isPublic", void 0);
//# sourceMappingURL=interface.dto.js.map