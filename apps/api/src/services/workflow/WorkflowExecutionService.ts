import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';

interface RuntimeNode {
  id: string;
  type?: string;
  data?: Record<string, any>;
  config?: Record<string, any>;
  [key: string]: any;
}

interface RuntimeEdge {
  source: string;
  target: string;
}

interface RuntimeContext {
  executionId: string;
  input: any;
  nodeOutputs: Record<string, any>;
}

interface NodeExecutionLog {
  nodeId: string;
  nodeType: string;
  status: 'completed' | 'failed';
  startedAt: string;
  completedAt: string;
  durationMs: number;
  output?: any;
  error?: string;
}

@Injectable()
export class WorkflowExecutionService {
  private readonly logger = new Logger(WorkflowExecutionService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Run a workflow execution with best-effort node orchestration.
   */
  async run(executionId: string, definition: any, input: any = {}): Promise<void> {
    this.logger.log(`Running workflow execution ${executionId}`);
    const nodes: RuntimeNode[] = Array.isArray(definition?.nodes) ? definition.nodes : [];
    const edges: RuntimeEdge[] = Array.isArray(definition?.edges) ? definition.edges : [];
    const nodeLogs: NodeExecutionLog[] = [];
    const runtimeContext: RuntimeContext = {
      executionId,
      input,
      nodeOutputs: {},
    };

    try {
      await this.db.workflows.updateExecution(executionId, {
        status: 'RUNNING',
        startedAt: new Date(),
      } as any);

      if (nodes.length === 0) {
        throw new Error('Cannot execute workflow without nodes');
      }

      const targetIds = new Set(edges.map((e: any) => e.target));
      const startNodes = nodes.filter((n: any) => !targetIds.has(n.id));

      if (startNodes.length === 0 && nodes.length > 0) {
        startNodes.push(nodes[0]);
      }

      this.logger.log(`Found ${startNodes.length} start nodes for execution ${executionId}`);

      const visited = new Set<string>();
      const queue = [...startNodes];

      while (queue.length > 0) {
        const node = queue.shift() as RuntimeNode | undefined;
        if (!node || visited.has(node.id)) continue;

        visited.add(node.id);
        this.logger.log(`Executing node ${node.id} (${node.type})`);

        const stepStart = Date.now();
        const startedAt = new Date().toISOString();

        try {
          const output = await this.executeNode(node, runtimeContext);
          runtimeContext.nodeOutputs[node.id] = output;
          nodeLogs.push({
            nodeId: node.id,
            nodeType: this.getNodeTypeLabel(node),
            status: 'completed',
            startedAt,
            completedAt: new Date().toISOString(),
            durationMs: Date.now() - stepStart,
            output,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Node execution failed';
          nodeLogs.push({
            nodeId: node.id,
            nodeType: this.getNodeTypeLabel(node),
            status: 'failed',
            startedAt,
            completedAt: new Date().toISOString(),
            durationMs: Date.now() - stepStart,
            error: message,
          });
          throw new Error(`Node ${node.id} failed: ${message}`);
        }

        const nextEdges = edges.filter((e: any) => e.source === node.id);
        for (const edge of nextEdges) {
          const nextNode = nodes.find((n: any) => n.id === edge.target);
          if (nextNode && !visited.has(nextNode.id)) {
            queue.push(nextNode);
          }
        }
      }

      await this.db.workflows.updateExecution(executionId, {
        status: 'COMPLETED',
        completedAt: new Date(),
        output: {
          input: runtimeContext.input,
          nodeOutputs: runtimeContext.nodeOutputs,
          nodeCount: Object.keys(runtimeContext.nodeOutputs).length,
        },
        nodeExecutions: nodeLogs,
        logs: nodeLogs.map((log) => ({
          timestamp: log.completedAt,
          level: log.status === 'failed' ? 'error' : 'info',
          message:
            log.status === 'failed'
              ? `Node ${log.nodeId} failed: ${log.error}`
              : `Node ${log.nodeId} completed`,
          nodeId: log.nodeId,
          durationMs: log.durationMs,
        })),
      } as any);

      this.logger.log(`Workflow execution ${executionId} completed successfully`);
    } catch (error) {
      this.logger.error(`Workflow execution ${executionId} failed: ${error}`);
      await this.db.workflows.updateExecution(executionId, {
        status: 'FAILED',
        completedAt: new Date(),
        error: (error as Error).message,
        nodeExecutions: nodeLogs,
        logs: nodeLogs.map((log) => ({
          timestamp: log.completedAt,
          level: log.status === 'failed' ? 'error' : 'info',
          message:
            log.status === 'failed'
              ? `Node ${log.nodeId} failed: ${log.error}`
              : `Node ${log.nodeId} completed`,
          nodeId: log.nodeId,
          durationMs: log.durationMs,
        })),
      } as any);
    }
  }

  private getNodeTypeLabel(node: RuntimeNode): string {
    return String(node.type || node.data?.type || 'unknown').toLowerCase();
  }

  private classifyNode(node: RuntimeNode):
    | 'webhook-trigger'
    | 'webhook-action'
    | 'http-request'
    | 'condition'
    | 'generic' {
    const typeHints = [
      String(node.type || ''),
      String(node.data?.type || ''),
      String(node.data?.label || ''),
      String(node.id || ''),
    ]
      .join(' ')
      .toLowerCase();

    const cfg = this.resolveNodeConfig(node);
    const hasUrl = typeof cfg.url === 'string' && cfg.url.trim().length > 0;

    if (typeHints.includes('webhook') && typeHints.includes('trigger')) {
      return 'webhook-trigger';
    }

    if (typeHints.includes('webhook') && hasUrl) {
      return 'webhook-action';
    }

    if ((typeHints.includes('http') || typeHints.includes('api')) && hasUrl) {
      return 'http-request';
    }

    if (
      typeHints.includes('condition') ||
      typeHints.includes('branch') ||
      typeHints.includes('if')
    ) {
      return 'condition';
    }

    return 'generic';
  }

  private resolveNodeConfig(node: RuntimeNode): Record<string, any> {
    const dataConfig =
      node.data && typeof node.data.config === 'object' && node.data.config !== null
        ? node.data.config
        : {};
    const nodeConfig = node.config && typeof node.config === 'object' ? node.config : {};
    return {
      ...dataConfig,
      ...nodeConfig,
    };
  }

  private resolveNodeInput(node: RuntimeNode, context: RuntimeContext): any {
    const config = this.resolveNodeConfig(node);
    const inputFrom = String(config.inputFrom || '').trim();
    if (inputFrom && context.nodeOutputs[inputFrom] !== undefined) {
      return context.nodeOutputs[inputFrom];
    }
    return context.input;
  }

  private async executeNode(node: RuntimeNode, context: RuntimeContext): Promise<any> {
    const classifiedType = this.classifyNode(node);
    switch (classifiedType) {
      case 'webhook-trigger':
        return this.executeWebhookTriggerNode(node, context);
      case 'webhook-action':
      case 'http-request':
        return this.executeHttpNode(node, context);
      case 'condition':
        return this.executeConditionNode(node, context);
      default:
        return this.executeGenericNode(node, context);
    }
  }

  private executeWebhookTriggerNode(node: RuntimeNode, context: RuntimeContext): any {
    const incoming = context.input ?? {};
    return {
      trigger: 'webhook',
      nodeId: node.id,
      receivedAt: new Date().toISOString(),
      payload: incoming.payload ?? incoming,
      metadata: incoming.__trigger ?? null,
    };
  }

  private async executeHttpNode(node: RuntimeNode, context: RuntimeContext): Promise<any> {
    const config = this.resolveNodeConfig(node);
    const url = String(config.url || config.endpoint || '').trim();

    if (!url) {
      throw new Error('HTTP/webhook node is missing url/endpoint in config');
    }

    const method = String(config.method || 'POST').toUpperCase();
    const timeoutMs = Number(config.timeoutMs || config.timeout || 10000);
    const sourceInput = this.resolveNodeInput(node, context);
    const bodyPayload = config.body !== undefined ? config.body : sourceInput;

    const headers: Record<string, string> = {};
    if (config.headers && typeof config.headers === 'object') {
      for (const [key, value] of Object.entries(config.headers)) {
        if (value !== undefined && value !== null) {
          headers[String(key)] = String(value);
        }
      }
    }

    const shouldSendBody = !['GET', 'HEAD'].includes(method);
    if (shouldSendBody && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: shouldSendBody ? JSON.stringify(bodyPayload ?? {}) : undefined,
        signal: abortController.signal,
      });

      const rawText = await response.text();
      let responseBody: any = rawText;
      if (rawText) {
        try {
          responseBody = JSON.parse(rawText);
        } catch {
          responseBody = rawText;
        }
      }

      if (!response.ok && config.failOnStatus !== false) {
        throw new Error(`HTTP ${response.status} from ${url}`);
      }

      return {
        request: { url, method, timeoutMs },
        response: {
          status: response.status,
          ok: response.ok,
          body: responseBody,
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private executeConditionNode(node: RuntimeNode, context: RuntimeContext): any {
    const cfg = this.resolveNodeConfig(node);
    const payload = this.resolveNodeInput(node, context) || {};
    const field = String(cfg.field || 'status');
    const operator = String(cfg.operator || 'eq').toLowerCase();
    const expected = cfg.value;
    const actual = this.readPath(payload, field);

    const passed = this.compareCondition(actual, operator, expected);

    return {
      field,
      operator,
      expected,
      actual,
      passed,
      branch: passed ? cfg.trueBranch || 'true' : cfg.falseBranch || 'false',
    };
  }

  private async executeGenericNode(node: RuntimeNode, context: RuntimeContext): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const payload = this.resolveNodeInput(node, context);
    return {
      nodeId: node.id,
      nodeType: this.getNodeTypeLabel(node),
      executedAt: new Date().toISOString(),
      inputPreview:
        payload && typeof payload === 'object'
          ? Object.keys(payload).slice(0, 8)
          : typeof payload,
    };
  }

  private readPath(payload: any, fieldPath: string): any {
    if (!fieldPath || typeof payload !== 'object' || payload === null) {
      return payload?.[fieldPath];
    }

    return fieldPath
      .split('.')
      .filter(Boolean)
      .reduce((acc: any, key: string) => (acc === undefined || acc === null ? acc : acc[key]), payload);
  }

  private compareCondition(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'eq':
      case 'equals':
        return actual === expected;
      case 'neq':
      case 'not_equals':
        return actual !== expected;
      case 'contains':
        return String(actual ?? '').includes(String(expected ?? ''));
      case 'gt':
        return Number(actual) > Number(expected);
      case 'gte':
        return Number(actual) >= Number(expected);
      case 'lt':
        return Number(actual) < Number(expected);
      case 'lte':
        return Number(actual) <= Number(expected);
      case 'exists':
        return actual !== undefined && actual !== null;
      case 'truthy':
        return Boolean(actual);
      case 'falsy':
        return !actual;
      default:
        return actual === expected;
    }
  }
}
