const express = require('express');
const Docker = require('dockerode');
const axios = require('axios');
const winston = require('winston');
const client = require('prom-client');

// Configuration
const config = {
  scaleUpThreshold: parseInt(process.env.SCALE_UP_THRESHOLD) || 80,
  scaleDownThreshold: parseInt(process.env.SCALE_DOWN_THRESHOLD) || 30,
  minReplicas: parseInt(process.env.MIN_REPLICAS) || 2,
  maxReplicas: parseInt(process.env.MAX_REPLICAS) || 10,
  checkInterval: parseInt(process.env.CHECK_INTERVAL) || 30,
  prometheusUrl: process.env.PROMETHEUS_URL || 'http://prometheus:9090',
  port: parseInt(process.env.PORT) || 3000
};

// Initialize Docker client
const docker = new Docker({
  socketPath: '/var/run/docker.sock'
});

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'autoscaler.log' })
  ]
});

// Prometheus metrics
const register = new client.Registry();
const scalingOperations = new client.Counter({
  name: 'autoscaler_scaling_operations_total',
  help: 'Total number of scaling operations',
  labelNames: ['service', 'direction']
});
const currentReplicas = new client.Gauge({
  name: 'autoscaler_current_replicas',
  help: 'Current number of replicas per service',
  labelNames: ['service']
});

register.registerMetric(scalingOperations);
register.registerMetric(currentReplicas);

// Express app for health checks and metrics
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Auto-scaling logic
class AutoScaler {
  constructor() {
    this.services = ['api', 'frontend'];
    this.lastScaleTime = {};
    this.cooldownPeriod = 300000; // 5 minutes
  }

  async getMetrics(service) {
    try {
      const queries = {
        cpu: `avg(rate(container_cpu_usage_seconds_total{name=~".*${service}.*"}[5m])) * 100`,
        memory: `avg(container_memory_usage_bytes{name=~".*${service}.*"} / container_spec_memory_limit_bytes{name=~".*${service}.*"}) * 100`,
        requests: `sum(rate(nginx_http_requests_total{upstream=~".*${service}.*"}[5m]))`
      };

      const results = {};
      for (const [metric, query] of Object.entries(queries)) {
        const response = await axios.get(`${config.prometheusUrl}/api/v1/query`, {
          params: { query }
        });
        
        if (response.data.status === 'success' && response.data.data.result.length > 0) {
          results[metric] = parseFloat(response.data.data.result[0].value[1]);
        } else {
          results[metric] = 0;
        }
      }

      return results;
    } catch (error) {
      logger.error(`Failed to get metrics for ${service}:`, error.message);
      return { cpu: 0, memory: 0, requests: 0 };
    }
  }

  async getCurrentReplicas(serviceName) {
    try {
      const services = await docker.listServices();
      const service = services.find(s => s.Spec.Name.includes(serviceName));
      
      if (service) {
        const replicas = service.Spec.Mode.Replicated.Replicas;
        currentReplicas.set({ service: serviceName }, replicas);
        return replicas;
      }
      return 0;
    } catch (error) {
      logger.error(`Failed to get current replicas for ${serviceName}:`, error.message);
      return 0;
    }
  }

  async scaleService(serviceName, targetReplicas) {
    try {
      const services = await docker.listServices();
      const service = services.find(s => s.Spec.Name.includes(serviceName));
      
      if (!service) {
        logger.error(`Service ${serviceName} not found`);
        return false;
      }

      const serviceObj = docker.getService(service.ID);
      const spec = service.Spec;
      spec.Mode.Replicated.Replicas = targetReplicas;
      spec.version = service.Version.Index;

      await serviceObj.update(spec);
      
      logger.info(`Scaled ${serviceName} to ${targetReplicas} replicas`);
      currentReplicas.set({ service: serviceName }, targetReplicas);
      
      return true;
    } catch (error) {
      logger.error(`Failed to scale ${serviceName}:`, error.message);
      return false;
    }
  }

  shouldScale(serviceName) {
    const lastScale = this.lastScaleTime[serviceName];
    if (lastScale && Date.now() - lastScale < this.cooldownPeriod) {
      return false;
    }
    return true;
  }

  async evaluateScaling(serviceName) {
    if (!this.shouldScale(serviceName)) {
      logger.debug(`${serviceName} is in cooldown period, skipping scaling evaluation`);
      return;
    }

    const metrics = await this.getMetrics(serviceName);
    const currentReplicas = await this.getCurrentReplicas(serviceName);
    
    if (currentReplicas === 0) {
      logger.warn(`Could not determine current replicas for ${serviceName}`);
      return;
    }

    const avgLoad = (metrics.cpu + metrics.memory) / 2;
    let targetReplicas = currentReplicas;
    let scaleDirection = null;

    // Scale up logic
    if (avgLoad > config.scaleUpThreshold && currentReplicas < config.maxReplicas) {
      const scaleUpFactor = Math.ceil(avgLoad / config.scaleUpThreshold);
      targetReplicas = Math.min(currentReplicas * scaleUpFactor, config.maxReplicas);
      scaleDirection = 'up';
    }
    // Scale down logic
    else if (avgLoad < config.scaleDownThreshold && currentReplicas > config.minReplicas) {
      targetReplicas = Math.max(Math.ceil(currentReplicas * 0.7), config.minReplicas);
      scaleDirection = 'down';
    }

    if (targetReplicas !== currentReplicas) {
      logger.info(`Scaling ${serviceName}: ${currentReplicas} -> ${targetReplicas} (Load: ${avgLoad.toFixed(2)}%)`);
      
      const success = await this.scaleService(serviceName, targetReplicas);
      if (success) {
        this.lastScaleTime[serviceName] = Date.now();
        scalingOperations.inc({ service: serviceName, direction: scaleDirection });
      }
    } else {
      logger.debug(`${serviceName} load is ${avgLoad.toFixed(2)}%, no scaling needed`);
    }
  }

  async start() {
    logger.info('Starting autoscaler with config:', config);
    
    setInterval(async () => {
      for (const service of this.services) {
        try {
          await this.evaluateScaling(service);
        } catch (error) {
          logger.error(`Error evaluating scaling for ${service}:`, error.message);
        }
      }
    }, config.checkInterval * 1000);

    logger.info(`Autoscaler started, checking every ${config.checkInterval} seconds`);
  }
}

// Start the autoscaler
const autoscaler = new AutoScaler();
autoscaler.start();

// Start the HTTP server
app.listen(config.port, () => {
  logger.info(`Autoscaler HTTP server listening on port ${config.port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});