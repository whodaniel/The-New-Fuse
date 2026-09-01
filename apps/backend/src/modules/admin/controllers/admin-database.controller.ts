import { Body, Controller, Get, HttpException, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { db } from '@the-new-fuse/database';
import { sql } from 'drizzle-orm';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import {
  assertReadOnlyInspectionSql,
  ReadOnlySqlViolation,
} from '../utils/read-only-sql.guard';

/**
 * SUPER_ADMIN database inspection endpoint.
 *
 * Architectural stance: unrestricted mutating `sql.raw` is unacceptable.
 * Enforcement is structural (not regex-of-keywords alone):
 *  1) single-statement read-only inspection gate (literals/comments masked)
 *  2) PostgreSQL READ ONLY transaction (writable CTEs / DML fail closed)
 */
@ApiTags('admin')
@Controller('admin/database')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('SUPER_ADMIN')
export class AdminDatabaseController {
  @Post('query')
  @ApiOperation({
    summary: 'Execute read-only inspection SQL',
    description:
      'Accepts a single SELECT/WITH/EXPLAIN/SHOW/TABLE/VALUES statement and runs it inside a READ ONLY transaction. Mutating SQL, stacked statements, and session/transaction control are rejected.',
  })
  async executeQuery(@Body('query') query: string) {
    let safeQuery: string;
    try {
      safeQuery = assertReadOnlyInspectionSql(query);
    } catch (error) {
      if (error instanceof ReadOnlySqlViolation) {
        throw new HttpException(error.message, HttpStatus.FORBIDDEN);
      }
      throw error;
    }

    try {
      const start = Date.now();
      const result = await db.transaction(async (tx) => {
        // Structural DB-level enforcement: even a gate bypass cannot mutate.
        await tx.execute(sql`SET TRANSACTION READ ONLY`);
        return tx.execute(sql.raw(safeQuery));
      });
      const duration = Date.now() - start;
      const rows = Array.isArray(result) ? result : (result as { rows?: unknown[] }).rows || [];
      const rowCount =
        (result as { rowCount?: number }).rowCount ?? (Array.isArray(rows) ? rows.length : 0);

      return {
        rows,
        rowCount,
        executionTime: duration,
        columns:
          Array.isArray(rows) && rows.length > 0
            ? Object.keys(rows[0] as Record<string, unknown>)
            : [],
        readOnly: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Query Failed';
      const status = /read-only|readonly|cannot execute|permission denied/i.test(message)
        ? HttpStatus.FORBIDDEN
        : HttpStatus.BAD_REQUEST;
      throw new HttpException(message, status);
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
