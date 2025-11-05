var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, } from 'typeorm';
import { User } from './user.entity';
import { ChatRoom } from './chat-room.entity';
import { Agent } from './agent.entity';
let Message = class Message {
    id;
    content;
    sender;
    agent;
    room;
    parentMessage;
    replies;
    metadata;
    attachments;
    timestamp;
    updatedAt;
    isEdited;
    isDeleted;
    reactions;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Message.prototype, "id", void 0);
__decorate([
    Column('text'),
    __metadata("design:type", String)
], Message.prototype, "content", void 0);
__decorate([
    ManyToOne(() => User, (user) => user.messages),
    __metadata("design:type", typeof (_a = typeof User !== "undefined" && User) === "function" ? _a : Object)
], Message.prototype, "sender", void 0);
__decorate([
    ManyToOne(() => Agent, (agent) => agent.messages, { nullable: true }),
    __metadata("design:type", typeof (_b = typeof Agent !== "undefined" && Agent) === "function" ? _b : Object)
], Message.prototype, "agent", void 0);
__decorate([
    ManyToOne(() => ChatRoom, (room) => room.messages),
    __metadata("design:type", typeof (_c = typeof ChatRoom !== "undefined" && ChatRoom) === "function" ? _c : Object)
], Message.prototype, "room", void 0);
__decorate([
    ManyToOne(() => Message, (message) => message.replies, { nullable: true }),
    __metadata("design:type", Message)
], Message.prototype, "parentMessage", void 0);
__decorate([
    OneToMany(() => Message, (message) => message.parentMessage),
    __metadata("design:type", Array)
], Message.prototype, "replies", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Message.prototype, "metadata", void 0);
__decorate([
    Column('simple-array', { nullable: true }),
    __metadata("design:type", Array)
], Message.prototype, "attachments", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Message.prototype, "timestamp", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Message.prototype, "updatedAt", void 0);
__decorate([
    Column({ default: false }),
    __metadata("design:type", Boolean)
], Message.prototype, "isEdited", void 0);
__decorate([
    Column({ default: false }),
    __metadata("design:type", Boolean)
], Message.prototype, "isDeleted", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Message.prototype, "reactions", void 0);
Message = __decorate([
    Entity('messages')
], Message);
export { Message };
//# sourceMappingURL=message.entity.js.map