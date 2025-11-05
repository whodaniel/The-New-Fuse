var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateMessageDto {
    content = '';
    metadata;
    attachments;
    parentMessageId;
}
__decorate([
    ApiProperty(),
    IsString(),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "content", void 0);
__decorate([
    ApiProperty({ required: false }),
    IsObject(),
    IsOptional(),
    __metadata("design:type", Object)
], CreateMessageDto.prototype, "metadata", void 0);
__decorate([
    ApiProperty({ required: false }),
    IsArray(),
    IsOptional(),
    __metadata("design:type", Array)
], CreateMessageDto.prototype, "attachments", void 0);
__decorate([
    ApiProperty({ required: false }),
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "parentMessageId", void 0);
export class MessageResponseDto {
    id = '';
    content = '';
    sender = '';
    timestamp = new Date();
    metadata;
    attachments;
    parentMessageId;
}
__decorate([
    ApiProperty(),
    __metadata("design:type", String)
], MessageResponseDto.prototype, "id", void 0);
__decorate([
    ApiProperty(),
    __metadata("design:type", String)
], MessageResponseDto.prototype, "content", void 0);
__decorate([
    ApiProperty(),
    __metadata("design:type", String)
], MessageResponseDto.prototype, "sender", void 0);
__decorate([
    ApiProperty(),
    __metadata("design:type", Date)
], MessageResponseDto.prototype, "timestamp", void 0);
__decorate([
    ApiProperty({ required: false }),
    __metadata("design:type", Object)
], MessageResponseDto.prototype, "metadata", void 0);
__decorate([
    ApiProperty({ required: false }),
    __metadata("design:type", Array)
], MessageResponseDto.prototype, "attachments", void 0);
__decorate([
    ApiProperty({ required: false }),
    __metadata("design:type", String)
], MessageResponseDto.prototype, "parentMessageId", void 0);
//# sourceMappingURL=message.dto.js.map