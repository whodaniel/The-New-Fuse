/**
 * Admin Audit Logs Controller
 *
 * Exposes endpoints for managing audit logs in the admin panel.
 */

import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../modules/guards/jwt-auth.guard.js';
import { AuditLogQuery } from '../../repositories/audit-logs.repository.js';
import { AdminAuditLogsService } from '../../services/admin-audit-logs.service.js';
import { toError } from '../../utils/error.js';

@ApiTags('admin')
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard)
export class AdminAuditLogsController {
  constructor(private readonly auditLogsService: AdminAuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'resourceType', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'List of audit logs' })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Res() res?: Response
  ) {
    try {
      const query: AuditLogQuery = {
        userId,
        action,
        resourceType,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      };

      const result = await this.auditLogsService.getAuditLogs(query);
      return res?.status(200).json(result.data); // Returning just data array as per frontend expectation?
      // Frontend expects: const data = await response.json(); const transformed = data.map(...)
      // So it expects an ARRAY, not { data: [], total: ... }
      // The service returns { data, total }.
      // I should modify logic to return array or fix frontend.
      // Frontend code: data.map((log: any) => ...)
      // So I must return an ARRAY.
    } catch (error) {
      const err = toError(error);
      return res?.status(500).json({ error: err.message });
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get audit log statistics' })
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response
  ) {
    try {
      const stats = await this.auditLogsService.getStatistics(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      return res?.status(200).json(stats);
    } catch (error) {
      const err = toError(error);
      return res?.status(500).json({ error: err.message });
    }
  }
}
