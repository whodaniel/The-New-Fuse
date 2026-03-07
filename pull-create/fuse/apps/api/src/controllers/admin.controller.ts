import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { Permission } from '@the-new-fuse/types';
import { execFileSync } from 'child_process';
import {
  AdminOnly,
  AuditLog,
  HighSecurity,
  RateLimitTier,
  SecureAuthGuard,
  SetRateLimitTier,
} from '../guards/secure-auth.guard';
import { AuditService } from '../services/audit.service';
import { MetricsService } from '../services/metrics.service';
import { RoleService } from '../services/role.service';

/**
 * Admin Controller
 *
 * Handles all administrative operations including system management, role-based
 * access control, audit logging, and system monitoring. This controller provides
 * privileged access to system administration functions and is heavily protected.
 *
 * The controller includes:
 * - System script execution capabilities
 * - Role and permission management
 * - Audit log retrieval and analysis
 * - System metrics and monitoring
 * - High-security administrative operations
 *
 * All endpoints require:
 * - Admin-level authentication
 * - Rate limiting to prevent abuse
 * - Comprehensive audit logging
 * - High-security request validation
 *
 * @warning This controller contains privileged operations that can affect
 * the entire system. Use with extreme caution and ensure proper authorization.
 *
 * @example
 * // Get all system roles
 * GET /admin/roles
 *
 * @example
 * // Run system maintenance script
 * POST /admin/run-script
 * {
 *   "script": "cleanup:temp-files"
 * }
 *
 * @example
 * // Update role permissions
 * PUT /admin/roles/role123/permissions
 * {
 *   "permissions": ["read:users", "write:users", "admin:system"]
 * }
 */
@Controller('admin')
@UseGuards(SecureAuthGuard)
@AdminOnly()
@SetRateLimitTier(RateLimitTier.ADMIN)
@AuditLog()
@HighSecurity()
export class AdminController {
  /**
   * Constructor for AdminController
   *
   * @param roleService - Service for managing roles and permissions
   * @param auditService - Service for audit logging and compliance
   * @param metricsService - Service for system metrics and monitoring
   *
   * @example
   * const controller = new AdminController(roleService, auditService, metricsService);
   */
  constructor(
    private readonly roleService: RoleService,
    private readonly auditService: AuditService,
    private readonly metricsService: MetricsService
  ) {}

  /**
   * Execute system maintenance script
   *
   * Executes predefined system maintenance scripts using the Fuse CLI.
   * This is a highly privileged operation that can perform system-level
   * maintenance tasks. Only whitelisted scripts can be executed for security.
   *
   * @param script - Script identifier to execute
   *
   * @returns Promise containing execution result
   * @returns.success - Whether script execution was successful
   * @returns.output - Script output (stdout)
   * @returns.error - Error message if execution failed
   * @returns.executedAt - Execution timestamp
   * @returns.executionTime - Script execution time in milliseconds
   *
   * @throws ForbiddenException - When script is not whitelisted
   * @throws BadRequestException - When script parameter is invalid
   * @throws InternalServerErrorException - When script execution fails
   *
   * @api
   * POST /admin/run-script
   * @requiresAuth - Admin-level bearer token
   * @requiresPermission - admin:system
   * @rateLimit - 10 requests per hour
   *
   * @securityWarning This endpoint can execute arbitrary system commands.
   * Only whitelisted scripts are permitted. All executions are audited.
   *
   * @example
   * const result = await adminController.runScript('cleanup:temp-files');
   *
   * @example
   * // Successful execution
   * {
   *   "success": true,
   *   "output": "Cleaned 1,234 temporary files",
   *   "executedAt": "2025-11-05T02:17:55.000Z",
   *   "executionTime": 1250
   * }
   *
   * @example
   * // Failed execution
   * {
   *   "success": false,
   *   "error": "Script execution failed: permission denied",
   *   "executedAt": "2025-11-05T02:17:55.000Z",
   *   "executionTime": 500
   * }
   */
  @Post('run-script')
  async runScript(@Body('script') script: string) {
    // SECURITY: use strict script -> argv mapping to avoid shell interpolation.
    const ALLOWED_SCRIPT_ARGS: Record<string, readonly string[]> = {
      'cleanup:temp-files': ['cleanup:temp-files'],
      'db:migrate': ['db:migrate'],
      'db:migrate:status': ['db:migrate:status'],
      'cache:clear': ['cache:clear'],
      'cache:warmup': ['cache:warmup'],
      'maintenance:enable': ['maintenance:enable'],
      'maintenance:disable': ['maintenance:disable'],
      'logs:rotate': ['logs:rotate'],
      'backup:create': ['backup:create'],
    };

    if (!script || typeof script !== 'string') {
      return { success: false, error: 'Invalid script parameter' };
    }

    const normalizedScript = script.trim();
    const scriptArgs = ALLOWED_SCRIPT_ARGS[normalizedScript];
    if (!scriptArgs) {
      return {
        success: false,
        error: `Script '${normalizedScript}' is not whitelisted. Allowed scripts: ${Object.keys(ALLOWED_SCRIPT_ARGS).join(', ')}`,
      };
    }

    try {
      const startTime = Date.now();
      const output = execFileSync('pnpm', ['fuse', ...scriptArgs], {
        encoding: 'utf-8',
        timeout: 60000, // 60 second timeout
        cwd: process.cwd(),
      });
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output,
        executedAt: new Date().toISOString(),
        executionTime,
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get all system roles
   *
   * Retrieves a complete list of all roles defined in the system along with
   * their associated permissions and metadata. This is used for role management
   * and access control administration.
   *
   * @returns Promise containing array of all roles
   * @returns[].id - Unique role identifier
   * @returns[].name - Role name
   * @returns[].description - Role description
   * @returns[].permissions - Array of permissions associated with role
   * @returns[].isSystem - Whether this is a system-defined role
   * @returns[].createdAt - Role creation timestamp
   * @returns[].updatedAt - Last update timestamp
   * @returns[].userCount - Number of users assigned to this role
   *
   * @throws InternalServerErrorException - When unable to fetch roles
   *
   * @api
   * GET /admin/roles
   * @requiresAuth - Admin-level bearer token
   * @requiresPermission - admin:roles
   * @rateLimit - 100 requests per hour
   *
   * @example
   * const roles = await adminController.getRoles();
   *
   * @example
   * // Successful response
   * [
   *   {
   *     "id": "role123",
   *     "name": "Administrator",
   *     "description": "Full system access",
   *     "permissions": ["*"],
   *     "isSystem": true,
   *     "createdAt": "2025-01-01T00:00:00.000Z",
   *     "updatedAt": "2025-01-01T00:00:00.000Z",
   *     "userCount": 3
   *   },
   *   {
   *     "id": "role456",
   *     "name": "User Manager",
   *     "description": "Can manage user accounts",
   *     "permissions": ["read:users", "write:users", "delete:users"],
   *     "isSystem": false,
   *     "createdAt": "2025-02-15T10:30:00.000Z",
   *     "updatedAt": "2025-03-01T14:20:00.000Z",
   *     "userCount": 12
   *   }
   * ]
   */
  @Get('roles')
  async getRoles() {
    return this.roleService.getAllRoles();
  }

  /**
   * Update role permissions
   *
   * Modifies the permission set associated with a specific role. This is a
   * sensitive operation that can significantly impact system security. Changes
   * are immediately applied and audit logged.
   *
   * @param roleId - Unique role identifier
   * @param permissions - New permission set for the role
   *
   * @returns Promise containing updated role details
   * @returns.id - Role identifier
   * @returns.name - Role name
   * @returns.permissions - Updated permission set
   * @returns.updatedAt - Update timestamp
   * @returns.affectedUsers - Number of users affected by this change
   *
   * @throws NotFoundException - When role is not found
   * @throws BadRequestException - When permissions are invalid
   * @throws ForbiddenException - When attempting to modify protected system roles
   *
   * @api
   * PUT /admin/roles/:roleId/permissions
   * @requiresAuth - Admin-level bearer token
   * @requiresPermission - admin:roles
   * @rateLimit - 50 requests per hour
   *
   * @securityWarning Changing role permissions can immediately affect user access.
   * Verify changes before applying to prevent security breaches.
   *
   * @example
   * const updatedRole = await adminController.updateRolePermissions('role456', [
   *   'read:users',
   *   'write:users',
   *   'admin:agents'
   * ]);
   *
   * @example
   * // Successful response
   * {
   *   "id": "role456",
   *   "name": "User Manager",
   *   "permissions": [
   *     "read:users",
   *     "write:users",
   *     "admin:agents"
   *   ],
   *   "updatedAt": "2025-11-05T02:17:55.000Z",
   *   "affectedUsers": 12
   * }
   */
  @Put('roles/:roleId/permissions')
  async updateRolePermissions(
    @Param('roleId') roleId: string,
    @Body('permissions') permissions: Permission[]
  ) {
    return this.roleService.updateRolePermissions(roleId, permissions);
  }

  /**
   * Get audit logs
   *
   * Retrieves comprehensive audit logs for system compliance and security
   * monitoring. This includes all administrative actions, security events,
   * and user activities. Logs are filtered based on admin access level.
   *
   * @returns Promise containing audit log entries
   * @returns[].id - Unique log entry identifier
   * @returns[].timestamp - Event timestamp
   * @returns[].userId - User who performed the action
   * @returns[].action - Action that was performed
   * @returns[].resource - Resource affected by the action
   * @returns[].details - Additional action details
   * @returns[].ipAddress - IP address of the request
   * @returns[].userAgent - User agent string
   * @returns[].severity - Log severity level
   *
   * @throws InternalServerErrorException - When unable to fetch audit logs
   *
   * @api
   * GET /admin/audit-logs
   * @requiresAuth - Admin-level bearer token
   * @requiresPermission - admin:audit
   * @rateLimit - 200 requests per hour
   *
   * @compliance This endpoint is critical for compliance with security
   * standards. Ensure proper access controls and data retention policies.
   *
   * @example
   * const auditLogs = await adminController.getAuditLogs();
   *
   * @example
   * // Successful response
   * [
   *   {
   *     "id": "log123",
   *     "timestamp": "2025-11-05T02:15:30.000Z",
   *     "userId": "admin123",
   *     "action": "role_permission_updated",
   *     "resource": "role456",
   *     "details": {
   *       "previousPermissions": ["read:users", "write:users"],
   *       "newPermissions": ["read:users", "write:users", "admin:agents"],
   *       "reason": "Enhanced agent management capabilities"
   *     },
   *     "ipAddress": "192.168.1.100",
   *     "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
   *     "severity": "medium"
   *   }
   * ]
   */
  @Get('audit-logs')
  async getAuditLogs() {
    return this.auditService.getLogs();
  }

  /**
   * Get system metrics
   *
   * Retrieves comprehensive system performance and health metrics including
   * resource usage, performance indicators, and system status. This data is
   * essential for system monitoring and capacity planning.
   *
   * @returns Promise containing system metrics
   * @returns.cpu - CPU usage statistics
   * @returns.memory - Memory usage statistics
   * @returns.disk - Disk usage and I/O statistics
   * @returns.network - Network traffic statistics
   * @returns.database - Database performance metrics
   * @returns.services - Service status and health
   * @returns.agents - Agent system metrics
   * @returns.users - User activity metrics
   * @returns.timestamp - Metrics collection timestamp
   *
   * @throws InternalServerErrorException - When unable to collect metrics
   *
   * @api
   * GET /admin/metrics
   * @requiresAuth - Admin-level bearer token
   * @requiresPermission - admin:metrics
   * @rateLimit - 300 requests per hour
   *
   * @example
   * const metrics = await adminController.getSystemMetrics();
   *
   * @example
   * // Successful response
   * {
   *   "cpu": {
   *     "usage": 45.2,
   *     "loadAverage": [1.2, 0.8, 0.6],
   *     "processCount": 127
   *   },
   *   "memory": {
   *     "used": 2147483648,
   *     "total": 8589934592,
   *     "percentage": 25.0,
   *     "available": 6442450944
   *   },
   *   "disk": {
   *     "used": 53687091200,
   *     "total": 107374182400,
   *     "percentage": 50.0,
   *     "ioStats": {
   *       "readBytes": 1234567890,
   *       "writeBytes": 987654321
   *     }
   *   },
   *   "network": {
   *     "bytesIn": 4567890123,
   *     "bytesOut": 2345678901,
   *     "connections": 142
   *   },
   *   "database": {
   *     "connections": 25,
   *     "queryTime": 12.5,
   *     "slowQueries": 2
   *   },
   *   "services": {
   *     "api": "healthy",
   *     "websocket": "healthy",
   *     "auth": "healthy"
   *   },
   *   "agents": {
   *     "total": 45,
   *     "active": 38,
   *     "inactive": 7,
   *     "avgResponseTime": 1.8
   *   },
   *   "users": {
   *     "total": 1247,
   *     "active24h": 89,
   *     "newToday": 12
   *   },
   *   "timestamp": "2025-11-05T02:17:55.000Z"
   * }
   */
  @Get('metrics')
  async getSystemMetrics() {
    return this.metricsService.getSystemMetrics();
  }
}
