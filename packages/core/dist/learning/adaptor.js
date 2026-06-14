var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var Adaptor_1;
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
let Adaptor = Adaptor_1 = class Adaptor {
    constructor() {
        this.logger = new Logger(Adaptor_1.name);
    }
    adapt(pattern) {
        this.logger.log(`Adapting to new pattern: ${JSON.stringify(pattern)}`);
        // This is a placeholder for a more robust implementation that would
        // adapt the system based on the learned pattern.
    }
};
__decorate([
    OnEvent('pattern.learned'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], Adaptor.prototype, "adapt", null);
Adaptor = Adaptor_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], Adaptor);
export { Adaptor };
//# sourceMappingURL=adaptor.js.map