"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuditLoggerService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLoggerService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const config_1 = require("@nestjs/config");
let AuditLoggerService = AuditLoggerService_1 = class AuditLoggerService {
    prisma;
    configService;
    logger = new common_1.Logger(AuditLoggerService_1.name);
    MAX_DETAILS_SIZE = 10000; // Maximum size for details JSON
    RETENTION_DAYS = 90; // Keep audit logs for 90 days
    // Security thresholds for alerts
    FAILED_LOGIN_THRESHOLD = 10; // per hour
    SUSPICIOUS_ACTIVITY_THRESHOLD = 20; // per hour
    BRUTE_FORCE_THRESHOLD = 50; // per day
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    /**
     * Log an authentication event
     */
    async logAuthEvent(entry) {
        const auditEntry = {
            ...entry,
            timestamp: new Date(),
            category: 'auth',
            details: this.sanitizeDetails(entry.details),
        };
        try {
            // Store in database
            await this.createAuditLog(auditEntry);
            // Check for security alerts
            await this.checkForSecurityAlerts(auditEntry);
            // Log to application logger based on severity
            this.logToConsole(auditEntry);
        }
        catch (error) {
            this.logger.error('Failed to log audit event', {
                error: error.message,
                entry: this.sanitizeForLogging(auditEntry),
            });
        }
    }
    /**
     * Log user login attempt
     */
    async logLoginAttempt(email, userId, success, ipAddress, userAgent, details = {}) {
        await this.logAuthEvent({
            userId,
            action: 'login_attempt',
            resource: 'user_session',
            details: {
                email,
                authMethod: details.authMethod || 'email_password',
                deviceFingerprint: details.deviceFingerprint,
                ...details,
            },
            ipAddress,
            userAgent,
            severity: success ? 'low' : 'medium',
            outcome: success ? 'success' : 'failure',
        });
    }
    /**
     * Log user registration
     */
    async logUserRegistration(userId, email, ipAddress, userAgent, details = {}) {
        await this.logAuthEvent({
            userId,
            action: 'user_registration',
            resource: 'user_account',
            details: {
                email,
                registrationMethod: details.method || 'email',
                emailVerified: details.emailVerified || false,
                ...details,
            },
            ipAddress,
            userAgent,
            severity: 'low',
            outcome: 'success',
        });
    }
    /**
     * Log password change
     */
    async logPasswordChange(userId, success, ipAddress, userAgent, details = {}) {
        await this.logAuthEvent({
            userId,
            action: 'password_change',
            resource: 'user_credentials',
            details: {
                changeMethod: details.method || 'authenticated',
                ...details,
            },
            ipAddress,
            userAgent,
            severity: success ? 'medium' : 'high',
            outcome: success ? 'success' : 'failure',
        });
    }
    /**
     * Log password reset request
     */
    async logPasswordResetRequest(email, ipAddress, userAgent, details = {}) {
        await this.logAuthEvent({
            action: 'password_reset_request',
            resource: 'user_credentials',
            details: {
                email,
                resetMethod: details.method || 'email',
                ...details,
            },
            ipAddress,
            userAgent,
            severity: 'medium',
            outcome: 'success',
        });
    }
    /**
     * Log token refresh
     */
    async logTokenRefresh(userId, success, ipAddress, userAgent, details = {}) {
        await this.logAuthEvent({
            userId,
            action: 'token_refresh',
            resource: 'access_token',
            details: {
                tokenType: details.tokenType || 'refresh',
                deviceInfo: details.deviceInfo,
                ...details,
            },
            ipAddress,
            userAgent,
            severity: success ? 'low' : 'medium',
            outcome: success ? 'success' : 'failure',
        });
    }
    /**
     * Log logout event
     */
    async logLogout(userId, sessionType, ipAddress, userAgent, details = {}) {
        await this.logAuthEvent({
            userId,
            action: 'logout',
            resource: 'user_session',
            details: {
                sessionType,
                logoutMethod: details.method || 'user_initiated',
                ...details,
            },
            ipAddress,
            userAgent,
            severity: 'low',
            outcome: 'success',
        });
    }
    /**
     * Log suspicious activity
     */
    async logSuspiciousActivity(userId, activityType, ipAddress, description, details = {}, userAgent) {
        await this.logAuthEvent({
            userId,
            action: 'suspicious_activity',
            resource: 'security',
            details: {
                activityType,
                description,
                ...details,
            },
            ipAddress,
            userAgent,
            severity: 'high',
            outcome: 'blocked',
        });
        // Create security alert
        await this.createSecurityAlert({
            type: 'suspicious_activity',
            userId,
            ipAddress,
            description,
            severity: 'high',
            details: {
                activityType,
                ...details,
            },
            timestamp: new Date(),
        });
    }
    /**
     * Log rate limit exceeded
     */
    async logRateLimitExceeded(endpoint, identifier, ipAddress, details = {}) {
        await this.logAuthEvent({
            action: 'rate_limit_exceeded',
            resource: 'api_endpoint',
            details: {
                endpoint,
                identifier,
                rateLimitRule: details.ruleName,
                requestCount: details.requestCount,
                windowMs: details.windowMs,
                ...details,
            },
            ipAddress,
            severity: 'medium',
            outcome: 'blocked',
        });
    }
    /**
     * Search audit logs with advanced filtering
     */
    async searchAuditLogs(query) {
        const limit = Math.min(query.limit || 100, 1000); // Max 1000 results
        const offset = query.offset || 0;
        const where = {};
        if (query.userId)
            where.userId = query.userId;
        if (query.action)
            where.type = { contains: query.action, mode: 'insensitive' };
        if (query.category)
            where.type = { contains: query.category, mode: 'insensitive' };
        if (query.ipAddress)
            where.details = { path: ['ipAddress'], equals: query.ipAddress };
        if (query.startDate || query.endDate) {
            where.createdAt = {};
            if (query.startDate)
                where.createdAt.gte = query.startDate;
            if (query.endDate)
                where.createdAt.lte = query.endDate;
        }
        const [logs, total] = await Promise.all([
            this.prisma.authEvent.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
                select: {
                    id: true,
                    userId: true,
                    type: true,
                    details: true,
                    createdAt: true,
                },
            }),
            this.prisma.authEvent.count({ where }),
        ]);
        const auditLogs = logs.map(log => ({
            id: log.id,
            userId: log.userId,
            action: log.type,
            resource: this.extractResourceFromDetails(log.details),
            details: log.details,
            ipAddress: log.details?.ipAddress,
            userAgent: log.details?.userAgent,
            timestamp: log.createdAt,
            severity: log.details?.severity || 'low',
            category: 'auth',
            outcome: log.details?.outcome || 'success',
        }));
        return {
            logs: auditLogs,
            total,
            hasMore: offset + limit < total,
        };
    }
    /**
     * Get security alerts for a time period
     */
    async getSecurityAlerts(startDate, endDate, severity) {
        const where = {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            type: 'security_alert',
        };
        if (severity) {
            where.details = {
                path: ['severity'],
                equals: severity,
            };
        }
        const alerts = await this.prisma.authEvent.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        return alerts.map(alert => ({
            type: alert.details.alertType || 'suspicious_activity',
            userId: alert.userId,
            ipAddress: alert.details.ipAddress,
            description: alert.details.description,
            severity: alert.details.severity || 'medium',
            details: alert.details.alertDetails || {},
            timestamp: alert.createdAt,
        }));
    }
    /**
     * Generate security report for a user
     */
    async generateUserSecurityReport(userId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const events = await this.prisma.authEvent.findMany({
            where: {
                userId,
                createdAt: { gte: startDate },
            },
            orderBy: { createdAt: 'desc' },
        });
        const failedLogins = events.filter(e => e.type === 'login_attempt' && e.details?.outcome === 'failure').length;
        const successfulLogins = events.filter(e => e.type === 'login_attempt' && e.details?.outcome === 'success').length;
        const passwordChanges = events.filter(e => e.type === 'password_change').length;
        const suspiciousActivities = events.filter(e => e.type === 'suspicious_activity').length;
        const uniqueIPs = Array.from(new Set(events.map(e => e.details?.ipAddress).filter(Boolean)));
        const recentEvents = events.slice(0, 20).map(event => ({
            id: event.id,
            userId: event.userId,
            action: event.type,
            resource: this.extractResourceFromDetails(event.details),
            details: event.details,
            ipAddress: event.details?.ipAddress,
            userAgent: event.details?.userAgent,
            timestamp: event.createdAt,
            severity: event.details?.severity || 'low',
            category: 'auth',
            outcome: event.details?.outcome || 'success',
        }));
        return {
            totalEvents: events.length,
            failedLogins,
            successfulLogins,
            passwordChanges,
            suspiciousActivities,
            uniqueIPs,
            recentEvents,
        };
    }
    /**
     * Cleanup old audit logs (run as cron job)
     */
    async cleanupOldLogs(retentionDays = this.RETENTION_DAYS) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const result = await this.prisma.authEvent.deleteMany({
            where: {
                createdAt: { lt: cutoffDate },
            },
        });
        this.logger.log(`Cleaned up ${result.count} old audit log entries older than ${retentionDays} days);
    return result.count;
  }

  /**
   * Private helper methods
   */
  private async createAuditLog(entry: AuditLogEntry): Promise<void> {
    await this.prisma.authEvent.create({
      data: {
        userId: entry.userId,
        type: entry.action,
        details: {
          ...entry.details,
          severity: entry.severity,
          category: entry.category,
          outcome: entry.outcome,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          resource: entry.resource,
          metadata: entry.metadata,
        },
      },
    });
  }

  private async createSecurityAlert(alert: SecurityAlert): Promise<void> {
    await this.prisma.authEvent.create({
      data: {
        userId: alert.userId,
        type: 'security_alert',
        details: {
          alertType: alert.type,
          severity: alert.severity,
          description: alert.description,
          ipAddress: alert.ipAddress,
          alertDetails: alert.details,
        },
      },
    });
  }

  private async checkForSecurityAlerts(entry: AuditLogEntry): Promise<void> {
    if (!entry.ipAddress) return;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Check for brute force attacks
    if (entry.action === 'login_attempt' && entry.outcome === 'failure') {
      const recentFailures = await this.prisma.authEvent.count({
        where: {
          type: 'login_attempt',
          createdAt: { gte: oneHourAgo },
          details: {
            path: ['ipAddress'],
            equals: entry.ipAddress,
          },
        },
      });

      if (recentFailures >= this.FAILED_LOGIN_THRESHOLD) {
        await this.createSecurityAlert({
          type: 'brute_force',
          ipAddress: entry.ipAddress,`, description, Potential, brute, force, attack, $, { recentFailures } ` failed login attempts in the last hour,
          severity: 'high',
          details: {
            failedAttempts: recentFailures,
            timeWindow: '1 hour',
          },
          timestamp: new Date(),
        });
      }
    }
  }

  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };

    // Remove sensitive information
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    }

    // Truncate if too large
    const jsonString = JSON.stringify(sanitized);
    if (jsonString.length > this.MAX_DETAILS_SIZE) {
      return {
        ...sanitized,
        _truncated: true,
        _originalSize: jsonString.length,
      };
    }

    return sanitized;
  }

  private sanitizeForLogging(entry: AuditLogEntry): any {
    return {
      action: entry.action,
      resource: entry.resource,
      userId: entry.userId,
      ipAddress: entry.ipAddress,
      severity: entry.severity,
      outcome: entry.outcome,
    };
  }

  private logToConsole(entry: AuditLogEntry): void {
    const message = `, $, { entry, : .action }, on, $, { entry, : .resource }, by, $, { entry, : .userId || 'anonymous' }, from, $, { entry, : .ipAddress });
        `
`;
        switch (entry.severity) {
        }
        `
      case 'critical':
        this.logger.error([CRITICAL] ${message}, { entry: this.sanitizeForLogging(entry) });
        break;
      case 'high':
        this.logger.warn([HIGH] ${message}, { entry: this.sanitizeForLogging(entry) });`;
        break;
        `
      case 'medium':`;
        this.logger.log([MEDIUM], $, { message });
        `
        break;`;
        'low';
        `
        this.logger.debug([LOW] ${message}`;
        ;
        break;
    }
};
exports.AuditLoggerService = AuditLoggerService;
exports.AuditLoggerService = AuditLoggerService = AuditLoggerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof database_1.PrismaService !== "undefined" && database_1.PrismaService) === "function" ? _a : Object, config_1.ConfigService])
], AuditLoggerService);
extractResourceFromDetails(details, any);
string;
{
    return details?.resource || 'unknown';
}
//# sourceMappingURL=audit-logger.service.js.map