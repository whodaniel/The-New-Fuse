"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartAccountModule = void 0;
const common_1 = require("@nestjs/common");
const smart_account_service_1 = require("./smart-account.service");
const smart_account_controller_1 = require("./smart-account.controller");
const web3auth_module_1 = require("../web3auth/web3auth.module");
const prisma_service_1 = require("../services/prisma.service");
let SmartAccountModule = class SmartAccountModule {
};
exports.SmartAccountModule = SmartAccountModule;
exports.SmartAccountModule = SmartAccountModule = __decorate([
    (0, common_1.Module)({
        imports: [web3auth_module_1.Web3authModule],
        controllers: [smart_account_controller_1.SmartAccountController],
        providers: [smart_account_service_1.SmartAccountService, prisma_service_1.PrismaService],
        exports: [smart_account_service_1.SmartAccountService]
    })
], SmartAccountModule);
