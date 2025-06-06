import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SystemHealthCheck {
  component: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  message?: string;
  details?: Record<string, any>;
  timestamp: Date;
  responseTime?: number;
}

export interface SystemDiagnosticReport {
  overall: 'healthy' | 'warning' | 'critical';
  timestamp: Date;
  checks: SystemHealthCheck[];
  summary: {
    healthy: number;
    warning: number;
    critical: number;
    total: number;
  };
}

export interface ServiceTroubleshootingResult {
  serviceName: string;
  issues: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendations: string[];
  }>;
  systemMetrics: {
    cpu: number;
    memory: number;
    disk: number;
    network?: number;
  };
  logs: string[];
}

@Injectable()
export class SystemDiagnosticsService {
  private healthChecks: Map<string, () => Promise<SystemHealthCheck>> = new Map();

  constructor(
    private readonly configService: ConfigService
  ) {
    this.initializeHealthChecks();
  }

  public async performSystemCheck(): Promise<SystemDiagnosticReport> {
    const checks: SystemHealthCheck[] = [];
    const startTime = Date.now();

    // Run all health checks
    for (const [name, checkFn] of this.healthChecks.entries()) {
      try {
        const checkStartTime = Date.now();
        const result = await checkFn();
        const responseTime = Date.now() - checkStartTime;
        
        checks.push({
          ...result,
          component: name,
          responseTime,
          timestamp: new Date()
        });
      } catch (error) {
        checks.push({
          component: name,
          status: 'critical',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          responseTime: Date.now() - startTime
        });
      }
    }

    // Calculate summary
    const summary = {
      healthy: checks.filter(c => c.status === 'healthy').length,
      warning: checks.filter(c => c.status === 'warning').length,
      critical: checks.filter(c => c.status === 'critical').length,
      total: checks.length
    };

    // Determine overall status
    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (summary.critical > 0) {
      overall = 'critical';
    } else if (summary.warning > 0) {
      overall = 'warning';
    }

    return {
      overall,
      timestamp: new Date(),
      checks,
      summary
    };
  }

  public async troubleshootService(serviceName: string): Promise<ServiceTroubleshootingResult> {
    const issues: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      recommendations: string[];
    }> = [];

    // Check if service exists in health checks
    const healthCheck = this.healthChecks.get(serviceName);
    if (!healthCheck) {
      issues.push({
        severity: 'high',
        description: `Service ${serviceName} not found in health check registry`,
        recommendations: [
          'Verify service name spelling',
          'Check if service is properly registered',
          'Ensure service is deployed and running'
        ]
      });
    } else {
      // Run specific health check for the service
      try {
        const result = await healthCheck();
        if (result.status === 'critical') {
          issues.push({
            severity: 'critical',
            description: `Service ${serviceName} is in critical state: ${result.message}`,
            recommendations: [
              'Check service logs for errors',
              'Verify service configuration',
              'Restart service if necessary',
              'Check database connectivity if applicable'
            ]
          });
        } else if (result.status === 'warning') {
          issues.push({
            severity: 'medium',
            description: `Service ${serviceName} has warnings: ${result.message}`,
            recommendations: [
              'Monitor service performance',
              'Check for resource constraints',
              'Review recent configuration changes'
            ]
          });
        }
      } catch (error) {
        issues.push({
          severity: 'critical',
          description: `Failed to check service ${serviceName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          recommendations: [
            'Check if service is running',
            'Verify network connectivity',
            'Check service endpoint configuration'
          ]
        });
      }
    }

    // Get system metrics
    const systemMetrics = await this.getSystemMetrics();

    // Check for resource-related issues
    if (systemMetrics.cpu > 80) {
      issues.push({
        severity: 'high',
        description: `High CPU usage: ${systemMetrics.cpu}%`,
        recommendations: [
          'Identify processes consuming high CPU',
          'Scale up resources if needed',
          'Optimize service performance'
        ]
      });
    }

    if (systemMetrics.memory > 85) {
      issues.push({
        severity: 'high',
        description: `High memory usage: ${systemMetrics.memory}%`,
        recommendations: [
          'Check for memory leaks',
          'Increase available memory',
          'Optimize memory usage in applications'
        ]
      });
    }

    if (systemMetrics.disk > 90) {
      issues.push({
        severity: 'critical',
        description: `Critical disk usage: ${systemMetrics.disk}%`,
        recommendations: [
          'Clean up unnecessary files',
          'Archive old logs',
          'Increase disk space',
          'Implement log rotation'
        ]
      });
    }

    // Get service logs
    const logs = await this.getServiceLogs(serviceName);

    return {
      serviceName,
      issues,
      systemMetrics,
      logs
    };
  }

  public registerHealthCheck(name: string, checkFn: () => Promise<SystemHealthCheck>): void {
    this.healthChecks.set(name, checkFn);
    console.log(`Registered health check: ${name}`);
  }

  public unregisterHealthCheck(name: string): void {
    this.healthChecks.delete(name);
    console.log(`Unregistered health check: ${name}`);
  }

  public async getComponentHealth(componentName: string): Promise<SystemHealthCheck | null> {
    const checkFn = this.healthChecks.get(componentName);
    if (!checkFn) {
      return null;
    }

    try {
      return await checkFn();
    } catch (error) {
      return {
        component: componentName,
        status: 'critical',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  private initializeHealthChecks(): void {
    // Register default health checks
    this.registerHealthCheck('database', async () => {
      // Placeholder database health check
      return {
        component: 'database',
        status: 'healthy',
        message: 'Database connection is healthy',
        timestamp: new Date(),
        details: {
          connectionPool: 'healthy',
          responseTime: '< 100ms'
        }
      };
    });

    this.registerHealthCheck('redis', async () => {
      // Placeholder Redis health check
      return {
        component: 'redis',
        status: 'healthy',
        message: 'Redis connection is healthy',
        timestamp: new Date(),
        details: {
          connected: true,
          memoryUsage: '45%'
        }
      };
    });

    this.registerHealthCheck('external_apis', async () => {
      // Placeholder external API health check
      return {
        component: 'external_apis',
        status: 'healthy',
        message: 'External APIs are responding',
        timestamp: new Date(),
        details: {
          openai: 'healthy',
          anthropic: 'healthy'
        }
      };
    });
  }

  private async getSystemMetrics(): Promise<{
    cpu: number;
    memory: number;
    disk: number;
    network?: number;
  }> {
    // Placeholder system metrics
    // In a real implementation, you would use libraries like 'systeminformation' or 'node-os-utils'
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: Math.random() * 100
    };
  }

  private async getServiceLogs(serviceName: string): Promise<string[]> {
    // Placeholder log retrieval
    // In a real implementation, you would read from log files or log aggregation systems
    return [
      `[${new Date().toISOString()}] INFO: Service ${serviceName} started successfully`,
      `[${new Date().toISOString()}] DEBUG: Processing request`,
      `[${new Date().toISOString()}] INFO: Request completed successfully`
    ];
  }
}