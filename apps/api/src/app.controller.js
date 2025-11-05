var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
let AppController = class AppController {
    constructor() { }
    getStatus() {
        return {
            message: 'The New Fuse API is running',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
    }
    getHealth() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        };
    }
};
__decorate([
    Get(),
    ApiOperation({ summary: 'Get API status' }),
    ApiResponse({ status: 200, description: 'API is running' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getStatus", null);
__decorate([
    Get('health'),
    ApiOperation({ summary: 'Health check endpoint' }),
    ApiResponse({ status: 200, description: 'API health status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getHealth", null);
AppController = __decorate([
    ApiTags('app'),
    Controller(),
    __metadata("design:paramtypes", [])
], AppController);
export { AppController };
//# sourceMappingURL=app.controller.js.map