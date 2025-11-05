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
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
let AuthSession = class AuthSession {
    id;
    user;
    userId;
    token;
    lastActivity;
    expiresAt;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], AuthSession.prototype, "id", void 0);
__decorate([
    ManyToOne(() => User, user => user.authSessions),
    __metadata("design:type", typeof (_a = typeof User !== "undefined" && User) === "function" ? _a : Object)
], AuthSession.prototype, "user", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], AuthSession.prototype, "userId", void 0);
__decorate([
    Column({ unique: true }),
    __metadata("design:type", String)
], AuthSession.prototype, "token", void 0);
__decorate([
    Column(),
    __metadata("design:type", Date)
], AuthSession.prototype, "lastActivity", void 0);
__decorate([
    Column(),
    __metadata("design:type", Date)
], AuthSession.prototype, "expiresAt", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], AuthSession.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], AuthSession.prototype, "updatedAt", void 0);
AuthSession = __decorate([
    Entity()
], AuthSession);
export { AuthSession };
//# sourceMappingURL=AuthSession.js.map