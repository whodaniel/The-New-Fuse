var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StateService_1;
import { Injectable, Logger } from '@nestjs/common';
let StateService = StateService_1 = class StateService {
    constructor() {
        this.state = new Map();
        this.logger = new Logger(StateService_1.name);
    }
    async get(key) {
        return this.state.get(key);
    }
    async set(key, value) {
        this.state.set(key, value);
    }
    async delete(key) {
        this.state.delete(key);
    }
    async exists(key) {
        return this.state.has(key);
    }
    async increment(key, amount = 1) {
        const current = this.state.get(key) || 0;
        const newValue = Number(current) + amount;
        this.state.set(key, newValue);
        return newValue;
    }
    async decrement(key, amount = 1) {
        const current = this.state.get(key) || 0;
        const newValue = Number(current) - amount;
        this.state.set(key, newValue);
        return newValue;
    }
    async getKeys() {
        return Array.from(this.state.keys());
    }
    async clear() {
        this.state.clear();
    }
};
StateService = StateService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], StateService);
export { StateService };
//# sourceMappingURL=StateService.js.map