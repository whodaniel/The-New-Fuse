var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var Ap2ProtocolController_1;
import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { Ap2ProtocolService } from './ap2-protocol.service';
let Ap2ProtocolController = Ap2ProtocolController_1 = class Ap2ProtocolController {
    ap2ProtocolService;
    logger = new Logger(Ap2ProtocolController_1.name);
    constructor(ap2ProtocolService) {
        this.ap2ProtocolService = ap2ProtocolService;
    }
    getHealth() {
        this.logger.log('AP2 Health Check');
        return 'AP2 Protocol Service is running';
    }
    async createPayment(paymentDetails) {
        this.logger.log('Creating payment via AP2');
        return this.ap2ProtocolService.createPayment(paymentDetails);
    }
};
__decorate([
    Get('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], Ap2ProtocolController.prototype, "getHealth", null);
__decorate([
    Post('payment'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], Ap2ProtocolController.prototype, "createPayment", null);
Ap2ProtocolController = Ap2ProtocolController_1 = __decorate([
    Controller('ap2'),
    __metadata("design:paramtypes", [Ap2ProtocolService])
], Ap2ProtocolController);
export { Ap2ProtocolController };
//# sourceMappingURL=ap2-protocol.controller.js.map