import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import { AgentApiGrantsService } from '../agent-api-grants.service';
import { AgentService } from '../agent.service';
import {
  evaluateConditionExpression,
  ExpressionEvalError,
  ExpressionSyntaxError,
} from './safe-expression-evaluator';

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
  /**
   * Which named output handle this edge left from. ReactFlow sets this
   * automatically whenever a node has more than one output handle (e.g. a
   * condition node's 'true'/'false' pair) — ordinary single-output nodes'
   * edges may have this unset, which is fine: it only matters for nodes
   * whose execution computes a specific `branch` to follow.
   */
  sourceHandle?: string | null;
}

interface RuntimeContext {
  executionId: string;
  input: any;
  nodeOutputs: Record<string, any>;
  /**
   * The user who owns this execution (resolved by the controller from the
   * saved workflow's `creatorId`, or from the request body for ad-hoc
   * definition runs). Required for anything that spends a user's own
   * provider budget — agent-node execution resolves grants against this.
   */
  userId?: string | null;
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

  constructor(
    private readonly db: DatabaseService,
    private readonly agentApiGrants: AgentApiGrantsService,
    private readonly agents: AgentService
  ) {}

  /**
   * Run a workflow execution with best-effort node orchestration.
   *
   * @param userId The workflow's owning user, when known — needed to resolve
   *   per-user agent grants for real agent-node execution. Missing for ad-hoc
   *   definition runs with no authenticated caller identity; agent nodes will
   *   fail with a clear "no owning user" error rather than silently no-op in
   *   that case, since spending a provider budget with no accountable owner
   *   is not a safe default.
   */
  async run(
    executionId: string,
    definition: any,
    input: any = {},
    userId?: string | null
  ): Promise<void> {
    this.logger.log(`Running workflow execution ${executionId}`);
    const nodes: RuntimeNode[] = Array.isArray(definition?.nodes) ? definition.nodes : [];
    const edges: RuntimeEdge[] = Array.isArray(definition?.edges) ? definition.edges : [];
    const nodeLogs: NodeExecutionLog[] = [];
    const runtimeContext: RuntimeContext = {
      executionId,
      input,
      nodeOutputs: {},
      userId,
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

        const outgoingEdges = edges.filter((e: any) => e.source === node.id);
        const nextEdges = this.selectOutgoingEdges(
          node,
          outgoingEdges,
          runtimeContext.nodeOutputs[node.id]
        );
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

  private classifyNode(
    node: RuntimeNode
  ): 'webhook-trigger' | 'webhook-action' | 'http-request' | 'condition' | 'agent' | 'generic' {
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

    // Matches both the shared package's node type ('agent') and Tauri's
    // (also 'agent') — see packages/workflow-builder/src/nodes/agent-node.tsx
    // and apps/tauri-desktop/src/pages/WorkflowBuilder.tsx's nodeTypes map.
    // These two surfaces use different config shapes for the same type key;
    // executeAgentNode() resolves both.
    if (typeHints.includes('agent') && !typeHints.includes('subworkflow')) {
      return 'agent';
    }

    return 'generic';
  }

  /**
   * Decide which of a node's outgoing edges actually fire, given what it
   * just computed. Only condition-classified nodes branch — every other
   * node type keeps the original "every outgoing edge fires" behavior,
   * matching what a node with a single default output handle means.
   *
   * For a condition node, `output.branch` names the handle id
   * ('true'/'false') the UI's two named output handles produce; only edges
   * whose recorded `sourceHandle` matches actually enqueue. If no edge
   * matches — e.g. a workflow whose edges predate this fix and never
   * recorded a sourceHandle — fall back to the previous both-branches
   * behavior rather than silently running nothing, but log it: that
   * workflow's edges should be re-saved from the canvas to pick up real
   * branch routing.
   */
  private selectOutgoingEdges(
    node: RuntimeNode,
    outgoingEdges: RuntimeEdge[],
    output: any
  ): RuntimeEdge[] {
    if (this.classifyNode(node) !== 'condition') {
      return outgoingEdges;
    }

    const branch = output && typeof output === 'object' ? output.branch : undefined;
    if (typeof branch !== 'string') {
      return outgoingEdges;
    }

    const matching = outgoingEdges.filter((edge) => edge.sourceHandle === branch);
    if (matching.length === 0 && outgoingEdges.length > 0) {
      this.logger.warn(
        `Condition node ${node.id} computed branch '${branch}' but no outgoing edge has a matching sourceHandle — falling back to firing all ${outgoingEdges.length} edge(s). Re-save this workflow from the canvas to record branch routing.`
      );
      return outgoingEdges;
    }
    return matching;
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
      case 'agent':
        return this.executeAgentNode(node, context);
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

    // `config.condition` (a JS-expression string) is what condition-node.tsx
    // — the only UI that has ever produced condition nodes — actually
    // writes. See packages/workflow-builder/src/nodes/condition-node.tsx.
    if (typeof cfg.condition === 'string' && cfg.condition.trim().length > 0) {
      try {
        const passed = evaluateConditionExpression(cfg.condition, {
          input: payload,
          context: { nodeOutputs: context.nodeOutputs, executionId: context.executionId },
        });
        return {
          condition: cfg.condition,
          passed,
          branch: passed ? 'true' : 'false',
        };
      } catch (error) {
        if (error instanceof ExpressionSyntaxError || error instanceof ExpressionEvalError) {
          throw new Error(`Condition node ${node.id} has an invalid expression: ${error.message}`);
        }
        throw error;
      }
    }

    // No UI has ever produced this shape, but keep it as a fallback rather
    // than break whatever might already rely on it — see
    // docs/development/WORKFLOW_BUILDER_PACKAGE_BOUNDARY.md-style caution
    // about not assuming a shape is truly unused just because no known
    // caller writes it today.
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

  /**
   * Real agent invocation, spending the owning user's own provider budget
   * through the same AgentApiGrantsService the HTTP agent-proxy uses — never
   * a bypass of grant/rate/budget enforcement, even from server-side code.
   *
   * Two config shapes are both legitimate and both handled:
   *  - shared package (packages/workflow-builder/src/nodes/agent-node.tsx):
   *    `config.agentId` — a registered agent, resolved to its provider.
   *  - Tauri desktop (apps/tauri-desktop/src/pages/WorkflowBuilder.tsx):
   *    `config.provider` + `config.prompt` directly, no registered agent.
   *    This shape has no grant to resolve against (grants are scoped to a
   *    specific agent, not an ad-hoc provider call) — it throws a clear,
   *    actionable error rather than silently no-op or bypass the grant
   *    system. Registering the ad-hoc call as a real agent first is the
   *    correct fix on the workflow-authoring side, not a server-side hack.
   */
  private async executeAgentNode(node: RuntimeNode, context: RuntimeContext): Promise<any> {
    const cfg = this.resolveNodeConfig(node);
    const agentId = typeof cfg.agentId === 'string' ? cfg.agentId.trim() : '';

    if (!agentId) {
      throw new Error(
        `Agent node ${node.id} has no agentId — ad-hoc provider+prompt agent nodes ` +
          `(the Tauri desktop shape) cannot execute yet because grants are issued per ` +
          `registered agent, not per raw provider call. Register this as an agent ` +
          `first, then reference it by agentId.`
      );
    }

    if (!context.userId) {
      throw new Error(
        `Agent node ${node.id} cannot execute: this workflow execution has no owning ` +
          `user, so there is no one's grant/budget to spend against.`
      );
    }

    const agent = await this.agents.findAgentById(agentId, context.userId);
    const provider = (agent.provider || '').trim().toLowerCase();
    if (!provider) {
      throw new Error(`Agent ${agentId} has no configured provider — cannot execute.`);
    }

    const grant = await this.agentApiGrants.findActiveGrantForAgentProvider(
      context.userId,
      agentId,
      provider
    );
    if (!grant) {
      throw new Error(
        `No active API grant for agent ${agentId} on provider '${provider}'. Create one ` +
          `(POST /agent-grants) before running workflows that use this agent.`
      );
    }

    const prompt =
      (typeof cfg.prompt === 'string' && cfg.prompt.trim()) ||
      (typeof cfg.customPrompt === 'string' && cfg.customPrompt.trim()) ||
      '';
    if (!prompt) {
      throw new Error(`Agent node ${node.id} has no prompt configured.`);
    }

    const response = await this.agentApiGrants.executeProxyForGrant(
      grant,
      { messages: [{ role: 'user', content: prompt }] },
      Date.now()
    );

    return {
      agentId,
      provider,
      grantId: grant.id,
      response,
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
        payload && typeof payload === 'object' ? Object.keys(payload).slice(0, 8) : typeof payload,
    };
  }

  private readPath(payload: any, fieldPath: string): any {
    if (!fieldPath || typeof payload !== 'object' || payload === null) {
      return payload?.[fieldPath];
    }

    return fieldPath
      .split('.')
      .filter(Boolean)
      .reduce(
        (acc: any, key: string) => (acc === undefined || acc === null ? acc : acc[key]),
        payload
      );
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
