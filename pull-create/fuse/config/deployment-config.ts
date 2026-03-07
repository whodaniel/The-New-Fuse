import { DeploymentConfig, RollbackConfig, Environment } from '../packages/core/src/types/deployment.js';

export const deploymentConfigs: Record<Environment, DeploymentConfig> = {
  development: {
    environment: 'development',
    version: 'latest',
    replicas: 1,
    resources: {
      requests: {
        cpu: '250m',
        memory: '512Mi'
      },
      limits: {
        cpu: '500m',
        memory: '1Gi'
      }
    },
    healthChecks: {
      minTestCoverage: 70,
      maxErrorRate: 0.1,
      maxResponseTime: 1000,
      requiredSecurityScans: false
    }
  },
  staging: {
    environment: 'staging',
    version: 'stable',
    replicas: 2,
    resources: {
      requests: {
        cpu: '500m',
        memory: '1Gi'
      },
      limits: {
        cpu: '1000m',
        memory: '2Gi'
      }
    },
    healthChecks: {
      minTestCoverage: 80,
      maxErrorRate: 0.05,
      maxResponseTime: 500,
      requiredSecurityScans: true
    }
  },
  production: {
    environment: 'production',
    version: 'release',
    replicas: 3,
    resources: {
      requests: {
        cpu: '1000m',
        memory: '2Gi'
      },
      limits: {
        cpu: '2000m',
        memory: '4Gi'
      }
    },
    healthChecks: {
      minTestCoverage: 90,
      maxErrorRate: 0.01,
      maxResponseTime: 300,
      requiredSecurityScans: true
    }
  }
};

export const rollbackConfigs: Record<Environment, RollbackConfig> = {
  development: {
    automatic: true,
    healthCheckTimeout: 60,
    maxRetries: 3,
    notificationChannels: ['slack-dev']
  },
  staging: {
    automatic: true,
    healthCheckTimeout: 180,
    maxRetries: 2,
    notificationChannels: ['slack-dev', 'slack-qa']
  },
  production: {
    automatic: false,
    healthCheckTimeout: 300,
    maxRetries: 1,
    notificationChannels: ['slack-ops', 'slack-alerts', 'pagerduty']
  }
};