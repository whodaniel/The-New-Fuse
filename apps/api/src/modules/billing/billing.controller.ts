import { Controller, Get, Param, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommunityApiKeyGuard } from '../../guards/community-api-key.guard';
import { PayPalService } from './paypal.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly payPalService: PayPalService) {}

  @Get('membership/:identity')
  @UseGuards(CommunityApiKeyGuard)
  async getMembershipByIdentity(@Param('identity') identity: string) {
    return this.payPalService.getMembershipByIdentity(identity);
  }

  @Get('membership/me')
  @UseGuards(AuthGuard('jwt'))
  async getMyMembership(@Req() req: any) {
    const userId = req?.user?.id || req?.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user is required');
    }
    return this.payPalService.getMembershipForUser(userId);
  }
}
