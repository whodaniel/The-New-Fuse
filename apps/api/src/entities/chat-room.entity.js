"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRoom = void 0;
const typeorm_1 = require("typeorm");
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
exports.ChatRoom = ChatRoom;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ChatRoom.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ChatRoom.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ChatRoom.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ChatRoom.prototype, "isPrivate", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => 'User', (user) => user.chatRooms),
    __metadata("design:type", Function)
], ChatRoom.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => 'User'),
    (0, typeorm_1.JoinTable)({
        name: 'chat_room_members',
        joinColumn: { name: 'room_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], ChatRoom.prototype, "members", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => 'Message', (message) => message.room),
    __metadata("design:type", Array)
], ChatRoom.prototype, "messages", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ChatRoom.prototype, "settings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ChatRoom.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ChatRoom.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ChatRoom.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], ChatRoom.prototype, "lastMessageAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ChatRoom.prototype, "isActive", void 0);
exports.ChatRoom = ChatRoom = __decorate([
    (0, typeorm_1.Entity)('chat_rooms')
], ChatRoom);
