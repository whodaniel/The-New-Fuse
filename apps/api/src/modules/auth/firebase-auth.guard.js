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
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
let FirebaseAuthGuard = class FirebaseAuthGuard {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = request.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            throw new UnauthorizedException('No token provided');
        }
        try {
            const decodedToken = await this.authService.validateFirebaseToken(token);
            request.user = decodedToken;
            return true;
        }
        catch (_error) {
            throw new UnauthorizedException('Invalid token');
        }
    }
};
FirebaseAuthGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof AuthService !== "undefined" && AuthService) === "function" ? _a : Object])
], FirebaseAuthGuard);
export { FirebaseAuthGuard };
//# sourceMappingURL=firebase-auth.guard.js.map