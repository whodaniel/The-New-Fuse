/**
 * End-to-End Integration Tests
 *
 * These tests verify the complete MCP system functionality including
 * server-client communication, resource management, tool execution,
 * and real-world usage scenarios.
 */

import { EventEmitter } from 'events';
import { MCPSystemFactory } from '../factory/MCPSystemFactory';
import { ResourceHandler } from '../handlers/ResourceHandler';
import { ToolHandler } from '../handlers/ToolHandler';
import { MCPServer } from '../server/MCPServer';
import { MCPNotification, MCPRequest, MCPResponse } from '../types/message';
import { MCPServerConfig } from '../types/server';

// Mock WebSocket client for testing
class MockMCPClient extends EventEmitter {
  private responses: Map<
    string | number,
    { resolve: Function; reject: Function; timeout: NodeJS.Timeout }
  >;

  constructor() {
    super();
    this.responses = new Map();
  }

  async sendRequest(request: MCPRequest): Promise<MCPResponse> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.responses.delete(request.id);
        reject(new Error('Request timeout'));
      }, 5000);

      this.responses.set(request.id, { resolve, reject, timeout });

      // Simulate sending request
      this.emit('message', JSON.stringify(request));
    });
  }

  sendNotification(notification: MCPNotification): void {
    this.emit('message', JSON.stringify(notification));
  }

  handleResponse(response: MCPResponse): void {
    const handler = this.responses.get(response.id);
    if (handler) {
      clearTimeout(handler.timeout);
      this.responses.delete(response.id);
      handler.resolve(response);
    }
  }

  close(): void {
    // Clean up pending requests
    for (const [id, handler] of this.responses) {
      clearTimeout(handler.timeout);
      handler.reject(new Error('Connection closed'));
    }
    this.responses.clear();
  }
}

// Custom resource handler for testing
class TestResourceHandler extends ResourceHandler {
  private testData: Map<string, any> = new Map();
  private subscriptions: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super('test-handler', 'Test Resource Handler');

    // Add some test data
    this.testData.set('file:///test/document.txt', {
      content: 'This is a test document',
      mimeType: 'text/plain',
      size: 23,
    });

    this.testData.set('file:///test/config.json', {
      content: JSON.stringify({ version: '1.0', debug: true }),
      mimeType: 'application/json',
      size: 33,
    });

    this.testData.set('file:///test/data.csv', {
      content: 'name,age,city\nJohn,25,NYC\nJane,30,SF',
      mimeType: 'text/csv',
      size: 35,
    });
  }

  async read(uri: string): Promise<any> {
    const data = this.testData.get(uri);
    if (!data) {
      throw new Error(`Resource not found: ${uri}`);
    }
    return {
      uri,
      mimeType: data.mimeType,
      content: data.content,
      size: data.size,
      lastModified: new Date(),
      metadata: {},
    };
  }

  async list(pattern?: string): Promise<any[]> {
    const results: any[] = [];

    for (const [uri, data] of this.testData) {
      if (!pattern || this.matchesPattern(uri, pattern)) {
        results.push({
          uri,
          name: uri.split('/').pop() || uri,
          mimeType: data.mimeType,
          handler: this,
        });
      }
    }

    return results;
  }

  async subscribe(uri: string, callback: (data: any) => void): Promise<void> {
    // Mock subscription - simulate updates every 2 seconds
    const interval = setInterval(() => {
      const data = this.testData.get(uri);
      if (data) {
        callback({ ...data, lastModified: new Date().toISOString() });
      }
    }, 2000);

    this.subscriptions.set(uri, interval);
  }

  async unsubscribe(uri: string): Promise<void> {
    const interval = this.subscriptions.get(uri);
    if (interval) {
      clearInterval(interval);
      this.subscriptions.delete(uri);
    }
  }

  private matchesPattern(uri: string, pattern: string): boolean {
    // Simple pattern matching for test
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(uri);
    }
    return uri.includes(pattern);
  }
}

// Custom tool handler for testing
class TestToolHandler extends ToolHandler {
  constructor(
    name: string = 'test-tool',
    description: string = 'Test Tool',
    inputSchema: any = {}
  ) {
    super(name, description, inputSchema);
  }

  async execute(params: any): Promise<any> {
    switch (this.name) {
      case 'calculator':
        return this.executeCalculator(params);
      case 'text-processor':
        return this.executeTextProcessor(params);
      case 'data-analyzer':
        return this.executeDataAnalyzer(params);
      case 'file-converter':
        return this.executeFileConverter(params);
      default:
        throw new Error(`Unknown tool: ${this.name}`);
    }
  }

  async validate(params: any): Promise<any> {
    // Basic validation based on tool requirements
    if (!params || typeof params !== 'object') {
      return { valid: false, errors: ['Params must be an object'] };
    }

    let isValid = false;
    switch (this.name) {
      case 'calculator':
        isValid = typeof params.expression === 'string';
        break;
      case 'text-processor':
        isValid = typeof params.text === 'string' && typeof params.operation === 'string';
        break;
      case 'data-analyzer':
        isValid = Array.isArray(params.data);
        break;
      case 'file-converter':
        isValid = typeof params.content === 'string' && typeof params.format === 'string';
        break;
      default:
        isValid = false;
    }

    return { valid: isValid, errors: isValid ? undefined : ['Validation failed'] };
  }

  private executeCalculator(params: any): any {
    const { expression } = params;

    // Simple calculator implementation
    try {
      // This is unsafe in production - just for testing
      const cleaned = expression.replace(/[^0-9+\-*/().]/g, '');
      if (!cleaned) {
        throw new Error(`Invalid expression: ${expression}`);
      }
      const result = eval(cleaned);
      return {
        success: true,
        result: {
          expression,
          result,
          type: 'number',
        },
      };
    } catch (error) {
      throw new Error(`Invalid expression: ${expression}`);
    }
  }

  private executeTextProcessor(params: any): any {
    const { text, operation } = params;

    let result;
    switch (operation) {
      case 'uppercase':
        result = { result: text.toUpperCase(), operation };
        break;
      case 'lowercase':
        result = { result: text.toLowerCase(), operation };
        break;
      case 'reverse':
        result = { result: text.split('').reverse().join(''), operation };
        break;
      case 'word-count':
        result = { result: text.split(/\s+/).length, operation, type: 'number' };
        break;
      case 'char-count':
        result = { result: text.length, operation, type: 'number' };
        break;
      default:
        throw new Error(`Unknown text operation: ${operation}`);
    }
    return { success: true, result };
  }

  private executeDataAnalyzer(params: any): any {
    const { data } = params;

    if (!Array.isArray(data) || data.length === 0) {
      return { success: false, error: 'Data must be a non-empty array' };
    }

    const numbers = data.filter((item) => typeof item === 'number');

    if (numbers.length === 0) {
      return { success: false, error: 'No numeric data found' };
    }

    const sum = numbers.reduce((acc, num) => acc + num, 0);
    const mean = sum / numbers.length;
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);

    const sortedNumbers = [...numbers].sort((a, b) => a - b);
    const median =
      sortedNumbers.length % 2 === 0
        ? (sortedNumbers[sortedNumbers.length / 2 - 1] + sortedNumbers[sortedNumbers.length / 2]) /
          2
        : sortedNumbers[Math.floor(sortedNumbers.length / 2)];

    return {
      success: true,
      result: {
        count: numbers.length,
        sum,
        mean,
        median,
        min,
        max,
        range: max - min,
      },
    };
  }

  private executeFileConverter(params: any): any {
    const { content, format } = params;

    switch (format.toLowerCase()) {
      case 'json':
        try {
          const parsed = JSON.parse(content);
          return {
            success: true,
            result: {
              format: 'json',
              valid: true,
              data: parsed,
              keys: Object.keys(parsed),
            },
          };
        } catch {
          return { success: true, result: { format: 'json', valid: false, error: 'Invalid JSON' } };
        }

      case 'csv':
        const lines = content.split('\n');
        const headers = lines[0]?.split(',') || [];
        const rows = lines.slice(1).map((line) => {
          const values = line.split(',');
          const row: any = {};
          headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim() || '';
          });
          return row;
        });

        return {
          success: true,
          result: {
            format: 'csv',
            headers,
            rows,
            rowCount: rows.length,
          },
        };

      case 'base64':
        return {
          success: true,
          result: {
            format: 'base64',
            encoded: Buffer.from(content).toString('base64'),
            originalSize: content.length,
          },
        };

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}

describe('End-to-End Integration Tests', () => {
  let server: MCPServer;
  let client: MockMCPClient;

  beforeEach(async () => {
    const config: MCPServerConfig = {
      name: 'integration-test-server',
      version: '1.0.0',
      host: 'localhost',
      port: 3000,
      maxConnections: 10,
      rateLimiting: {
        enabled: true,
        maxRequestsPerMinute: 100,
        burstSize: 20,
      },
    };

    server = MCPSystemFactory.createServer(config);

    // Register test resources
    const resourceHandler = new TestResourceHandler();
    await server.registerResource({
      uri: 'file:///test/document.txt',
      name: 'Test Document',
      permissions: { read: true },
      handler: resourceHandler,
    });

    await server.registerResource({
      uri: 'file:///test/config.json',
      name: 'Test Config',
      permissions: { read: true },
      handler: resourceHandler,
    });

    await server.registerResource({
      uri: 'file:///test/data.csv',
      name: 'Test Data',
      permissions: { read: true },
      handler: resourceHandler,
    });

    // Register test tools
    const calculatorTool = new TestToolHandler('calculator', 'Performs mathematical calculations', {
      type: 'object',
      properties: {
        expression: { type: 'string' },
      },
      required: ['expression'],
    });
    await server.registerTool({
      name: 'calculator',
      description: 'Performs mathematical calculations',
      inputSchema: {
        type: 'object',
        properties: {
          expression: { type: 'string' },
        },
        required: ['expression'],
      },
      handler: calculatorTool,
    });

    const textProcessorTool = new TestToolHandler(
      'text-processor',
      'Processes text in various ways',
      {
        type: 'object',
        properties: {
          text: { type: 'string' },
          operation: {
            type: 'string',
            enum: ['uppercase', 'lowercase', 'reverse', 'word-count', 'char-count'],
          },
        },
        required: ['text', 'operation'],
      }
    );
    await server.registerTool({
      name: 'text-processor',
      description: 'Processes text in various ways',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          operation: {
            type: 'string',
            enum: ['uppercase', 'lowercase', 'reverse', 'word-count', 'char-count'],
          },
        },
        required: ['text', 'operation'],
      },
      handler: textProcessorTool,
    });

    const dataAnalyzerTool = new TestToolHandler('data-analyzer', 'Analyzes numeric data', {
      type: 'object',
      properties: {
        data: { type: 'array', items: { type: 'number' } },
      },
      required: ['data'],
    });
    await server.registerTool({
      name: 'data-analyzer',
      description: 'Analyzes numeric data',
      inputSchema: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { type: 'number' } },
        },
        required: ['data'],
      },
      handler: dataAnalyzerTool,
    });

    const fileConverterTool = new TestToolHandler(
      'file-converter',
      'Converts files between formats',
      {
        type: 'object',
        properties: {
          content: { type: 'string' },
          format: { type: 'string', enum: ['json', 'csv', 'base64'] },
        },
        required: ['content', 'format'],
      }
    );
    await server.registerTool({
      name: 'file-converter',
      description: 'Converts files between formats',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          format: { type: 'string', enum: ['json', 'csv', 'base64'] },
        },
        required: ['content', 'format'],
      },
      handler: fileConverterTool,
    });

    await server.start(config);

    client = new MockMCPClient();

    // Setup mock client-server communication
    client.on('message', async (data: string) => {
      const message = JSON.parse(data);
      if ('method' in message) {
        // It's a request or notification
        if ('id' in message) {
          // Request - send to server and get response
          const response = await server.handleRequest(message);
          client.handleResponse(response);
        } else {
          // Notification - send to server
          if ((server as any).handleNotification) {
            await (server as any).handleNotification(message);
          }
        }
      }
    });
  });

  afterEach(async () => {
    client.close();
    await server.stop();
  });

  describe('Resource Management Workflows', () => {
    it('should complete a full resource discovery and access workflow', async () => {
      // Step 1: Discover available resources
      const listResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'list-resources',
        method: 'resources/list',
        params: {},
      });

      expect(listResponse.jsonrpc).toBe('2.0');
      expect(listResponse.id).toBe('list-resources');
      expect(listResponse.result).toHaveProperty('resources');

      const resources = (listResponse.result as any).resources;
      expect(resources).toHaveLength(3);
      expect(resources.some((r: any) => r.name === 'Test Document')).toBe(true);
      expect(resources.some((r: any) => r.name === 'Test Config')).toBe(true);
      expect(resources.some((r: any) => r.name === 'Test Data')).toBe(true);

      // Step 2: Read specific resources
      const documentResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'read-document',
        method: 'resources/read',
        params: { uri: 'file:///test/document.txt' },
      });

      expect(documentResponse.result).toHaveProperty('content');
      expect((documentResponse.result as any).content).toBe('This is a test document');

      // Step 3: Read JSON config
      const configResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'read-config',
        method: 'resources/read',
        params: { uri: 'file:///test/config.json' },
      });

      expect(configResponse.result).toHaveProperty('content');
      const configContent = JSON.parse((configResponse.result as any).content);
      expect(configContent).toEqual({ version: '1.0', debug: true });

      // Step 4: Filter resources by pattern
      const filteredResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'filter-resources',
        method: 'resources/list',
        params: { pattern: '*.json' },
      });

      const filteredResources = (filteredResponse.result as any).resources;
      expect(filteredResources).toHaveLength(1);
      expect(filteredResources[0].name).toBe('Test Config');
    });

    it('should handle resource subscription workflow', async () => {
      // Subscribe to a resource
      const subscribeResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'subscribe-document',
        method: 'resources/subscribe',
        params: { uri: 'file:///test/document.txt' },
      });

      expect(subscribeResponse.result).toHaveProperty('subscriptionId');

      // Wait for subscription updates (mocked to send updates every 2 seconds)
      // In a real test, this would involve actual file changes

      // Unsubscribe
      const unsubscribeResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'unsubscribe-document',
        method: 'resources/unsubscribe',
        params: {
          uri: 'file:///test/document.txt',
          subscriptionId: (subscribeResponse.result as any).subscriptionId,
        },
      });

      expect(unsubscribeResponse.result).toHaveProperty('success');
      expect((unsubscribeResponse.result as any).success).toBe(true);
    });
  });

  describe('Tool Execution Workflows', () => {
    it('should complete mathematical calculation workflow', async () => {
      // List available tools
      const toolsResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'list-tools',
        method: 'tools/list',
        params: {},
      });

      expect(toolsResponse.result).toHaveProperty('tools');
      const tools = (toolsResponse.result as any).tools;
      expect(tools.some((t: any) => t.name === 'calculator')).toBe(true);

      // Execute simple calculation
      const calcResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'calc-simple',
        method: 'tools/call',
        params: {
          name: 'calculator',
          arguments: { expression: '2 + 3 * 4' },
        },
      });

      expect(calcResponse.result).toHaveProperty('result');
      expect((calcResponse.result as any).result.result).toBe(14);

      // Execute complex calculation
      const complexCalcResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'calc-complex',
        method: 'tools/call',
        params: {
          name: 'calculator',
          arguments: { expression: '(10 + 5) * 2 - 7' },
        },
      });

      expect((complexCalcResponse.result as any).result.result).toBe(23);
    });

    it('should complete text processing workflow', async () => {
      const testText = 'Hello World This Is A Test';

      // Uppercase transformation
      const uppercaseResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'text-upper',
        method: 'tools/call',
        params: {
          name: 'text-processor',
          arguments: { text: testText, operation: 'uppercase' },
        },
      });

      expect((uppercaseResponse.result as any).result.result).toBe('HELLO WORLD THIS IS A TEST');

      // Word count
      const wordCountResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'text-count',
        method: 'tools/call',
        params: {
          name: 'text-processor',
          arguments: { text: testText, operation: 'word-count' },
        },
      });

      expect((wordCountResponse.result as any).result.result).toBe(6);

      // Text reversal
      const reverseResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'text-reverse',
        method: 'tools/call',
        params: {
          name: 'text-processor',
          arguments: { text: 'ABC', operation: 'reverse' },
        },
      });

      expect((reverseResponse.result as any).result.result).toBe('CBA');
    });

    it('should complete data analysis workflow', async () => {
      const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const analysisResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'analyze-data',
        method: 'tools/call',
        params: {
          name: 'data-analyzer',
          arguments: { data: testData },
        },
      });

      const analysis = (analysisResponse.result as any).result;
      expect(analysis.count).toBe(10);
      expect(analysis.sum).toBe(55);
      expect(analysis.mean).toBe(5.5);
      expect(analysis.median).toBe(5.5);
      expect(analysis.min).toBe(1);
      expect(analysis.max).toBe(10);
      expect(analysis.range).toBe(9);
    });

    it('should complete file conversion workflow', async () => {
      // Convert JSON
      const jsonData = '{"name": "test", "value": 42}';
      const jsonResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'convert-json',
        method: 'tools/call',
        params: {
          name: 'file-converter',
          arguments: { content: jsonData, format: 'json' },
        },
      });

      const jsonResult = (jsonResponse.result as any).result;
      expect(jsonResult.valid).toBe(true);
      expect(jsonResult.data).toEqual({ name: 'test', value: 42 });

      // Convert CSV
      const csvData = 'name,age\nJohn,25\nJane,30';
      const csvResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'convert-csv',
        method: 'tools/call',
        params: {
          name: 'file-converter',
          arguments: { content: csvData, format: 'csv' },
        },
      });

      const csvResult = (csvResponse.result as any).result;
      expect(csvResult.headers).toEqual(['name', 'age']);
      expect(csvResult.rows).toHaveLength(2);
      expect(csvResult.rows[0]).toEqual({ name: 'John', age: '25' });

      // Base64 encoding
      const textData = 'Hello World';
      const base64Response = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'convert-base64',
        method: 'tools/call',
        params: {
          name: 'file-converter',
          arguments: { content: textData, format: 'base64' },
        },
      });

      const base64Result = (base64Response.result as any).result;
      expect(base64Result.encoded).toBe(Buffer.from(textData).toString('base64'));
    });
  });

  describe('Complex Multi-Step Workflows', () => {
    it('should complete data processing pipeline', async () => {
      // Step 1: Read CSV data
      const csvResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'read-csv',
        method: 'resources/read',
        params: { uri: 'file:///test/data.csv' },
      });

      const csvContent = (csvResponse.result as any).content;

      // Step 2: Convert CSV to structured data
      const structuredResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'structure-csv',
        method: 'tools/call',
        params: {
          name: 'file-converter',
          arguments: { content: csvContent, format: 'csv' },
        },
      });

      const structuredData = (structuredResponse.result as any).result.rows;
      expect(structuredData).toHaveLength(2);

      // Step 3: Extract numeric data for analysis
      const ages = structuredData
        .map((row: any) => parseInt(row.age))
        .filter((age: any) => !isNaN(age));

      // Step 4: Analyze the numeric data
      const analysisResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'analyze-ages',
        method: 'tools/call',
        params: {
          name: 'data-analyzer',
          arguments: { data: ages },
        },
      });

      const analysis = (analysisResponse.result as any).result;
      expect(analysis.count).toBe(2);
      expect(analysis.mean).toBe(27.5); // (25 + 30) / 2

      // Step 5: Generate summary text
      const summaryText = `Data analysis complete: ${analysis.count} records, average age ${analysis.mean}`;

      const summaryResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'count-summary',
        method: 'tools/call',
        params: {
          name: 'text-processor',
          arguments: { text: summaryText, operation: 'word-count' },
        },
      });

      expect((summaryResponse.result as any).result.result).toBeGreaterThan(0);
    });

    it('should handle concurrent operations efficiently', async () => {
      const operations = [
        // Resource reads
        client.sendRequest({
          jsonrpc: '2.0',
          id: 'concurrent-1',
          method: 'resources/read',
          params: { uri: 'file:///test/document.txt' },
        }),

        // Tool executions
        client.sendRequest({
          jsonrpc: '2.0',
          id: 'concurrent-2',
          method: 'tools/call',
          params: {
            name: 'calculator',
            arguments: { expression: '100 * 2' },
          },
        }),

        client.sendRequest({
          jsonrpc: '2.0',
          id: 'concurrent-3',
          method: 'tools/call',
          params: {
            name: 'text-processor',
            arguments: { text: 'Concurrent Test', operation: 'uppercase' },
          },
        }),

        client.sendRequest({
          jsonrpc: '2.0',
          id: 'concurrent-4',
          method: 'tools/call',
          params: {
            name: 'data-analyzer',
            arguments: { data: [1, 2, 3, 4, 5] },
          },
        }),

        // Resource listing
        client.sendRequest({
          jsonrpc: '2.0',
          id: 'concurrent-5',
          method: 'resources/list',
          params: {},
        }),
      ];

      const startTime = performance.now();
      const results = await Promise.all(operations);
      const completionTime = performance.now() - startTime;

      // Verify all operations completed successfully
      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.jsonrpc).toBe('2.0');
        expect(result).toHaveProperty('result');
      });

      // Verify specific results
      expect((results[0].result as any).content).toBe('This is a test document');
      expect((results[1].result as any).result.result).toBe(200);
      expect((results[2].result as any).result.result).toBe('CONCURRENT TEST');
      expect((results[3].result as any).result.mean).toBe(3);
      expect((results[4].result as any).resources).toHaveLength(3);

      console.log(`Concurrent operations completed in ${completionTime.toFixed(2)}ms`);

      // Should complete much faster than sequential execution
      expect(completionTime).toBeLessThan(1000); // Less than 1 second for all operations
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle resource not found gracefully', async () => {
      const response = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'missing-resource',
        method: 'resources/read',
        params: { uri: 'file:///nonexistent/file.txt' },
      });

      expect(response).toHaveProperty('error');
      expect((response as any).error.code).toBe(-32001); // MCP error code for resource not found
    });

    it('should handle invalid tool parameters', async () => {
      const response = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'invalid-params',
        method: 'tools/call',
        params: {
          name: 'calculator',
          arguments: { expression: 'invalid expression with letters' },
        },
      });

      expect(response).toHaveProperty('error');
      expect((response as any).error.message).toContain('Invalid expression');
    });

    it('should handle malformed JSON-RPC requests', async () => {
      // This would normally be tested at the transport layer
      // For now, test server validation directly
      const malformedRequest = {
        jsonrpc: '1.0', // Wrong version
        id: 'test',
        method: 'test',
      };

      const response = await server.handleRequest(malformedRequest as any);
      expect(response).toHaveProperty('error');
      expect((response as any).error.code).toBe(-32600); // Invalid request
    });

    it('should recover from tool execution errors', async () => {
      // Execute a tool that will fail
      const failResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'will-fail',
        method: 'tools/call',
        params: {
          name: 'calculator',
          arguments: { expression: 'undefined_variable' },
        },
      });

      expect(failResponse).toHaveProperty('error');

      // Verify that subsequent tool calls still work
      const successResponse = await client.sendRequest({
        jsonrpc: '2.0',
        id: 'should-work',
        method: 'tools/call',
        params: {
          name: 'calculator',
          arguments: { expression: '2 + 2' },
        },
      });

      expect(successResponse.result).toHaveProperty('result');
      expect((successResponse.result as any).result.result).toBe(4);
    });
  });

  describe('Performance Under Load', () => {
    it('should maintain responsiveness under moderate load', async () => {
      const requestCount = 100;
      const requests: Promise<MCPResponse>[] = [];

      const startTime = performance.now();

      // Generate mixed load
      for (let i = 0; i < requestCount; i++) {
        const requestType = i % 4;
        let request: MCPRequest;

        switch (requestType) {
          case 0:
            request = {
              jsonrpc: '2.0',
              id: `load-${i}`,
              method: 'resources/list',
              params: {},
            };
            break;
          case 1:
            request = {
              jsonrpc: '2.0',
              id: `load-${i}`,
              method: 'resources/read',
              params: { uri: 'file:///test/document.txt' },
            };
            break;
          case 2:
            request = {
              jsonrpc: '2.0',
              id: `load-${i}`,
              method: 'tools/call',
              params: {
                name: 'calculator',
                arguments: { expression: `${i} + 1` },
              },
            };
            break;
          default:
            request = {
              jsonrpc: '2.0',
              id: `load-${i}`,
              method: 'tools/call',
              params: {
                name: 'text-processor',
                arguments: { text: `Test ${i}`, operation: 'uppercase' },
              },
            };
        }

        requests.push(client.sendRequest(request));
      }

      const responses = await Promise.all(requests);
      const completionTime = performance.now() - startTime;

      // Verify all requests completed successfully
      expect(responses).toHaveLength(requestCount);
      responses.forEach((response) => {
        expect(response.jsonrpc).toBe('2.0');
        if ('error' in response) {
          console.error('Unexpected error:', response.error);
        }
        expect(response).toHaveProperty('result');
      });

      const throughput = requestCount / (completionTime / 1000);
      console.log(
        `Load test: ${requestCount} requests in ${completionTime.toFixed(2)}ms (${throughput.toFixed(2)} req/sec)`
      );

      // Performance expectations
      expect(throughput).toBeGreaterThan(50); // At least 50 requests per second
      expect(completionTime).toBeLessThan(10000); // Complete within 10 seconds
    });
  });
});
