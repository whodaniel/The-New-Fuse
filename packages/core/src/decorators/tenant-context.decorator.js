/**
 * Tenant Context Decorator - Extract tenant context from request
 */
import { createParamDecorator } from '@nestjs/common';
export const TenantContext = createParamDecorator((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantContext;
});
