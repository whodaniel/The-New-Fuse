import { Module } from '@nestjs/common';
import { A2AWorkflowService } from '../services/A2AWorkflowService.js';
import { A2ANodeRegistry } from '../workflow/registry/A2ANodeRegistry.js';
import { A2AErrorHandler } from '../workflow/error/A2AErrorHandler.js';
import { ConfigurationManager } from '../config/A2AConfig.js';
import { AgentWebSocketService } from '../services/AgentWebSocketService.js';
import { AgentMetricsService } from '../services/AgentMetricsService.js';
import { A2AWorkflowValidator } from '../services/A2AWorkflowValidator.js';
import { AgentCapabilityService } from '../services/AgentCapabilityService.js';
import { A2AMessageQueue } from '../services/A2AMessageQueue.js';
import { A2AMetricsAggregator } from '../services/A2AMetricsAggregator.js';
import { A2ARateLimiter } from '../services/A2ARateLimiter.js';
import { A2ACircuitBreaker } from '../services/A2ACircuitBreaker.js';
import { A2ATracer } from '../services/A2ATracer.js';
import { A2ALogger } from '../services/A2ALogger.js';
import { A2AMonitoringIntegration } from '../services/A2AMonitoringIntegration.js';
import { A2AVersionManager } from '../services/A2AVersionManager.js';
import { A2ASchemaValidator } from '../services/A2ASchemaValidator.js';
import { A2AHealthController } from '../controllers/A2AHealthController.js';

@Module({
    controllers: [A2AHealthController],
    providers: [
        A2AWorkflowService,
        A2ANodeRegistry,
        A2AErrorHandler,
        AgentWebSocketService,
        AgentMetricsService,
        A2AWorkflowValidator,
        AgentCapabilityService,
        A2AMessageQueue,
        A2AMetricsAggregator,
        A2ARateLimiter,
        A2ACircuitBreaker,
        A2ATracer,
        A2ALogger,
        A2AMonitoringIntegration,
        A2AVersionManager,
        A2ASchemaValidator,
        {
            provide: ConfigurationManager,
            useFactory: () => ConfigurationManager.getInstance()
        }
    ],
    exports: [
        A2AWorkflowService,
        A2ANodeRegistry,
        AgentWebSocketService,
        AgentMetricsService,
        A2AWorkflowValidator,
        A2AMessageQueue,
        A2ATracer,
        A2AMonitoringIntegration
    ]
})
export class A2AModule {}