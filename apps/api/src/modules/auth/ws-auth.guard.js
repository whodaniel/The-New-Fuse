var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { LoggingService } from '../../packages/api/src/services/logging.service';
let WsAuthGuard = class WsAuthGuard {
    jwtService;
    logger;
    constructor(jwtService, logger) {
        this.jwtService = jwtService;
        this.logger = logger;
    }
    canActivate(context) {
        const client = context.switchToWs().getClient();
        const token = this.extractTokenFromHeader(client);
        if (!token) {
            this.logger.warn('WebSocket connection attempt without token');
            throw new WsException('Unauthorized');
        }
        try {
            const payload = this.jwtService.verify(token);
            // Attach user to socket
            client['user'] = payload;
            return true;
        }
        catch (error) {
            this.logger.error(`WebSocket authentication failed: ${error.message}`);
            throw new WsException('Unauthorized');
        }
    }
    extractTokenFromHeader(client) {
        const auth = client.handshake?.auth?.token;
        return auth ? auth.replace('Bearer ', '') : undefined;
    }
};
WsAuthGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [JwtService, typeof (_a = typeof LoggingService !== "undefined" && LoggingService) === "function" ? _a : Object])
], WsAuthGuard);
export { WsAuthGuard };
//# sourceMappingURL=ws-auth.guard.js.map