var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
export class CreateUserDto {
    name = '';
    email = '';
    password = '';
}
__decorate([
    IsNotEmpty({ message: 'Name is required' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "name", void 0);
__decorate([
    IsEmail({}, { message: 'Invalid email format' }),
    IsNotEmpty({ message: 'Email is required' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    IsNotEmpty({ message: 'Password is required' }),
    MinLength(8, { message: 'Password must be at least 8 characters long' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
export class UpdateUserDto {
    name = '';
    email = '';
    password = '';
}
__decorate([
    IsNotEmpty({ message: 'Name is required' }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "name", void 0);
__decorate([
    IsEmail({}, { message: 'Invalid email format' }),
    IsNotEmpty({ message: 'Email is required' }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "email", void 0);
__decorate([
    IsNotEmpty({ message: 'Password is required' }),
    MinLength(8, { message: 'Password must be at least 8 characters long' }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "password", void 0);
//# sourceMappingURL=user.dto.js.map