"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var JwtAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const utils_1 = require("@the-new-fuse/utils");
let JwtAuthGuard = JwtAuthGuard_1 = class JwtAuthGuard {
    logger = new common_1.Logger(JwtAuthGuard_1.name);
    canActivate(context) {
        try {
            // Simple implementation - in a real app you'd validate JWT token here
            const request = context.switchToHttp().getRequest();
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new common_1.UnauthorizedException('No token provided');
            }
            // For now, just check if token exists
            // In a real implementation, you'd verify the JWT token
            const token = authHeader.substring(7);
            if (!token) {
                throw new common_1.UnauthorizedException('Invalid token');
            }
            return true;
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            const err = (0, utils_1.toError)(error);
            this.logger.error(`JWT auth guard error: ${err.message}`, err.stack);
            throw new common_1.UnauthorizedException('Authentication failed');
        }
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = JwtAuthGuard_1 = __decorate([
    (0, common_1.Injectable)()
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map