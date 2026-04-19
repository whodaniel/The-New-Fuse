import { Body, Controller, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CreateAgentGrantDto } from '../dto/agent-grants.dto';
import { JwtAuth, RateLimitTier, SetRateLimitTier } from '../guards/secure-auth.guard';
import { AgentApiGrantsService } from '../services/agent-api-grants.service';

@ApiTags('agent-grants')
@Controller('agent-grants')
@JwtAuth()
@SetRateLimitTier(RateLimitTier.API)
export class AgentGrantsController {
  constructor(private readonly grantsService: AgentApiGrantsService) {}

  @Get()
  @ApiOperation({ summary: 'List API grants for current user' })
  @ApiResponse({ status: 200, description: 'List of grants' })
  async list(@CurrentUser() user: { id: string }) {
    if (!user || !user.id) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    try {
      return await this.grantsService.listForUser(user.id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to list grants',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create scoped API grant for an agent' })
  @ApiResponse({ status: 201, description: 'Grant created with bearer token' })
  async create(@CurrentUser() user: { id: string }, @Body() dto: CreateAgentGrantDto) {
    if (!user || !user.id) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    try {
      return await this.grantsService.createForUser(user.id, dto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to create grant',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke an API grant' })
  @ApiResponse({ status: 200, description: 'Grant revoked' })
  async revoke(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    if (!user || !user.id) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    try {
      return await this.grantsService.revokeForUser(user.id, id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to revoke grant',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/rotate')
  @ApiOperation({ summary: 'Rotate grant token (invalidates prior tokens)' })
  @ApiResponse({ status: 200, description: 'New token issued' })
  async rotate(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    if (!user || !user.id) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    try {
      return await this.grantsService.rotateForUser(user.id, id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to rotate token',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
