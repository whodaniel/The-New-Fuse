"use strict";
/**
 * Tenant Decorator - Extract tenant ID from request tenant context
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tenant = void 0;
const common_1 = require("@nestjs/common");
exports.Tenant = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const tenantContext = request.tenantContext;
    if (!tenantContext) {
        throw new Error('Tenant context not available. Ensure TenantGuard is applied.');
    }
    return tenantContext.agencyId;
});
//# sourceMappingURL=tenant.decorator.js.map