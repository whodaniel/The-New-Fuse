import { Controller, Get, Param, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CommunityApiKeyGuard } from '../../guards/community-api-key.guard';
import { PayPalService } from './paypal.service';

/**
 * BillingController
 *
 * ROUTE ORDER IS CRITICAL: Express/NestJS matches routes in declaration order.
 * `GET membership/me` MUST be declared before `GET membership/:identity` or
 * the literal string "me" is captured as the :identity param and the /me
 * route becomes unreachable.
 *
 * Authentication: protected routes use JwtAuthGuard (TNF-native, reads JWT_SECRET)
 * instead of the Passport AuthGuard('jwt') which is not registered in this module.
 */
@Controller('billing')
export class BillingController {
  constructor(private readonly payPalService: PayPalService) {}

  /**
   * GET /api/billing/membership/me
   *
   * MUST be declared first — before the /:identity wildcard below.
   *
   * Returns the requesting user's membership tier and active status.
   * A new account with no paid subscription resolves to { active: false, tier: 'STARTER' };
   * the frontend routes active:false to /membership (onboarding), not /auth/login.
   */
  @Get('membership/me')
  @UseGuards(JwtAuthGuard)
  async getMyMembership(@Req() req: any) {
    const userId = req?.user?.id || req?.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user is required');
    }
    return this.payPalService.getMembershipForUser(userId);
  }

  /**
   * GET /api/billing/membership/:identity
   *
   * MUST be declared after /membership/me to avoid swallowing the literal "me".
   * Protected by API key (community integrations), not user JWT.
   */
  @Get('membership/:identity')
  @UseGuards(CommunityApiKeyGuard)
  async getMembershipByIdentity(@Param('identity') identity: string) {
    return this.payPalService.getMembershipByIdentity(identity);
  }
}
