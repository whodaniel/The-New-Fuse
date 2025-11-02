/**
 * Tenant Context Decorator - Extract tenant context from request
 */

import { createParamDecorator, ExecutionContext  } from '@nestjs/common';
createParamDecorator(): any {
  (data: unknown, ctx: ExecutionContext) => {
const request = ctx.switchToHttp().getRequest();
  }    return request.tenantContext;
  },
);