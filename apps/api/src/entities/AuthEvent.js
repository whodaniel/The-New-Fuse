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
let AuthEvent = class AuthEvent {
    id;
    user;
    userId;
    type;
    description;
    metadata;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], AuthEvent.prototype, "id", void 0);
__decorate([
    ManyToOne(() => User, user => user.authEvents),
    __metadata("design:type", typeof (_a = typeof User !== "undefined" && User) === "function" ? _a : Object)
], AuthEvent.prototype, "user", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], AuthEvent.prototype, "userId", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], AuthEvent.prototype, "type", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], AuthEvent.prototype, "description", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AuthEvent.prototype, "metadata", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], AuthEvent.prototype, "createdAt", void 0);
AuthEvent = __decorate([
    Entity()
], AuthEvent);
export { AuthEvent };
//# sourceMappingURL=AuthEvent.js.map