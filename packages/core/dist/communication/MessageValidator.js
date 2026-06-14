var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let MessageValidator = class MessageValidator {
    constructor() {
        this.rules = new Map();
    }
    addRules(topic, rules) {
        this.rules.set(topic, rules);
    }
    validate(message) {
        const rules = this.rules.get(message.topic) || [];
        const errors = [];
        for (const rule of rules) {
            const value = this.getNestedValue(message.payload, rule.field);
            if (!rule.validator(value)) {
                errors.push(rule.message);
            }
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    hasRules(topic) {
        return this.rules.has(topic);
    }
    getRules(topic) {
        return this.rules.get(topic) || [];
    }
};
MessageValidator = __decorate([
    Injectable()
], MessageValidator);
export { MessageValidator };
//# sourceMappingURL=MessageValidator.js.map