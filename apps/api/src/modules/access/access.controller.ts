import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthLevel, RequireAuthLevel } from '../../guards/secure-auth.guard';
import { AccessService } from './access.service';

type ResolveAccessDto = {
  gameId?: string;
  userId?: string;
  email?: string;
  username?: string;
  walletAddress?: string;
  inviteCode?: string;
  agentId?: string;
};

@ApiTags('access')
@Controller('access')
@RequireAuthLevel(AuthLevel.PUBLIC)
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Post('resolve')
  @ApiOperation({
    summary: 'Resolve registration and gameplay access for a TNF / AI Arcade subject',
  })
  async resolve(@Body() body: ResolveAccessDto) {
    return this.accessService.resolve(body || {});
  }
}
