var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, } from 'typeorm';
import { Agent } from './agent.entity';
import { ChatRoom } from './chat-room.entity';
import { Message } from './message.entity';
import { Workflow } from './workflow.entity';
import { LoginAttempt } from '../entities/LoginAttempt';
let User = class User {
    id;
    username;
    email;
    password;
    firstName;
    lastName;
    roles;
    isActive;
    lastLoginAt;
    agents;
    loginAttempts;
    chatRooms;
    messages;
    workflows;
    createdAt;
    updatedAt;
    preferences;
    metadata;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    Column({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    Column({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    Column('simple-array'),
    __metadata("design:type", Array)
], User.prototype, "roles", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "lastLoginAt", void 0);
__decorate([
    OneToMany(() => Agent, (agent) => agent.owner),
    __metadata("design:type", Array)
], User.prototype, "agents", void 0);
__decorate([
    OneToMany(() => LoginAttempt, (loginAttempt) => loginAttempt.user),
    __metadata("design:type", Array)
], User.prototype, "loginAttempts", void 0);
__decorate([
    OneToMany(() => ChatRoom, (chatRoom) => chatRoom.owner),
    __metadata("design:type", Array)
], User.prototype, "chatRooms", void 0);
__decorate([
    OneToMany(() => Message, (message) => message.sender),
    __metadata("design:type", Array)
], User.prototype, "messages", void 0);
__decorate([
    OneToMany(() => Workflow, (workflow) => workflow.creator),
    __metadata("design:type", Array)
], User.prototype, "workflows", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "preferences", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "metadata", void 0);
User = __decorate([
    Entity('users')
], User);
export { User };
//# sourceMappingURL=user.entity.js.map