import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { hasAuthorizationLevel } from '../auth/auth-policy';
import { PayPalService } from '../modules/billing/paypal.service';

type MembershipPrincipal = {
  id?: string;
  sub?: string;
  email?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
};

@Injectable()
export class MemberOrAdminGuard implements CanActivate {
  constructor(private readonly payPalService: PayPalService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: MembershipPrincipal }>();
    const principal: MembershipPrincipal = request.user || {};
    const userId = principal.id || principal.sub;

    if (!userId) {
      throw new UnauthorizedException('Authenticated user is required');
    }

    const isAdmin = hasAuthorizationLevel(principal, 'admin');
    if (isAdmin) {
      return true;
    }

    const membership = await this.payPalService.getMembershipForUser(userId);
    if (!membership.active) {
      throw new ForbiddenException('This action requires an active paid membership');
    }

    return true;
  }
}

export function MemberOrAdmin() {
  return applyDecorators(UseGuards(AuthGuard('jwt'), MemberOrAdminGuard));
}
