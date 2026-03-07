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

      return {
        rows: result.rows, // For Postgres, it's usually rows (array of arrays or objects depending on driver)
        // pg driver 'result' structure: { rows: [...], rowCount: n, command: 'SELECT', ... }
        // Drizzle execute returns the driver result directly
        rowCount: result.rowCount,
        executionTime: duration,
        // We might need to extract columns if rows are objects
        columns: result.rows.length > 0 ? Object.keys(result.rows[0]) : [],
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
