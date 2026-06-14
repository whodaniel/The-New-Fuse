"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWorkflows = exports.generateWorkflow = void 0;
const utils_1 = require("./utils");
const NODE_TYPES = ['task', 'decision', 'api', 'transform', 'notification'];
const EDGE_TYPES = ['default', 'success', 'failure', 'conditional'];
const DEFAULT_OPTIONS = {
    nodeCount: 5,
    edgeCount: 4,
    withMetadata: true,
    withVariables: false
};
const generateWorkflow = (options = {}) => {
    const finalOptions = { ...DEFAULT_OPTIONS, ...options };
    const nodes = generateNodes(finalOptions.nodeCount || 0);
    const edges = generateEdges(nodes, finalOptions.edgeCount || 0);
    const workflow = {
        id: (0, utils_1.generateId)(),
        name: `Test Workflow ${(0, utils_1.generateId)().slice(0, 8)}`,
        description: 'A test workflow generated for testing purposes',
        creator: finalOptions.creator,
        nodes,
        edges,
        metadata: finalOptions.withMetadata ? generateWorkflowMetadata() : {},
        isActive: true,
        variables: finalOptions.withVariables ? generateWorkflowVariables() : {},
        triggers: generateTriggers(),
        createdAt: (0, utils_1.generateTimestamp)({ past: true }),
        updatedAt: (0, utils_1.generateTimestamp)({ past: true }),
        lastExecutedAt: (0, utils_1.generateTimestamp)({ past: true }),
        executionCount: Math.floor(Math.random() * 100),
        statistics: generateWorkflowStatistics()
    };
    return workflow;
};
exports.generateWorkflow = generateWorkflow;
const generateWorkflows = (count, options = {}) => {
    return Array.from({ length: count }, () => (0, exports.generateWorkflow)(options));
};
exports.generateWorkflows = generateWorkflows;
const generateNodes = (count) => {
    return Array.from({ length: count }, (_, index) => ({
        id: (0, utils_1.generateId)(),
        type: (0, utils_1.pickRandom)(NODE_TYPES),
        position: {
            x: Math.random() * 800,
            y: Math.random() * 600
        },
        data: {
            label: `Node ${index + 1}`,
            inputs: ['input1', 'input2'],
            outputs: ['output1', 'output2'],
            config: {
                timeout: Math.random() * 5000,
                retries: Math.floor(Math.random() * 3)
            }
        }
    }));
};
const generateEdges = (nodes, count) => {
    const edges = [];
    for (let i = 0; i < count && i < nodes.length - 1; i++) {
        edges.push({
            id: (0, utils_1.generateId)(),
            source: nodes[i].id,
            target: nodes[i + 1].id,
            type: (0, utils_1.pickRandom)(EDGE_TYPES),
            animated: Math.random() > 0.5,
            label: Math.random() > 0.7 ? `Connection ${i + 1}` : undefined
        });
    }
    return edges;
};
const generateWorkflowMetadata = () => ({
    version: '1.0.0',
    tags: ['test', 'generated'],
    category: (0, utils_1.pickRandom)(['automation', 'integration', 'processing']),
    priority: (0, utils_1.pickRandom)(['low', 'medium', 'high'])
});
const generateWorkflowVariables = () => ({
    apiKey: 'test-api-key',
    baseUrl: 'https://api.example.com',
    timeout: 5000,
    retryCount: 3
});
const generateTriggers = () => ([{
        type: 'schedule',
        config: {
            cron: '0 * * * *'
        }
    }]);
const generateWorkflowStatistics = () => ({
    averageExecutionTime: Math.random() * 1000,
    successRate: Math.random() * 100,
    lastExecutionStatus: (0, utils_1.pickRandom)(['success', 'failed', 'partial'])
});
//# sourceMappingURL=workflowGenerator.js.map