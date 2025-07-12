var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
let A2AModule = class A2AModule {
};
A2AModule = __decorate([
    Module({
        imports: [EventEmitterModule],
        providers: [
        // A2A services would go here when implemented
        ],
        controllers: [
        // A2A controllers would go here when implemented
        ],
        exports: [
        // A2A exports would go here when implemented
        ],
    })
], A2AModule);
export { A2AModule };
