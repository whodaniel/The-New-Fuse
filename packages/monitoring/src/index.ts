export class MonitoringService {
  constructor() {}

  async healthCheck(): Promise<{ status: string }> {
    return { status: 'ok' };
  }
}

export class MetricsCollector {
  constructor() {}

  async getMetrics(): Promise<Record<string, number>> {
    return {};
  }
}

export class AlertService {
  constructor() {}

  async getAlerts(): Promise<any[]> {
    return [];
  }
}

export class PerformanceMonitoringService {
  constructor() {}

  async getPerformanceStats(): Promise<any> {
    return {};
  }
}

export class ErrorTrackingService {
  constructor() {}

  async getErrorStats(): Promise<any> {
    return {};
  }
}

export class SystemHealthService {
  constructor() {}

  async getHealth(): Promise<any> {
    return {};
  }
}

export class SecurityLoggingService {
  constructor() {}

  async getSecurityLogs(): Promise<any[]> {
    return [];
  }
}
