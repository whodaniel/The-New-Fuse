/**
 * Service Mesh Integration Example
 * 
 * This example demonstrates how to use the MCP Service Mesh integration
 * with monitoring and scaling capabilities.
 */

import {
  MCPServiceMesh,
  KubernetesServiceMeshProvider,
  ServiceMeshMonitor,
  ServiceMeshScaler
} from '../src/integrations';
import { MCPServiceInfo } from '../src/types/broker';
import { ServiceStatus } from '../src/types/common';

async function demonstrateServiceMeshIntegration() {
  console.log('🚀 Starting MCP Service Mesh Integration Demo');

  // 1. Create Kubernetes service mesh provider
  const kubernetesProvider = new KubernetesServiceMeshProvider({
    apiServer: 'https://kubernetes-api:6443',
    namespace: 'mcp-services',
    token: process.env.KUBERNETES_TOKEN || 'demo-token',
    meshType: 'istio',
    defaultLabels: {
      'app.kubernetes.io/managed-by': 'mcp-service-mesh',
      'version': '1.0.0'
    },
    defaultAnnotations: {
      'mcp.io/managed': 'true',
      'istio.io/rev': 'default'
    }
  });

  // 2. Create service mesh integration
  const serviceMesh = new MCPServiceMesh({
    provider: kubernetesProvider,
    autoDiscovery: {
      autoRegister: true,
      autoDeregister: true,
      serviceNamePrefix: 'mcp-',
      defaultTags: ['mcp-service', 'auto-discovered'],
      defaultMetadata: {
        source: 'mcp-auto-discovery',
        environment: 'production'
      },
      defaultHealthCheck: {
        path: '/health',
        interval: 30,
        timeout: 5000,
        failureThreshold: 3,
        successThreshold: 1
      },
      defaultLoadBalancing: {
        algorithm: 'round_robin',
        healthCheckEnabled: true,
        circuitBreaker: {
          failureThreshold: 5,
          recoveryTimeout: 30000,
          halfOpenMaxCalls: 3,
          minRequestThreshold: 10
        }
      }
    },
    healthMonitoring: {
      enabled: true,
      interval: 30,
      timeout: 5000
    },
    metricsCollection: {
      enabled: true,
      interval: 60,
      retention: 3600
    },
    scaling: {
      enabled: true,
      defaultConfig: {
        minInstances: 2,
        maxInstances: 20,
        targetCPU: 0.7,
        targetMemory: 0.8,
        scaleUpCooldown: 300,
        scaleDownCooldown: 600
      }
    }
  });

  // 3. Create service mesh monitor
  const monitor = new ServiceMeshMonitor(kubernetesProvider, {
    healthCheckInterval: 30,
    metricsInterval: 60,
    healthCheckTimeout: 5000,
    maxConsecutiveFailures: 3,
    enablePerformanceMonitoring: true,
    enableAlerting: true,
    alertThresholds: {
      cpuThreshold: 0.8,
      memoryThreshold: 0.8,
      errorRateThreshold: 0.05,
      responseTimeThreshold: 500,
      healthScoreThreshold: 0.7
    },
    metricsRetention: 7200
  });

  // 4. Create service mesh scaler
  const scaler = new ServiceMeshScaler(kubernetesProvider, {
    evaluationInterval: 60,
    defaultScalingConfig: {
      minInstances: 2,
      maxInstances: 20,
      targetCPU: 0.7,
      targetMemory: 0.8,
      scaleUpCooldown: 300,
      scaleDownCooldown: 600,
      policies: [
        {
          name: 'cpu-scaling',
          metric: 'cpu',
          targetValue: 0.7,
          scaleUpThreshold: 0.8,
          scaleDownThreshold: 0.5
        },
        {
          name: 'memory-scaling',
          metric: 'memory',
          targetValue: 0.8,
          scaleUpThreshold: 0.9,
          scaleDownThreshold: 0.6
        },
        {
          name: 'rps-scaling',
          metric: 'rps',
          targetValue: 100,
          scaleUpThreshold: 120,
          scaleDownThreshold: 80
        }
      ]
    },
    enablePredictiveScaling: true,
    historyRetention: 3600,
    maxScalingOpsPerHour: 10,
    enableNotifications: true
  });

  // 5. Set up event handlers
  setupEventHandlers(serviceMesh, monitor, scaler);

  try {
    // 6. Create sample MCP services
    const services = createSampleMCPServices();

    // 7. Register services with service mesh
    console.log('\n📝 Registering MCP services with service mesh...');
    for (const service of services) {
      const meshRegistration = {
        serviceId: service.id,
        serviceName: service.name,
        version: service.version,
        endpoints: [
          {
            address: service.name,
            port: 8080,
            protocol: 'http',
            weight: 100
          },
          {
            address: service.name,
            port: 9090,
            protocol: 'http',
            weight: 0,
            metadata: { metrics: true }
          }
        ],
        metadata: {
          environment: 'production',
          team: 'platform',
          criticality: 'high'
        },
        healthCheck: {
          path: '/health',
          interval: 30,
          timeout: 5000,
          failureThreshold: 3,
          successThreshold: 1,
          method: 'GET',
          expectedStatusCodes: [200, 204]
        },
        loadBalancing: {
          algorithm: 'round_robin',
          sessionAffinity: false,
          healthCheckEnabled: true,
          circuitBreaker: {
            failureThreshold: 5,
            recoveryTimeout: 30000,
            halfOpenMaxCalls: 3,
            minRequestThreshold: 10
          }
        },
        tags: ['mcp-service', 'production', 'high-availability']
      };

      const result = await serviceMesh.registerService(service, meshRegistration);
      if (result.success) {
        console.log(`✅ Registered ${service.name} (${result.meshServiceId})`);
      } else {
        console.error(`❌ Failed to register ${service.name}: ${result.error?.message}`);
      }
    }

    // 8. Start monitoring
    console.log('\n📊 Starting service mesh monitoring...');
    const monitorResult = await monitor.startMonitoring();
    if (monitorResult.success) {
      console.log('✅ Monitoring started successfully');
      
      // Add services to monitoring
      for (const service of services) {
        await monitor.addService(service.id);
        console.log(`📈 Added ${service.name} to monitoring`);
      }
    } else {
      console.error(`❌ Failed to start monitoring: ${monitorResult.error?.message}`);
    }

    // 9. Start scaling
    console.log('\n⚖️ Starting service mesh scaling...');
    const scalerResult = await scaler.startScaling();
    if (scalerResult.success) {
      console.log('✅ Scaling started successfully');
      
      // Add services to scaling management
      for (const service of services) {
        await scaler.addService(service.id, {
          minInstances: 2,
          maxInstances: 15,
          targetCPU: 0.75,
          targetMemory: 0.8,
          scaleUpCooldown: 300,
          scaleDownCooldown: 600,
          policies: [
            {
              name: `${service.name}-cpu-policy`,
              metric: 'cpu',
              targetValue: 0.75,
              scaleUpThreshold: 0.85,
              scaleDownThreshold: 0.6
            }
          ]
        });
        console.log(`📏 Added ${service.name} to scaling management`);
      }
    } else {
      console.error(`❌ Failed to start scaling: ${scalerResult.error?.message}`);
    }

    // 10. Enable auto-discovery
    console.log('\n🔍 Enabling auto-discovery...');
    const autoDiscoveryResult = await serviceMesh.enableAutoDiscovery({
      autoRegister: true,
      autoDeregister: true,
      serviceNamePrefix: 'mcp-auto-',
      defaultTags: ['auto-discovered', 'managed'],
      defaultMetadata: {
        source: 'auto-discovery',
        discoveredAt: new Date().toISOString()
      }
    });

    if (autoDiscoveryResult.success) {
      console.log('✅ Auto-discovery enabled');
    } else {
      console.error(`❌ Failed to enable auto-discovery: ${autoDiscoveryResult.error?.message}`);
    }

    // 11. Demonstrate service discovery
    console.log('\n🔎 Discovering services...');
    const discoveredServices = await serviceMesh.discoverServices({
      tags: ['mcp-service']
    });
    console.log(`Found ${discoveredServices.length} MCP services in the mesh`);

    // 12. Show monitoring statistics
    console.log('\n📊 Monitoring Statistics:');
    const monitoringStats = monitor.getStatistics();
    console.log(`- Total services: ${monitoringStats.totalServices}`);
    console.log(`- Healthy services: ${monitoringStats.healthyServices}`);
    console.log(`- Unhealthy services: ${monitoringStats.unhealthyServices}`);
    console.log(`- Services in alert: ${monitoringStats.servicesInAlert}`);
    console.log(`- Total health checks: ${monitoringStats.totalHealthChecks}`);
    console.log(`- Average response time: ${monitoringStats.averageResponseTime}ms`);

    // 13. Show scaling statistics
    console.log('\n⚖️ Scaling Statistics:');
    const scalingStats = scaler.getStatistics();
    console.log(`- Total services: ${scalingStats.totalServices}`);
    console.log(`- Services scaling: ${scalingStats.servicesScaling}`);
    console.log(`- Services in cooldown: ${scalingStats.servicesInCooldown}`);
    console.log(`- Total scaling operations: ${scalingStats.totalScalingOperations}`);
    console.log(`- Successful operations: ${scalingStats.successfulOperations}`);
    console.log(`- Average confidence: ${(scalingStats.averageConfidence * 100).toFixed(1)}%`);

    // 14. Show integration status
    console.log('\n🔗 Service Mesh Integration Status:');
    const integrationStatus = await serviceMesh.getIntegrationStatus();
    console.log(`- Enabled: ${integrationStatus.enabled}`);
    console.log(`- Mesh type: ${integrationStatus.meshType}`);
    console.log(`- Connected services: ${integrationStatus.connectedServices}`);
    console.log(`- Health: ${integrationStatus.health}`);
    console.log(`- Auto-discovery: ${integrationStatus.config.autoDiscoveryEnabled}`);
    console.log(`- Health monitoring: ${integrationStatus.config.healthMonitoringEnabled}`);
    console.log(`- Scaling: ${integrationStatus.config.scalingEnabled}`);

    // 15. Demonstrate manual scaling
    console.log('\n🎛️ Demonstrating manual scaling...');
    const firstService = services[0];
    const scaleResult = await scaler.scaleService(
      firstService.id, 
      5, 
      'Demo: Manual scale up for load testing'
    );
    
    if (scaleResult.success) {
      console.log(`✅ Successfully scaled ${firstService.name} to 5 instances`);
    } else {
      console.error(`❌ Failed to scale ${firstService.name}: ${scaleResult.error?.message}`);
    }

    // 16. Show scaling history
    const scalingHistory = scaler.getScalingHistory(firstService.id, 5);
    if (scalingHistory.length > 0) {
      console.log(`\n📜 Recent scaling history for ${firstService.name}:`);
      scalingHistory.forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.event.type}: ${entry.event.previousInstances} → ${entry.event.newInstances} (${entry.result})`);
        console.log(`     Reason: ${entry.event.reason}`);
        console.log(`     Duration: ${entry.duration}ms`);
      });
    }

    // 17. Run for a demo period
    console.log('\n⏱️ Running demo for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    // 18. Cleanup
    console.log('\n🧹 Cleaning up...');
    await monitor.cleanup();
    await scaler.cleanup();
    await serviceMesh.cleanup();
    console.log('✅ Cleanup completed');
  }
}

function createSampleMCPServices(): MCPServiceInfo[] {
  return [
    {
      id: 'user-service',
      name: 'user-service',
      version: '1.2.0',
      endpoint: 'http://user-service:8080',
      capabilities: ['resource-access', 'user-management'],
      resources: [
        {
          name: 'user-profile',
          uri: 'user://profile/{id}',
          description: 'User profile resource',
          handler: {} as any
        },
        {
          name: 'user-preferences',
          uri: 'user://preferences/{id}',
          description: 'User preferences resource',
          handler: {} as any
        }
      ],
      tools: [
        {
          name: 'create-user',
          description: 'Create a new user account',
          inputSchema: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
              role: { type: 'string', enum: ['user', 'admin'] }
            },
            required: ['email', 'name']
          },
          handler: {} as any
        }
      ],
      status: ServiceStatus.ONLINE,
      metadata: {
        team: 'identity',
        criticality: 'high',
        dataClassification: 'sensitive'
      },
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
      healthScore: 0.95,
      tags: ['identity', 'core-service']
    },
    {
      id: 'notification-service',
      name: 'notification-service',
      version: '2.1.0',
      endpoint: 'http://notification-service:8080',
      capabilities: ['tool-execution', 'event-handling'],
      resources: [
        {
          name: 'notification-template',
          uri: 'notification://template/{id}',
          description: 'Notification template resource',
          handler: {} as any
        }
      ],
      tools: [
        {
          name: 'send-email',
          description: 'Send email notification',
          inputSchema: {
            type: 'object',
            properties: {
              to: { type: 'string', format: 'email' },
              subject: { type: 'string' },
              body: { type: 'string' },
              template: { type: 'string' }
            },
            required: ['to', 'subject', 'body']
          },
          handler: {} as any
        },
        {
          name: 'send-sms',
          description: 'Send SMS notification',
          inputSchema: {
            type: 'object',
            properties: {
              to: { type: 'string' },
              message: { type: 'string' }
            },
            required: ['to', 'message']
          },
          handler: {} as any
        }
      ],
      status: ServiceStatus.ONLINE,
      metadata: {
        team: 'communications',
        criticality: 'medium'
      },
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
      healthScore: 0.92,
      tags: ['communications', 'notifications']
    },
    {
      id: 'analytics-service',
      name: 'analytics-service',
      version: '3.0.0',
      endpoint: 'http://analytics-service:8080',
      capabilities: ['resource-access', 'tool-execution', 'data-processing'],
      resources: [
        {
          name: 'analytics-report',
          uri: 'analytics://report/{id}',
          description: 'Analytics report resource',
          handler: {} as any
        },
        {
          name: 'metrics-dashboard',
          uri: 'analytics://dashboard/{id}',
          description: 'Metrics dashboard resource',
          handler: {} as any
        }
      ],
      tools: [
        {
          name: 'generate-report',
          description: 'Generate analytics report',
          inputSchema: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
              metrics: { type: 'array', items: { type: 'string' } },
              dateRange: {
                type: 'object',
                properties: {
                  start: { type: 'string', format: 'date' },
                  end: { type: 'string', format: 'date' }
                }
              }
            },
            required: ['type', 'metrics']
          },
          handler: {} as any
        }
      ],
      status: ServiceStatus.ONLINE,
      metadata: {
        team: 'data',
        criticality: 'medium',
        dataClassification: 'internal'
      },
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
      healthScore: 0.88,
      tags: ['analytics', 'data-processing']
    }
  ];
}

function setupEventHandlers(
  serviceMesh: MCPServiceMesh,
  monitor: ServiceMeshMonitor,
  scaler: ServiceMeshScaler
) {
  // Service mesh events
  serviceMesh.on('service-registered', (serviceId: string) => {
    console.log(`🔗 Service registered: ${serviceId}`);
  });

  serviceMesh.on('service-unregistered', (serviceId: string) => {
    console.log(`🔌 Service unregistered: ${serviceId}`);
  });

  serviceMesh.on('registration-failed', (error: any) => {
    console.error(`❌ Registration failed: ${error.message}`);
  });

  // Monitoring events
  monitor.on('monitoring-started', () => {
    console.log('📊 Monitoring started');
  });

  monitor.on('service-added', (serviceId: string) => {
    console.log(`📈 Service added to monitoring: ${serviceId}`);
  });

  monitor.on('health-check-completed', (serviceId: string, health: any) => {
    console.log(`💚 Health check completed for ${serviceId}: ${health.status} (score: ${health.score})`);
  });

  monitor.on('health-check-failed', (serviceId: string, error: any) => {
    console.warn(`💔 Health check failed for ${serviceId}: ${error.message}`);
  });

  monitor.on('alert', (serviceId: string, alert: any) => {
    console.warn(`🚨 Alert for ${serviceId}: ${alert.message} (${alert.severity})`);
  });

  monitor.on('metrics-collected', (serviceId: string, metrics: any) => {
    console.log(`📊 Metrics collected for ${serviceId}: CPU ${(metrics.resources.cpu * 100).toFixed(1)}%, Memory ${(metrics.resources.memory * 100).toFixed(1)}%`);
  });

  // Scaling events
  scaler.on('scaling-started', () => {
    console.log('⚖️ Scaling started');
  });

  scaler.on('service-added', (serviceId: string) => {
    console.log(`📏 Service added to scaling: ${serviceId}`);
  });

  scaler.on('scaling-decision', (serviceId: string, decision: any) => {
    if (decision.type !== 'no_action') {
      console.log(`🎯 Scaling decision for ${serviceId}: ${decision.type} (${decision.currentInstances} → ${decision.recommendedInstances})`);
      console.log(`   Reason: ${decision.reason}`);
      console.log(`   Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
    }
  });

  scaler.on('scaling-completed', (serviceId: string, event: any) => {
    console.log(`✅ Scaling completed for ${serviceId}: ${event.type} (${event.previousInstances} → ${event.newInstances})`);
  });

  scaler.on('scaling-failed', (serviceId: string, error: any) => {
    console.error(`❌ Scaling failed for ${serviceId}: ${error.message}`);
  });
}

// Run the demo
if (require.main === module) {
  demonstrateServiceMeshIntegration()
    .then(() => {
      console.log('🎉 Demo completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Demo failed:', error);
      process.exit(1);
    });
}

export { demonstrateServiceMeshIntegration };