"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessModule = void 0;
const common_1 = require("@nestjs/common");
const drizzle_1 = require("@the-new-fuse/database/drizzle");
const auth_module_1 = require("../auth/auth.module");
const billing_module_1 = require("../billing/billing.module");
const access_bootstrap_service_1 = require("./access-bootstrap.service");
const access_controller_1 = require("./access.controller");
const access_service_1 = require("./access.service");
let AccessModule = class AccessModule {
};
exports.AccessModule = AccessModule;
exports.AccessModule = AccessModule = __decorate([
    (0, common_1.Module)({
        imports: [drizzle_1.DrizzleModule, auth_module_1.AuthModule, billing_module_1.BillingModule],
        controllers: [access_controller_1.AccessController],
        providers: [access_service_1.AccessService, access_bootstrap_service_1.AccessBootstrapService],
        exports: [access_service_1.AccessService],
    })
], AccessModule);
//# sourceMappingURL=access.module.js.map