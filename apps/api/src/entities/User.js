var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Agent } from './Agent';
import { Pipeline } from './Pipeline';
import { AuthSession } from './AuthSession';
import { LoginAttempt } from './LoginAttempt';
import { AuthEvent } from './AuthEvent';
let User = class User {
    id;
    email;
    hashedPassword;
    name;
    role;
    refreshToken;
    agents;
    pipelines;
    authSessions;
    loginAttempts;
    authEvents;
    createdAt;
    updatedAt;
    deletedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    Column({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    Column(),
    Exclude(),
    __metadata("design:type", String)
], User.prototype, "hashedPassword", void 0);
__decorate([
    Column({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    Column({ type: 'varchar', length: 50, default: 'user' }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    Column({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "refreshToken", void 0);
__decorate([
    OneToMany(() => Agent, agent => agent.user),
    __metadata("design:type", Array)
], User.prototype, "agents", void 0);
__decorate([
    OneToMany(() => Pipeline, pipeline => pipeline.user),
    __metadata("design:type", Array)
], User.prototype, "pipelines", void 0);
__decorate([
    OneToMany(() => AuthSession, session => session.user),
    __metadata("design:type", Array)
], User.prototype, "authSessions", void 0);
__decorate([
    OneToMany(() => LoginAttempt, attempt => attempt.user),
    __metadata("design:type", Array)
], User.prototype, "loginAttempts", void 0);
__decorate([
    OneToMany(() => AuthEvent, event => event.user),
    __metadata("design:type", Array)
], User.prototype, "authEvents", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    DeleteDateColumn(),
    __metadata("design:type", Date)
], User.prototype, "deletedAt", void 0);
User = __decorate([
    Entity('users')
], User);
export { User };
//# sourceMappingURL=User.js.map