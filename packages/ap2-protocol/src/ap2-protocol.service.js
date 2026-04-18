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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var Ap2ProtocolService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ap2ProtocolService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
// @ts-ignore
const rxjs_1 = require("rxjs");
const axios_2 = __importDefault(require("axios"));
let Ap2ProtocolService = Ap2ProtocolService_1 = class Ap2ProtocolService {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger(Ap2ProtocolService_1.name);
        this.pythonServerUrl = 'http://localhost:8000'; // Assuming the Python server runs on port 8000
        this.logger.log('AP2 Protocol Service Initialized');
    }
    async createPayment(paymentDetails) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.pythonServerUrl}/create_payment`, paymentDetails));
            return response.data;
        }
        catch (error) {
            if (axios_2.default.isAxiosError(error)) {
                this.logger.error('Error creating payment:', error.response?.data || error.message);
            }
            else {
                this.logger.error('An unknown error occurred', error);
            }
            throw error;
        }
    }
};
exports.Ap2ProtocolService = Ap2ProtocolService;
exports.Ap2ProtocolService = Ap2ProtocolService = Ap2ProtocolService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], Ap2ProtocolService);
//# sourceMappingURL=ap2-protocol.service.js.map