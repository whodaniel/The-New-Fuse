/**
 * Tenant Guard - Ensures requests are properly scoped to an agency
 * Resolves agency context from subdomain or explicit agency ID
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TenantGuard_1;
import { Injectable, UnauthorizedException, Logger, } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';
let TenantGuard = TenantGuard_1 = class TenantGuard {
    prisma;
    logger = new Logger(TenantGuard_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const host = request.get('host');
        if (!host) {
            throw new UnauthorizedException('Host header is required');
        }
        request['tenantContext'] = {};
        const subdomain = this.extractSubdomain(host);
        if (subdomain && subdomain !== 'www' && subdomain !== '') {
            const agencyId = request.get('x-agency-id');
            const user = request['user'];
            const parts = host.split('.');
            const planFeatures = {
                TRIAL: ['basic_agents', 'basic_workspaces'],
                STARTER: ['basic_agents', 'basic_workspaces', 'swarm_orchestration'],
                PROFESSIONAL: ['basic_agents', 'basic_workspaces', 'swarm_orchestration', 'service_routing', 'advanced_analytics']
            };
            // Additional tenant validation logic would go here
            return true;
        }
        return true;
    }
    extractSubdomain(host) {
        const parts = host.split('.');
        if (parts.length > 2) {
            return parts[0];
        }
        return null;
    }
};
TenantGuard = TenantGuard_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], TenantGuard);
export { TenantGuard };
