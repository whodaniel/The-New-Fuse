var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './User';
let LoginAttempt = class LoginAttempt {
    id;
    user;
    userId;
    success;
    ipAddress;
    userAgent;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], LoginAttempt.prototype, "id", void 0);
__decorate([
    ManyToOne(() => User, user => user.loginAttempts),
    __metadata("design:type", typeof (_a = typeof User !== "undefined" && User) === "function" ? _a : Object)
], LoginAttempt.prototype, "user", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], LoginAttempt.prototype, "userId", void 0);
__decorate([
    Column(),
    __metadata("design:type", Boolean)
], LoginAttempt.prototype, "success", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], LoginAttempt.prototype, "ipAddress", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], LoginAttempt.prototype, "userAgent", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], LoginAttempt.prototype, "createdAt", void 0);
LoginAttempt = __decorate([
    Entity()
], LoginAttempt);
export { LoginAttempt };
//# sourceMappingURL=LoginAttempt.js.map