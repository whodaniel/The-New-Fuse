import { Test, TestingModule } from '@nestjs/testing';
import { A2AWorkflowService } from '../services/A2AWorkflowService.js';
import { AgentWebSocketService } from '../services/AgentWebSocketService.js';
import { AgentMetricsService } from '../services/AgentMetricsService.js';
import { AgentPersistenceService } from '../services/AgentPersistenceService.js';
import { AgentStateSyncService } from '../services/AgentStateSyncService.js';

describe('A2A Integration Tests', () => {
    let module: TestingModule;
    let workflowService: A2AWorkflowService;
    let metricsService: AgentMetricsService;
    let syncService: AgentStateSyncService;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                A2AWorkflowService,
                AgentWebSocketService,
                AgentMetricsService,
                AgentPersistenceService,
                AgentStateSyncService
            ],
        }).compile();

        workflowService = module.get(A2AWorkflowService);
        metricsService = module.get(AgentMetricsService);
        syncService = module.get(AgentStateSyncService);
    });

    describe('Workflow Execution', () => {
        it('should execute A2A workflow successfully', async () => {
            const workflow = await workflowService.registerA2ANode({
                id: 'test-node',
                type: 'A2A_AGENT'
            });

            const result = await workflowService.executeA2AWorkflow(
                workflow.id,
                { test: 'data' }
            );

            expect(result).toBeDefined();
        });
    });

    describe('Metrics Collection', () => {
        it('should track and persist agent metrics', async () => {
            const agentId = 'test-agent';
            await metricsService.trackMetric(agentId, 'response_time', 100);
            const metrics = await metricsService.getMetrics(agentId);
            expect(metrics.response_time).toBeDefined();
        });
    });

    describe('State Synchronization', () => {
        it('should sync state between agents', async () => {
            const sourceAgent = 'agent-1';
            const targetAgent = 'agent-2';
            
            await syncService.handleStateUpdate(sourceAgent, { data: 'test' });
            await syncService.syncState(sourceAgent, targetAgent);
            
            const targetState = await syncService.getAgentState(targetAgent);
            expect(targetState.data).toBe('test');
        });
    });
});