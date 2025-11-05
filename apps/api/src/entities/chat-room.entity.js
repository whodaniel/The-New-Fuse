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
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany, JoinTable, } from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';
let ChatRoom = class ChatRoom {
    id;
    name;
    description;
    isPrivate;
    owner;
    members;
    messages;
    settings;
    metadata;
    createdAt;
    updatedAt;
    lastMessageAt;
    isActive;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], ChatRoom.prototype, "id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], ChatRoom.prototype, "name", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], ChatRoom.prototype, "description", void 0);
__decorate([
    Column({ default: false }),
    __metadata("design:type", Boolean)
], ChatRoom.prototype, "isPrivate", void 0);
__decorate([
    ManyToOne(() => User, (user) => user.chatRooms),
    __metadata("design:type", typeof (_a = typeof User !== "undefined" && User) === "function" ? _a : Object)
], ChatRoom.prototype, "owner", void 0);
__decorate([
    ManyToMany(() => User),
    JoinTable({
        name: 'chat_room_members',
        joinColumn: { name: 'room_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], ChatRoom.prototype, "members", void 0);
__decorate([
    OneToMany(() => Message, (message) => message.room),
    __metadata("design:type", Array)
], ChatRoom.prototype, "messages", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ChatRoom.prototype, "settings", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ChatRoom.prototype, "metadata", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], ChatRoom.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], ChatRoom.prototype, "updatedAt", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", Date)
], ChatRoom.prototype, "lastMessageAt", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], ChatRoom.prototype, "isActive", void 0);
ChatRoom = __decorate([
    Entity('chat_rooms')
], ChatRoom);
export { ChatRoom };
//# sourceMappingURL=chat-room.entity.js.map