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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityApiKeyGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let CommunityApiKeyGuard = class CommunityApiKeyGuard {
    constructor(configService) {
        this.configService = configService;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const expected = this.configService.get('COMMUNITY_API_KEY')?.trim();
        if (!expected) {
            throw new common_1.UnauthorizedException('Community API key is not configured');
        }
        const provided = request.get('x-community-api-key') || '';
        const normalized = Array.isArray(provided) ? provided[0] : provided;
        if (!normalized || normalized.trim() !== expected) {
            throw new common_1.UnauthorizedException('Invalid Community API key');
        }
        return true;
    }
};
exports.CommunityApiKeyGuard = CommunityApiKeyGuard;
exports.CommunityApiKeyGuard = CommunityApiKeyGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CommunityApiKeyGuard);
//# sourceMappingURL=community-api-key.guard.js.map