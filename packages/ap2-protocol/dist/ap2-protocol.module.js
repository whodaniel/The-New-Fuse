var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { Ap2ProtocolService } from './ap2-protocol.service.js';
import { Ap2ProtocolController } from './ap2-protocol.controller.js';
let Ap2ProtocolModule = class Ap2ProtocolModule {
};
Ap2ProtocolModule = __decorate([
    Module({
        imports: [HttpModule],
        providers: [Ap2ProtocolService],
        controllers: [Ap2ProtocolController],
        exports: [Ap2ProtocolService],
    })
], Ap2ProtocolModule);
export { Ap2ProtocolModule };
//# sourceMappingURL=ap2-protocol.module.js.map