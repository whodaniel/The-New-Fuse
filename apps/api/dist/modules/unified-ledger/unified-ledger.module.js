"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedLedgerModule = void 0;
const common_1 = require("@nestjs/common");
const agents_module_1 = require("../../agents/agents.module");
const unified_ledger_controller_1 = require("./unified-ledger.controller");
const unified_ledger_service_1 = require("./unified-ledger.service");
let UnifiedLedgerModule = class UnifiedLedgerModule {
};
exports.UnifiedLedgerModule = UnifiedLedgerModule;
exports.UnifiedLedgerModule = UnifiedLedgerModule = __decorate([
    (0, common_1.Module)({
        imports: [agents_module_1.AgentsModule],
        controllers: [unified_ledger_controller_1.UnifiedLedgerController],
        providers: [unified_ledger_service_1.UnifiedLedgerService],
        exports: [unified_ledger_service_1.UnifiedLedgerService],
    })
], UnifiedLedgerModule);
//# sourceMappingURL=unified-ledger.module.js.map