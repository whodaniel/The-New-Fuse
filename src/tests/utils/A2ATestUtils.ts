import { A2AMessage } from '../../protocols/types.js';
import { MetricType } from '../../types/metrics.js';

export class A2ATestUtils {
    static createTestMessage(type: string, payload: any): A2AMessage {
        return {
            type,
            payload,
            metadata: {
                timestamp: Date.now(),
                sender: 'test-agent',
                protocol_version: '1.0'
            }
        };
    }

    static generateTestMetrics(agentId: string): Record<MetricType, number> {
        return {
            [MetricType.RESPONSE_TIME]: Math.random() * 100,
            [MetricType.CPU_USAGE]: Math.random() * 100,
            [MetricType.MEMORY_USAGE]: Math.random() * 1024,
            [MetricType.SUCCESS_RATE]: Math.random() * 100,
            [MetricType.ERROR_RATE]: Math.random() * 10,
            [MetricType.THROUGHPUT]: Math.random() * 1000
        };
    }

    static async createTestWorkflow(workflowService: any) {
        const nodes = [
            { id: 'source', type: 'A2A_AGENT' },
            { id: 'processor', type: 'A2A_AGENT' },
            { id: 'sink', type: 'A2A_AGENT' }
        ];

        const workflow = await workflowService.createWorkflow('test-workflow');
        for (const node of nodes) {
            await workflowService.registerA2ANode(workflow.id, node);
        }
        return workflow;
    }

    static mockWebSocket() {
        return {
            on: jest.fn(),
            emit: jest.fn(),
            disconnect: jest.fn()
        };
    }
}