"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ap2ProtocolController = void 0;
const common_1 = require("@nestjs/common");
const ap2_protocol_service_js_1 = require("./ap2-protocol.service.js");
let Ap2ProtocolController = Ap2ProtocolController_1 = class Ap2ProtocolController {
    constructor(ap2ProtocolService) {
        this.ap2ProtocolService = ap2ProtocolService;
        this.logger = new common_1.Logger(Ap2ProtocolController_1.name);
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
exports.Ap2ProtocolController = Ap2ProtocolController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], Ap2ProtocolController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Post)('payment'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], Ap2ProtocolController.prototype, "createPayment", null);
exports.Ap2ProtocolController = Ap2ProtocolController = Ap2ProtocolController_1 = __decorate([
    (0, common_1.Controller)('ap2'),
    __metadata("design:paramtypes", [ap2_protocol_service_js_1.Ap2ProtocolService])
], Ap2ProtocolController);
//# sourceMappingURL=ap2-protocol.controller.js.map