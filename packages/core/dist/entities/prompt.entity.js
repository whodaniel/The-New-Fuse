var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
let PromptTemplate = class PromptTemplate {
    process(values) {
        let processed = this.template;
        Object.entries(values).forEach(([key, value]) => {
            processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        });
        return processed;
    }
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], PromptTemplate.prototype, "id", void 0);
__decorate([
    Column({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], PromptTemplate.prototype, "name", void 0);
__decorate([
    Column('text'),
    __metadata("design:type", String)
], PromptTemplate.prototype, "template", void 0);
__decorate([
    Column('jsonb'),
    __metadata("design:type", Object)
], PromptTemplate.prototype, "variables", void 0);
__decorate([
    Column('jsonb', { nullable: true }),
    __metadata("design:type", Object)
], PromptTemplate.prototype, "metadata", void 0);
__decorate([
    Column({ default: 'active' }),
    __metadata("design:type", String)
], PromptTemplate.prototype, "status", void 0);
__decorate([
    Column({ default: '1.0' }),
    __metadata("design:type", String)
], PromptTemplate.prototype, "version", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], PromptTemplate.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], PromptTemplate.prototype, "updatedAt", void 0);
PromptTemplate = __decorate([
    Entity('prompt_templates')
], PromptTemplate);
export { PromptTemplate };
//# sourceMappingURL=prompt.entity.js.map