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
import { IsString, IsNotEmpty, IsIn } from 'class-validator';
export class CreateProviderDto {
    userId;
    providerName;
    apiKey;
}
__decorate([
    ApiProperty({ description: 'User ID associated with the provider' }),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateProviderDto.prototype, "userId", void 0);
__decorate([
    ApiProperty({
        enum: ['openai', 'anthropic', 'cohere'],
        description: 'Name of the LLM provider'
    }),
    IsString(),
    IsIn(['openai', 'anthropic', 'cohere']),
    __metadata("design:type", String)
], CreateProviderDto.prototype, "providerName", void 0);
__decorate([
    ApiProperty({ description: 'API key for the LLM provider' }),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateProviderDto.prototype, "apiKey", void 0);
//# sourceMappingURL=create-provider.dto.js.map