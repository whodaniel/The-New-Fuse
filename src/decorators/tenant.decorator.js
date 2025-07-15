/**
 * Tenant Decorator - Extract tenant ID from request tenant context
 */
import { createParamDecorator } from '@nestjs/common';
export const Tenant = createParamDecorator((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const tenantContext = request.tenantContext;
    if (!tenantContext) {
        throw new Error('Tenant context not available. Ensure TenantGuard is applied.');
    }
    return tenantContext.agencyId;
});
