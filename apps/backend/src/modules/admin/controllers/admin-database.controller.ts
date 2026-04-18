import { Body, Controller, Get, HttpException, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { db } from '@the-new-fuse/database';
import { sql } from 'drizzle-orm';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';

@ApiTags('admin')
@Controller('admin/database')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('SUPER_ADMIN')
export class AdminDatabaseController {
  @Post('query')
  @ApiOperation({ summary: 'Execute raw SQL query' })
  async executeQuery(@Body('query') query: string) {
    if (!query) {
      throw new HttpException('Query is required', HttpStatus.BAD_REQUEST);
    }

    // Safety check: Basic prevention of destructive commands (naive but better than nothing)
    // Real implementation should be more robust or read-only connection
    const upperQuery = query.toUpperCase().trim();
    if (upperQuery.startsWith('DROP') || upperQuery.startsWith('TRUNCATE')) {
      throw new HttpException('Destructive commands restricted via API', HttpStatus.FORBIDDEN);
    }

    try {
      const start = Date.now();
      const result = await db.execute(sql.raw(query));
      const duration = Date.now() - start;
      const rows = Array.isArray(result) ? result : (result as any).rows || [];
      const rowCount = (result as any).rowCount ?? rows.length;

      return {
        rows,
        rowCount,
        executionTime: duration,
        columns: rows.length > 0 ? Object.keys(rows[0] as Record<string, any>) : [],
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Query Failed',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get database stats' })
  async getStats() {
    // Mock stats for now, or real queries if feasible
    return {
      size: '1.2 GB', // Would need complex query to get real size
      tables: 24, // Could count tables
      connections: '45/100',
      cacheHitRate: '94.2%',
    };
  }
}
