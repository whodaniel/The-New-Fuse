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
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
let WsAuthGuard = class WsAuthGuard {
    jwtService;
    configService;
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
    }
    canActivate(context) {
        try {
            const client = context.switchToWs().getClient();
            const token = client.handshake.auth.token || client.handshake.headers.authorization;
            if (!token) {
                throw new WsException('No token provided');
            }
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET'),
            });
            client.user = payload;
            return true;
        }
        catch {
            throw new WsException('Invalid token');
        }
    }
};
WsAuthGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [JwtService,
        ConfigService])
], WsAuthGuard);
export { WsAuthGuard };
//# sourceMappingURL=ws-auth.guard.js.map