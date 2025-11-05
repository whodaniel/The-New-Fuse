var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class RegisterDto {
    name;
    email;
    password;
}
__decorate([
    ApiProperty({ example: 'John Doe', description: 'User\'s full name' }),
    IsString(),
    MinLength(2),
    MaxLength(100),
    __metadata("design:type", String)
], RegisterDto.prototype, "name", void 0);
__decorate([
    ApiProperty({ example: 'john@example.com', description: 'User\'s email address' }),
    IsEmail(),
    MaxLength(255),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    ApiProperty({ example: 'password123', description: 'User\'s password' }),
    IsString(),
    MinLength(8),
    MaxLength(50),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
//# sourceMappingURL=register.dto.js.map