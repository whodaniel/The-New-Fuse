var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var Ap2ProtocolService_1;
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';
let Ap2ProtocolService = Ap2ProtocolService_1 = class Ap2ProtocolService {
    httpService;
    logger = new Logger(Ap2ProtocolService_1.name);
    pythonServerUrl = 'http://localhost:8000'; // Assuming the Python server runs on port 8000
    constructor(httpService) {
        this.httpService = httpService;
        this.logger.log('AP2 Protocol Service Initialized');
    }
    async createPayment(paymentDetails) {
        try {
            const response = await firstValueFrom(this.httpService.post(`${this.pythonServerUrl}/create_payment`, paymentDetails));
            return response.data;
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                this.logger.error('Error creating payment:', error.response?.data || error.message);
            }
            else {
                this.logger.error('An unknown error occurred', error);
            }
            throw error;
        }
    }
};
Ap2ProtocolService = Ap2ProtocolService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [HttpService])
], Ap2ProtocolService);
export { Ap2ProtocolService };
//# sourceMappingURL=ap2-protocol.service.js.map