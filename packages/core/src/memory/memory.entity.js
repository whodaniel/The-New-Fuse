var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
export var MemoryType;
(function (MemoryType) {
    MemoryType["CONVERSATION"] = "conversation";
    MemoryType["CONTEXT"] = "context";
    MemoryType["KNOWLEDGE"] = "knowledge";
    MemoryType["WORKFLOW"] = "workflow";
})(MemoryType || (MemoryType = {}));
let Memory = class Memory {
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Memory.prototype, "id", void 0);
__decorate([
    Column('text'),
    __metadata("design:type", String)
], Memory.prototype, "content", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: MemoryType,
        default: MemoryType.CONVERSATION
    }),
    __metadata("design:type", String)
], Memory.prototype, "type", void 0);
__decorate([
    Column('jsonb', { nullable: true }),
    __metadata("design:type", Object)
], Memory.prototype, "metadata", void 0);
__decorate([
    Column('float', { default: 0.5 }),
    __metadata("design:type", Number)
], Memory.prototype, "importance", void 0);
__decorate([
    Column('simple-array', { nullable: true }),
    __metadata("design:type", Array)
], Memory.prototype, "tags", void 0);
__decorate([
    Column('tsvector', { nullable: true }),
    __metadata("design:type", String)
], Memory.prototype, "searchVector", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Memory.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Memory.prototype, "updatedAt", void 0);
Memory = __decorate([
    Entity('memories'),
    Index(['type', 'createdAt']),
    Index(['importance'])
], Memory);
export { Memory };
