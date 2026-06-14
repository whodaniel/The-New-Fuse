var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ApiProperty } from '@nestjs/swagger';
/**
 * DTO class for Message model to be used with Swagger
 */
export class MessageDto {
    constructor() {
        this.id = '';
        this.content = '';
        this.role = '';
        this.userId = '';
        this.createdAt = new Date();
    }
}
__decorate([
    ApiProperty({ description: 'Unique identifier for the message' }),
    __metadata("design:type", String)
], MessageDto.prototype, "id", void 0);
__decorate([
    ApiProperty({ description: 'Content of the message' }),
    __metadata("design:type", String)
], MessageDto.prototype, "content", void 0);
__decorate([
    ApiProperty({ description: 'Role of the message sender', example: 'user' }),
    __metadata("design:type", String)
], MessageDto.prototype, "role", void 0);
__decorate([
    ApiProperty({ description: 'ID of the user who owns this message' }),
    __metadata("design:type", String)
], MessageDto.prototype, "userId", void 0);
__decorate([
    ApiProperty({ description: 'ID of the agent who sent this message', required: false }),
    __metadata("design:type", String)
], MessageDto.prototype, "fromAgentId", void 0);
__decorate([
    ApiProperty({ description: 'ID of the agent who received this message', required: false }),
    __metadata("design:type", String)
], MessageDto.prototype, "toAgentId", void 0);
__decorate([
    ApiProperty({ description: 'When the message was created' }),
    __metadata("design:type", Date)
], MessageDto.prototype, "createdAt", void 0);
//# sourceMappingURL=message.dto.js.map