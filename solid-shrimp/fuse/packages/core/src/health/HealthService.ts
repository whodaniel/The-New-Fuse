import { Injectable, Logger } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheckResult } from '@nestjs/terminus';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
  ) {}

  check(): Promise<HealthCheckResult> {
    this.logger.log('Performing health check...');
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
    ]);
  }
}
