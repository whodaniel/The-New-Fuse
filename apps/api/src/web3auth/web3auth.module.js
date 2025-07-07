"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3authModule = void 0;
const common_1 = require("@nestjs/common");
const web3auth_service_1 = require("./web3auth.service");
let Web3authModule = class Web3authModule {
};
exports.Web3authModule = Web3authModule;
exports.Web3authModule = Web3authModule = __decorate([
    (0, common_1.Module)({
        providers: [web3auth_service_1.Web3authService],
        exports: [web3auth_service_1.Web3authService]
    })
], Web3authModule);
