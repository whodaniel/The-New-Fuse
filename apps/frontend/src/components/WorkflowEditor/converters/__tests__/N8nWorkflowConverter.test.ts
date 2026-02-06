/**
 * N8N Workflow Converter Tests
 * Comprehensive test suite for N8N workflow conversion
 */

import { N8nWorkflow, N8nWorkflowConverter, ReactFlowWorkflow } from '../N8nWorkflowConverter';

describe('N8nWorkflowConverter', () => {
  let converter: N8nWorkflowConverter;

  beforeEach(() => {
    converter = new N8nWorkflowConverter();
  });

  // ==========================================================================
  // Basic Workflow Conversion Tests
  // ==========================================================================

  describe('Basic Workflow Conversion', () => {
    it('should convert simple N8N workflow to ReactFlow', () => {
      const n8nWorkflow: N8nWorkflow = {
        id: 'test-workflow-1',
        name: 'Test Workflow',
        description: 'A test workflow',
        active: true,
        nodes: [
          {
            id: 'node1',
            name: 'Start',
            type: 'n8n-nodes-base.start',
            typeVersion: 1,
            position: [100, 200],
            parameters: {},
          },
          {
            id: 'node2',
            name: 'HTTP Request',
            type: 'n8n-nodes-base.httpRequest',
            typeVersion: 1,
            position: [300, 200],
            parameters: {
              url: 'https://api.example.com',
              method: 'GET',
            },
          },
        ],
        connections: {
          Start: {
            main: [
              [
                {
                  node: 'HTTP Request',
                  type: 'main',
                  index: 0,
                },
              ],
            ],
          },
        },
      };

      const reactFlowWorkflow = converter.convertFromN8n(n8nWorkflow);

      expect(reactFlowWorkflow).toBeDefined();
      expect(reactFlowWorkflow.name).toBe('Test Workflow');
      expect(reactFlowWorkflow.nodes).toHaveLength(2);
      expect(reactFlowWorkflow.edges).toHaveLength(1);
      expect(reactFlowWorkflow.nodes[0].id).toBe('node1');
      expect(reactFlowWorkflow.nodes[1].id).toBe('node2');
    });

    it('should convert ReactFlow workflow to N8N', () => {
      const reactFlowWorkflow: ReactFlowWorkflow = {
        id: 'rf-workflow-1',
        name: 'ReactFlow Test',
        nodes: [
          {
            id: 'rf-node1',
            type: 'start',
            position: { x: 100, y: 200 },
            data: {
              label: 'Start Node',
              parameters: {},
            },
          },
        ],
        edges: [],
      };

      const n8nWorkflow = converter.convertToN8n(reactFlowWorkflow);

      expect(n8nWorkflow).toBeDefined();
      expect(n8nWorkflow.name).toBe('ReactFlow Test');
      expect(n8nWorkflow.nodes).toHaveLength(1);
      expect(n8nWorkflow.nodes[0].type).toBe('n8n-nodes-base.start');
    });
  });

  // ==========================================================================
  // Advanced Node Properties Tests
  // ==========================================================================

  describe('Advanced Node Properties', () => {
    it('should preserve all node properties on import', () => {
      const n8nWorkflow: N8nWorkflow = {
        name: 'Advanced Properties Test',
        active: true,
        nodes: [
          {
            id: 'advanced-node',
            name: 'Advanced Node',
            type: 'n8n-nodes-base.httpRequest',
            typeVersion: 2,
            position: [100, 200],
            parameters: { url: 'https://api.example.com' },
            disabled: true,
            notes: 'This is a test note',
            notesInFlow: true,
            retryOnFail: true,
            maxTries: 5,
            waitBetweenTries: 2000,
            alwaysOutputData: true,
            executeOnce: true,
            onError: 'continueRegularOutput',
            continueOnFail: true,
          },
        ],
        connections: {},
      };

      const reactFlowWorkflow = converter.convertFromN8n(n8nWorkflow);
      const node = reactFlowWorkflow.nodes[0];

      expect(node.data.disabled).toBe(true);
      expect(node.data.notes).toBe('This is a test note');
      expect(node.data.notesInFlow).toBe(true);
      expect(node.data.retryOnFail).toBe(true);
      expect(node.data.maxTries).toBe(5);
      expect(node.data.waitBetweenTries).toBe(2000);
      expect(node.data.alwaysOutputData).toBe(true);
      expect(node.data.executeOnce).toBe(true);
      expect(node.data.onError).toBe('continueRegularOutput');
      expect(node.data.continueOnFail).toBe(true);
    });

    it('should preserve all node properties on export', () => {
      const reactFlowWorkflow: ReactFlowWorkflow = {
        id: 'test',
        name: 'Test',
        nodes: [
          {
            id: 'node1',
            type: 'http-request',
            position: { x: 100, y: 200 },
            data: {
              label: 'HTTP Node',
              disabled: true,
              notes: 'Export test',
              retryOnFail: true,
              maxTries: 3,
              continueOnFail: true,
              parameters: {},
            },
          },
        ],
        edges: [],
      };

      const n8nWorkflow = converter.convertToN8n(reactFlowWorkflow);
      const node = n8nWorkflow.nodes[0];

      expect(node.disabled).toBe(true);
      expect(node.notes).toBe('Export test');
      expect(node.retryOnFail).toBe(true);
      expect(node.maxTries).toBe(3);
      expect(node.continueOnFail).toBe(true);
    });
  });

  // ==========================================================================
  // Multi-Output Connection Tests (CRITICAL)
  // ==========================================================================

  describe('Multi-Output Connections', () => {
    it('should handle IF node with true/false branches', () => {
      const n8nWorkflow: N8nWorkflow = {
        name: 'IF Node Test',
        active: true,
        nodes: [
          {
            id: 'if-node',
            name: 'IF',
            type: 'n8n-nodes-base.if',
            typeVersion: 1,
            position: [100, 200],
            parameters: {
              conditions: {
                boolean: [
                  {
                    value1: '={{$json["status"]}}',
                    value2: 'active',
                  },
                ],
              },
            },
          },
          {
            id: 'true-node',
            name: 'True Branch',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [300, 100],
            parameters: {},
          },
          {
            id: 'false-node',
            name: 'False Branch',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [300, 300],
            parameters: {},
          },
        ],
        connections: {
          IF: {
            main: [
              // Output 0 - True branch
              [
                {
                  node: 'True Branch',
                  type: 'main',
                  index: 0,
                },
              ],
              // Output 1 - False branch
              [
                {
                  node: 'False Branch',
                  type: 'main',
                  index: 0,
                },
              ],
            ],
          },
        },
      };

      const reactFlowWorkflow = converter.convertFromN8n(n8nWorkflow);

      expect(reactFlowWorkflow.edges).toHaveLength(2);

      const trueBranchEdge = reactFlowWorkflow.edges.find((e) => e.target === 'true-node');
      const falseBranchEdge = reactFlowWorkflow.edges.find((e) => e.target === 'false-node');

      expect(trueBranchEdge).toBeDefined();
      expect(falseBranchEdge).toBeDefined();
      expect(trueBranchEdge?.data?.branchName).toBe('true');
      expect(falseBranchEdge?.data?.branchName).toBe('false');
    });

    it('should convert IF node branches back to N8N correctly', () => {
      const reactFlowWorkflow: ReactFlowWorkflow = {
        id: 'test',
        name: 'IF Test',
        nodes: [
          {
            id: 'if1',
            type: 'if',
            position: { x: 100, y: 200 },
            data: {
              label: 'IF',
              outputCount: 2,
              outputTypes: ['main'],
              parameters: {},
            },
          },
          {
            id: 'true1',
            type: 'set',
            position: { x: 300, y: 100 },
            data: { label: 'True', parameters: {} },
          },
          {
            id: 'false1',
            type: 'set',
            position: { x: 300, y: 300 },
            data: { label: 'False', parameters: {} },
          },
        ],
        edges: [
          {
            id: 'e1',
            source: 'if1',
            target: 'true1',
            sourceHandle: 'main-0',
            targetHandle: 'main-0',
          },
          {
            id: 'e2',
            source: 'if1',
            target: 'false1',
            sourceHandle: 'main-1',
            targetHandle: 'main-0',
          },
        ],
      };

      const n8nWorkflow = converter.convertToN8n(reactFlowWorkflow);
      const connections = n8nWorkflow.connections['IF'];

      expect(connections).toBeDefined();
      expect(connections.main).toHaveLength(2);
      expect(connections.main[0]).toHaveLength(1);
      expect(connections.main[1]).toHaveLength(1);
      expect(connections.main[0][0].node).toBe('True');
      expect(connections.main[1][0].node).toBe('False');
    });
  });

  // ==========================================================================
  // Pin Data Tests
  // ==========================================================================

  describe('Pin Data Support', () => {
    it('should preserve pin data on import', () => {
      const n8nWorkflow: N8nWorkflow = {
        name: 'Pin Data Test',
        active: true,
        nodes: [
          {
            id: 'node1',
            name: 'Test Node',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [100, 200],
            parameters: {},
          },
        ],
        connections: {},
        pinData: {
          'Test Node': [
            {
              json: {
                testKey: 'testValue',
                count: 42,
              },
            },
          ],
        },
      };

      const reactFlowWorkflow = converter.convertFromN8n(n8nWorkflow);

      expect(reactFlowWorkflow.pinData).toBeDefined();
      expect(reactFlowWorkflow.pinData?.['Test Node']).toBeDefined();
      expect(reactFlowWorkflow.pinData?.['Test Node'][0].json.testKey).toBe('testValue');
    });

    it('should preserve pin data on export', () => {
      const reactFlowWorkflow: ReactFlowWorkflow = {
        id: 'test',
        name: 'Test',
        nodes: [
          {
            id: 'node1',
            type: 'set',
            position: { x: 100, y: 200 },
            data: { label: 'Set Node', parameters: {} },
          },
        ],
        edges: [],
        pinData: {
          'Set Node': [
            {
              json: {
                exportTest: true,
              },
            },
          ],
        },
      };

      const n8nWorkflow = converter.convertToN8n(reactFlowWorkflow);

      expect(n8nWorkflow.pinData).toBeDefined();
      expect(n8nWorkflow.pinData?.['Set Node']).toBeDefined();
      expect(n8nWorkflow.pinData?.['Set Node'][0].json.exportTest).toBe(true);
    });
  });

  // ==========================================================================
  // Workflow Settings Tests
  // ==========================================================================

  describe('Workflow Settings', () => {
    it('should convert settings on import', () => {
      const n8nWorkflow: N8nWorkflow = {
        name: 'Settings Test',
        active: true,
        nodes: [],
        connections: {},
        settings: {
          saveDataErrorExecution: 'none',
          saveDataSuccessExecution: 'all',
          saveManualExecutions: false,
          timezone: 'Europe/London',
          executionTimeout: 7200,
        },
      };

      const reactFlowWorkflow = converter.convertFromN8n(n8nWorkflow);

      expect(reactFlowWorkflow.settings).toBeDefined();
      expect(reactFlowWorkflow.settings?.saveDataErrorExecution).toBe('none');
      expect(reactFlowWorkflow.settings?.timezone).toBe('Europe/London');
      expect(reactFlowWorkflow.settings?.executionTimeout).toBe(7200);
    });

    it('should apply default settings on export', () => {
      const reactFlowWorkflow: ReactFlowWorkflow = {
        id: 'test',
        name: 'Test',
        nodes: [],
        edges: [],
      };

      const n8nWorkflow = converter.convertToN8n(reactFlowWorkflow);

      expect(n8nWorkflow.settings).toBeDefined();
      expect(n8nWorkflow.settings?.saveDataErrorExecution).toBe('all');
      expect(n8nWorkflow.settings?.saveDataSuccessExecution).toBe('all');
      expect(n8nWorkflow.settings?.saveManualExecutions).toBe(true);
    });
  });

  // ==========================================================================
  // Validation Tests
  // ==========================================================================

  describe('Workflow Validation', () => {
    it('should validate valid N8N workflow', () => {
      const validWorkflow: N8nWorkflow = {
        name: 'Valid Workflow',
        active: true,
        nodes: [
          {
            id: 'node1',
            name: 'Node 1',
            type: 'n8n-nodes-base.start',
            typeVersion: 1,
            position: [100, 200],
            parameters: {},
          },
        ],
        connections: {},
      };

      const result = converter.validateN8nWorkflow(validWorkflow);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing workflow name', () => {
      const invalidWorkflow: any = {
        active: true,
        nodes: [],
        connections: {},
      };

      const result = converter.validateN8nWorkflow(invalidWorkflow);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Workflow name is required');
    });

    it('should detect invalid node references in connections', () => {
      const invalidWorkflow: N8nWorkflow = {
        name: 'Invalid Connections',
        active: true,
        nodes: [
          {
            id: 'node1',
            name: 'Node 1',
            type: 'n8n-nodes-base.start',
            typeVersion: 1,
            position: [100, 200],
            parameters: {},
          },
        ],
        connections: {
          'Node 1': {
            main: [
              [
                {
                  node: 'Non-Existent Node',
                  type: 'main',
                  index: 0,
                },
              ],
            ],
          },
        },
      };

      const result = converter.validateN8nWorkflow(invalidWorkflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('non-existent target node'))).toBe(true);
    });

    it('should validate ReactFlow workflow', () => {
      const validWorkflow: ReactFlowWorkflow = {
        id: 'test',
        name: 'Valid',
        nodes: [
          {
            id: 'node1',
            type: 'start',
            position: { x: 0, y: 0 },
            data: { label: 'Start', parameters: {} },
          },
        ],
        edges: [],
      };

      const result = converter.validateReactFlowWorkflow(validWorkflow);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Round-Trip Conversion Tests
  // ==========================================================================

  describe('Round-Trip Conversion', () => {
    it('should preserve workflow data in round-trip conversion', () => {
      const originalN8n: N8nWorkflow = {
        id: 'roundtrip-test',
        name: 'Round Trip Test',
        description: 'Testing round-trip conversion',
        active: true,
        nodes: [
          {
            id: 'node1',
            name: 'Start',
            type: 'n8n-nodes-base.start',
            typeVersion: 1,
            position: [100, 200],
            parameters: {},
            disabled: false,
            notes: 'Start node',
          },
          {
            id: 'node2',
            name: 'HTTP',
            type: 'n8n-nodes-base.httpRequest',
            typeVersion: 1,
            position: [300, 200],
            parameters: { url: 'https://api.example.com' },
            retryOnFail: true,
            maxTries: 3,
          },
        ],
        connections: {
          Start: {
            main: [
              [
                {
                  node: 'HTTP',
                  type: 'main',
                  index: 0,
                },
              ],
            ],
          },
        },
        settings: {
          timezone: 'UTC',
        },
      };

      // N8N -> ReactFlow
      const reactFlow = converter.convertFromN8n(originalN8n);

      // ReactFlow -> N8N
      const finalN8n = converter.convertToN8n(reactFlow);

      // Compare
      expect(finalN8n.name).toBe(originalN8n.name);
      expect(finalN8n.description).toBe(originalN8n.description);
      expect(finalN8n.nodes).toHaveLength(originalN8n.nodes.length);
      expect(finalN8n.nodes[0].notes).toBe(originalN8n.nodes[0].notes);
      expect(finalN8n.nodes[1].retryOnFail).toBe(originalN8n.nodes[1].retryOnFail);
      expect(finalN8n.settings?.timezone).toBe(originalN8n.settings?.timezone);
    });
  });

  // ==========================================================================
  // Static Data Tests
  // ==========================================================================

  describe('Static Data', () => {
    it('should preserve static data on import', () => {
      const n8nWorkflow: N8nWorkflow = {
        name: 'Static Data Test',
        active: true,
        nodes: [],
        connections: {},
        staticData: {
          counter: 42,
          cache: { key: 'value' },
        },
      };

      const reactFlowWorkflow = converter.convertFromN8n(n8nWorkflow);

      expect(reactFlowWorkflow.staticData).toBeDefined();
      expect(reactFlowWorkflow.staticData?.counter).toBe(42);
      expect(reactFlowWorkflow.staticData?.cache.key).toBe('value');
    });
  });

  // ==========================================================================
  // Metadata Tests
  // ==========================================================================

  describe('Workflow Metadata', () => {
    it('should preserve version information', () => {
      const n8nWorkflow: N8nWorkflow = {
        name: 'Versioned Workflow',
        active: true,
        nodes: [],
        connections: {},
        versionId: 'v123',
        activeVersionId: 'v123',
        versionCounter: 5,
      };

      const reactFlowWorkflow = converter.convertFromN8n(n8nWorkflow);

      expect(reactFlowWorkflow.versionId).toBe('v123');
      expect(reactFlowWorkflow.activeVersionId).toBe('v123');
      expect(reactFlowWorkflow.versionCounter).toBe(5);
    });

    it('should handle tags correctly', () => {
      const n8nWorkflow: N8nWorkflow = {
        name: 'Tagged Workflow',
        active: true,
        nodes: [],
        connections: {},
        tags: [
          { id: 'tag1', name: 'production' },
          { id: 'tag2', name: 'api' },
        ],
      };

      const reactFlowWorkflow = converter.convertFromN8n(n8nWorkflow);

      expect(reactFlowWorkflow.tags).toEqual(['production', 'api']);
    });
  });
});
