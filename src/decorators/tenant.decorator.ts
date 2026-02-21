/**
 * Tenant Decorator - Extract tenant ID from request tenant context
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Tenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const tenantContext = request.tenantContext;
    
    if (!tenantContext) {
      throw new Error('Tenant context not available. Ensure TenantGuard is applied.');
    }
    
    return tenantContext.agencyId;
  },
);
