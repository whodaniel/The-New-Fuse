var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
let AppService = class AppService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    getHello() {
        return 'Hello from The New Fuse API!';
    }
    getVersion() {
        return this.configService.get('APP_VERSION', '1.0.0');
    }
    getEnvironment() {
        return this.configService.get('NODE_ENV', 'development');
    }
};
AppService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], AppService);
export { AppService };
//# sourceMappingURL=app.service.js.map