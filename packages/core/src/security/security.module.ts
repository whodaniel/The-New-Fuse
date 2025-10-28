import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PolicyService } from './policy.service';
import { ProgressTrackerService } from './progressTracker.service';
import { RateLimitGuard } from './rate-limit.guard';
import { RedisMonitorService } from './redisMonitor.service';
import { SecurityService } from './security.service';
import { MonitoringService } from './monitoring.service';
import { PerformanceMonitorService } from './performanceMonitor.service';
import { MetricsProcessor } from './metricsProcessor';
import { IpBlockingService } from './ip-blocking.service';
import { MetricsCollectorService } from './metricsCollector.service';
import { AuthMiddleware } from './middleware/auth.middleware';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLoggingService } from './audit-logging.service';
import { AuditService } from './audit.service';
import { AuthService } from './auth.service';
import { EncryptionService } from './encryption.service';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot(),
  ],
  providers: [
    PolicyService,
    ProgressTrackerService,
    RateLimitGuard,
    RedisMonitorService,
    SecurityService,
    MonitoringService,
    PerformanceMonitorService,
    MetricsProcessor,
    IpBlockingService,
    MetricsCollectorService,
    AuthMiddleware,
    RateLimitMiddleware,
    SecurityHeadersMiddleware,
    PrismaService,
    AuditLoggingService,
    AuditService,
    AuthService,
    EncryptionService,
  ],
  exports: [
    PolicyService,
    ProgressTrackerService,
    RateLimitGuard,
    RedisMonitorService,
    SecurityService,
    MonitoringService,
    PerformanceMonitorService,
    MetricsProcessor,
    IpBlockingService,
    MetricsCollectorService,
    AuthMiddleware,
    RateLimitMiddleware,
    SecurityHeadersMiddleware,
    AuditLoggingService,
    AuditService,
    AuthService,
    EncryptionService,
  ],
})
export class SecurityModule {}
