"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GooseModule = void 0;
const common_1 = require("@nestjs/common");
const billing_module_1 = require("../../billing/billing.module");
const goose_controller_1 = require("./goose.controller");
const goose_service_1 = require("./goose.service");
let GooseModule = class GooseModule {
};
exports.GooseModule = GooseModule;
exports.GooseModule = GooseModule = __decorate([
    (0, common_1.Module)({
        imports: [billing_module_1.BillingModule],
        controllers: [goose_controller_1.GooseController],
        providers: [goose_service_1.GooseService],
        exports: [goose_service_1.GooseService],
    })
], GooseModule);
//# sourceMappingURL=goose.module.js.map