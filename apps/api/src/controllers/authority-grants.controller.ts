/**
 * Authority Grants NestJS Controller
 *
 * Implements endpoints for Authority Lane grant management:
 * - POST /authority/grants (issue grant)
 * - POST /authority/grants/renew (renew grant)
 * - POST /authority/grants/revoke (revoke grant)
 * - GET /authority/resolve/:subjectDid (resolve effective role)
 * - GET /authority/grants/:id (fetch grant details)
 *
 * Invariant: Rejection reasons from issueGrant/custody checks are returned verbatim.
 *
 * @see docs/protocols/reports/AUTHORITY_GRANTS_WIRING_BRIEF.md
 */

import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  IssueAuthorityGrantDto,
  RenewAuthorityGrantDto,
  RevokeAuthorityGrantDto,
} from '../dto/authority-grants.dto';
import {
  AuthLevel,
  RateLimitTier,
  RequireAuthLevel,
  SetRateLimitTier,
} from '../guards/secure-auth.guard';
import { AuthorityGrantsService } from '../services/authority-grants.service';

@ApiTags('authority')
@Controller('authority')
@RequireAuthLevel(AuthLevel.PUBLIC)
@SetRateLimitTier(RateLimitTier.API)
export class AuthorityGrantsController {
  constructor(private readonly authorityService: AuthorityGrantsService) {}

  @Post('grants')
  @ApiOperation({ summary: 'Issue a signed authority grant' })
  @ApiResponse({ status: 201, description: 'Grant issued and persisted' })
  @ApiResponse({ status: 400, description: 'Validation failed or malformed request' })
  @ApiResponse({ status: 403, description: 'Caller not authorized to issue this grant or custody unavailable' })
  async issueGrant(@Body() dto: IssueAuthorityGrantDto) {
    try {
      const grant = await this.authorityService.issueGrant(dto);
      return { ok: true, grant };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = error?.message || 'Failed to issue authority grant';
      const status =
        message.includes('Refusing to issue') ||
        message.includes('cannot issue') ||
        message.includes('Authority custody')
          ? HttpStatus.FORBIDDEN
          : HttpStatus.BAD_REQUEST;
      throw new HttpException(message, status);
    }
  }

  @Post('grants/renew')
  @ApiOperation({ summary: 'Renew an authority grant by creating a new row' })
  @ApiResponse({ status: 200, description: 'New grant row issued' })
  @ApiResponse({ status: 400, description: 'Grant not found or invalid' })
  @ApiResponse({ status: 403, description: 'Caller not authorized to renew' })
  async renewGrant(@Body() dto: RenewAuthorityGrantDto) {
    try {
      const grant = await this.authorityService.renewGrant(dto);
      return { ok: true, grant };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = error?.message || 'Failed to renew authority grant';
      const status =
        message.includes('Refusing to') ||
        message.includes('cannot') ||
        message.includes('Authority custody')
          ? HttpStatus.FORBIDDEN
          : HttpStatus.BAD_REQUEST;
      throw new HttpException(message, status);
    }
  }

  @Post('grants/revoke')
  @ApiOperation({ summary: 'Revoke an existing authority grant' })
  @ApiResponse({ status: 200, description: 'Grant revoked' })
  @ApiResponse({ status: 400, description: 'Grant not found or invalid' })
  @ApiResponse({ status: 403, description: 'Caller not authorized to revoke' })
  async revokeGrant(@Body() dto: RevokeAuthorityGrantDto) {
    try {
      const grant = await this.authorityService.revokeGrant(dto);
      return { ok: true, grant };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = error?.message || 'Failed to revoke authority grant';
      const status =
        message.includes('Refusing to') ||
        message.includes('cannot') ||
        message.includes('Authority custody')
          ? HttpStatus.FORBIDDEN
          : HttpStatus.BAD_REQUEST;
      throw new HttpException(message, status);
    }
  }

  @Get('resolve/:subjectDid')
  @ApiOperation({ summary: 'Resolve effective authority role for a subject' })
  @ApiResponse({ status: 200, description: 'Resolved role and verification details' })
  async resolveRole(@Param('subjectDid') subjectDid: string) {
    try {
      const result = await this.authorityService.resolveRole(subjectDid);
      return { ok: true, result };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message || 'Failed to resolve authority role',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('grants/:id')
  @ApiOperation({ summary: 'Fetch grant details by ID' })
  @ApiResponse({ status: 200, description: 'Grant details' })
  @ApiResponse({ status: 404, description: 'Grant not found' })
  async getGrantById(@Param('id') id: string) {
    try {
      const grant = await this.authorityService.getGrantById(id);
      if (!grant) {
        throw new HttpException(`Authority grant ${id} not found`, HttpStatus.NOT_FOUND);
      }
      return { ok: true, grant };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error?.message || 'Failed to get authority grant',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
