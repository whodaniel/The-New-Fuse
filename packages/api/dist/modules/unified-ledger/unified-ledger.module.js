var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { UnifiedLedgerController } from './unified-ledger.controller';
import { UnifiedLedgerService } from './unified-ledger.service';
let UnifiedLedgerModule = class UnifiedLedgerModule {
};
UnifiedLedgerModule = __decorate([
    Module({
        controllers: [UnifiedLedgerController],
        providers: [UnifiedLedgerService],
        exports: [UnifiedLedgerService],
    })
], UnifiedLedgerModule);
export { UnifiedLedgerModule };
//# sourceMappingURL=unified-ledger.module.js.map