import { Counter, Histogram } from 'prom-client';

const logCounter = new Counter({
  name: 'app_log_messages_total',
  help: 'Total number of log messages',
  labelNames: ['level', 'context']
});

const httpRequestDuration = new Histogram({
  name: 'app_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status']
});

export const logger = {
  log: (level: string, message: string, context?: string) => {
    logCounter.inc({ level, context });
    
  },
  httpRequestDuration: (method: string, route: string, status: string, duration: number) => {
    httpRequestDuration.observe({ method, route, status }, duration);
  }
};
