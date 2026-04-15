# AG-UI Integration Guide for The New Fuse

This guide explains how to integrate AG-UI visualization generation into your
existing The New Fuse agent workflows.

## Table of Contents

- [Quick Start](#quick-start)
- [Integration Patterns](#integration-patterns)
- [Use Cases](#use-cases)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Ensure AG-UI is Running

The AG-UI module is automatically started when The New Fuse backend launches:

```bash
cd /path/to/The-New-Fuse
pnpm run docker:start  # Start PostgreSQL, Redis
pnpm run dev           # Start all services (includes AG-UI on port 8765)
```

Verify AG-UI is running:

```bash
# Check logs for AG-UI startup message
# Expected: "AG-UI Orchestrator started on port 8765"
```

### 2. Choose Your Integration Method

**Method A: WebSocket Agent (External)**

- For Python, Node.js, or other external agents
- Connect via WebSocket protocol
- See `examples/` directory for code samples

**Method B: Programmatic API (Internal)**

- For NestJS services within The New Fuse
- Direct TypeScript/NestJS integration
- No WebSocket needed

**Method C: REST API Wrapper**

- Create HTTP endpoint that wraps AG-UI calls
- Useful for frontend or external HTTP clients
- Requires custom controller

## Integration Patterns

### Pattern 1: External Agent via WebSocket

**Use When:** Building standalone agents in Python, Node.js, etc.

**Example:** Analytics agent that generates visualizations

```python
# analytics_agent.py
from agui_client import AGUIAgent

class AnalyticsAgent(AGUIAgent):
    async def analyze_system(self):
        # 1. Collect metrics
        metrics = self.collect_system_metrics()

        # 2. Generate visualization
        result = await self.send_request('visualization.generate', {
            'type': 'monitoring',
            'data': metrics,
            'title': f'System Metrics - {datetime.now()}',
            'aiInsights': self.generate_insights(metrics)
        })

        # 3. Save visualization path
        await self.save_artifact(result['filePath'])

        return result

# Usage
agent = AnalyticsAgent('analytics-agent-1')
await agent.connect()
result = await agent.analyze_system()
```

### Pattern 2: NestJS Service Integration

**Use When:** Building features within The New Fuse backend

**Example:** Agent execution service generates visualization on completion

```typescript
// apps/backend/src/modules/agent-executions/agent-executions.service.ts
import { Injectable } from '@nestjs/common';
import { AGUIService } from '@the-new-fuse/ag-ui-core';

@Injectable()
export class AgentExecutionsService {
  constructor(private aguiService: AGUIService) {}

  async completeExecution(executionId: string) {
    // 1. Get execution data
    const execution = await this.getExecution(executionId);
    const agentFlow = this.buildAgentFlowData(execution);

    // 2. Generate visualization
    const vizResult = await this.aguiService.generateVisualization({
      type: 'agent-flow',
      data: agentFlow,
      title: `Execution #${executionId} - Agent Flow`,
      aiInsights: this.analyzeExecution(execution),
    });

    // 3. Save visualization URL to execution record
    await this.updateExecution(executionId, {
      status: 'completed',
      visualizationPath: vizResult.filePath,
    });

    return vizResult;
  }

  private buildAgentFlowData(execution: any) {
    return {
      nodes: execution.agents.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        status: a.status,
      })),
      edges: execution.communications.map((c) => ({
        source: c.fromAgent,
        target: c.toAgent,
        type: c.messageType,
        weight: c.frequency,
      })),
    };
  }
}
```

### Pattern 3: Workflow Step Integration

**Use When:** Adding visualization generation to workflow steps

**Example:** Workflow that generates report at completion

```typescript
// apps/backend/src/modules/orchestrator/workflow-executor.service.ts
import { Injectable } from '@nestjs/common';
import { AGUIService } from '@the-new-fuse/ag-ui-core';

@Injectable()
export class WorkflowExecutorService {
  constructor(private aguiService: AGUIService) {}

  async executeWorkflow(workflowId: string) {
    const workflow = await this.loadWorkflow(workflowId);
    const results = [];

    // Execute each step
    for (const step of workflow.steps) {
      const result = await this.executeStep(step);
      results.push(result);
    }

    // Generate workflow visualization on completion
    const vizResult = await this.generateWorkflowVisualization(
      workflow,
      results
    );

    return {
      workflowId,
      status: 'completed',
      results,
      visualization: vizResult.filePath,
    };
  }

  private async generateWorkflowVisualization(workflow: any, results: any[]) {
    const data = {
      nodes: workflow.steps.map((step, idx) => ({
        id: step.id,
        name: step.name,
        type: step.type,
        status: results[idx].status,
        duration: results[idx].duration,
      })),
      edges: workflow.dependencies.map((dep) => ({
        source: dep.from,
        target: dep.to,
        type: 'depends',
        critical: dep.critical,
      })),
    };

    return await this.aguiService.generateVisualization({
      type: 'workflow-deps',
      data,
      title: `Workflow: ${workflow.name}`,
      aiInsights: this.analyzeWorkflowPerformance(results),
    });
  }
}
```

### Pattern 4: REST API Endpoint

**Use When:** Exposing visualization generation via HTTP API

**Example:** Create endpoint for on-demand visualizations

```typescript
// apps/backend/src/api/visualizations/visualizations.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AGUIService } from '@the-new-fuse/ag-ui-core';

@Controller('api/visualizations')
export class VisualizationsController {
  constructor(private aguiService: AGUIService) {}

  @Post('generate')
  async generateVisualization(
    @Body()
    request: {
      type: string;
      data: any;
      title: string;
      aiInsights?: string;
    }
  ) {
    const result = await this.aguiService.generateVisualization(request);

    return {
      success: true,
      filePath: result.filePath,
      publicUrl: this.getPublicUrl(result.filePath),
      createdAt: new Date(),
    };
  }

  @Post('agent-flow')
  async generateAgentFlow(@Body() body: { executionId: string }) {
    // Fetch execution data
    const execution = await this.getExecution(body.executionId);

    // Generate visualization
    const result = await this.aguiService.generateVisualization({
      type: 'agent-flow',
      data: this.buildAgentFlowData(execution),
      title: `Execution #${body.executionId}`,
      aiInsights: '<p>Agent execution flow visualization</p>',
    });

    return result;
  }

  private getPublicUrl(filePath: string): string {
    // If using cloud storage, upload and return public URL
    // For local files, return file:// URL or serve via static endpoint
    return `file://${filePath}`;
  }
}
```

### Pattern 5: Event-Driven Visualization

**Use When:** Automatically generate visualizations on system events

**Example:** Generate visualization when workflow completes

```typescript
// apps/backend/src/modules/orchestrator/orchestrator.service.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AGUIService } from '@the-new-fuse/ag-ui-core';

@Injectable()
export class OrchestratorService {
  constructor(
    private aguiService: AGUIService,
    private eventBus: EventBus
  ) {}

  @OnEvent('workflow.completed')
  async handleWorkflowCompleted(event: {
    workflowId: string;
    duration: number;
    steps: any[];
  }) {
    console.log(
      `Workflow ${event.workflowId} completed, generating visualization...`
    );

    const vizResult = await this.aguiService.generateVisualization({
      type: 'workflow-deps',
      data: this.buildWorkflowData(event),
      title: `Workflow Execution: ${event.workflowId}`,
      aiInsights: `
        <div style="padding: 20px; background: #f0f7ff; border-radius: 8px;">
          <h3>Workflow Summary</h3>
          <p>Total Duration: ${event.duration}ms</p>
          <p>Steps Executed: ${event.steps.length}</p>
          <p>Status: Completed Successfully</p>
        </div>
      `,
    });

    // Emit event with visualization
    this.eventBus.emit('visualization.generated', {
      workflowId: event.workflowId,
      filePath: vizResult.filePath,
    });
  }

  @OnEvent('agent.registered')
  async handleAgentRegistered(event: {
    agentId: string;
    capabilities: string[];
  }) {
    // Generate updated agent ecosystem visualization
    const agents = await this.getAllAgents();

    const vizResult = await this.aguiService.generateVisualization({
      type: 'agent-flow',
      data: this.buildAgentEcosystemData(agents),
      title: 'Agent Ecosystem - Updated',
      aiInsights: `<p>New agent registered: ${event.agentId}</p>`,
    });

    console.log(`Agent ecosystem visualization updated: ${vizResult.filePath}`);
  }
}
```

## Use Cases

### Use Case 1: Agent Execution Reporting

**Scenario:** After each agent execution, generate a visual report

```typescript
@Injectable()
export class AgentReportingService {
  constructor(private aguiService: AGUIService) {}

  async generateExecutionReport(executionId: string) {
    const execution = await this.getExecutionData(executionId);

    const result = await this.aguiService.generateVisualization({
      type: 'agent-flow',
      data: {
        nodes: execution.agents,
        edges: execution.communications,
      },
      title: `Agent Execution Report - ${executionId}`,
      aiInsights: this.generateAIAnalysis(execution),
    });

    // Email report to stakeholders
    await this.emailReport(result.filePath, execution.stakeholders);

    return result;
  }
}
```

### Use Case 2: Real-Time System Monitoring

**Scenario:** Generate live system health dashboard

```typescript
@Injectable()
export class MonitoringService {
  constructor(private aguiService: AGUIService) {}

  @Cron('*/5 * * * *') // Every 5 minutes
  async generateMonitoringDashboard() {
    const metrics = await this.collectSystemMetrics();

    const result = await this.aguiService.generateVisualization({
      type: 'monitoring',
      data: metrics,
      title: `System Health - ${new Date().toLocaleString()}`,
      aiInsights: this.detectAnomalies(metrics),
    });

    // Store in time-series database
    await this.storeVisualization(result.filePath);

    return result;
  }
}
```

### Use Case 3: Workflow Dependency Analysis

**Scenario:** Visualize workflow critical paths before execution

```typescript
@Injectable()
export class WorkflowPlannerService {
  constructor(private aguiService: AGUIService) {}

  async planWorkflow(workflowDefinition: any) {
    // Analyze dependencies
    const analysis = this.analyzeDependencies(workflowDefinition);

    // Generate visualization
    const result = await this.aguiService.generateVisualization({
      type: 'workflow-deps',
      data: {
        nodes: workflowDefinition.steps,
        edges: workflowDefinition.dependencies,
      },
      title: `Workflow Plan: ${workflowDefinition.name}`,
      aiInsights: `
        <div style="padding: 20px;">
          <h3>Critical Path Analysis</h3>
          <p><strong>Total Duration:</strong> ${analysis.totalDuration}ms</p>
          <p><strong>Critical Path:</strong> ${analysis.criticalPath.join(' → ')}</p>
          <p><strong>Parallelizable Steps:</strong> ${analysis.parallelSteps.length}</p>
        </div>
      `,
    });

    return {
      analysis,
      visualization: result.filePath,
    };
  }
}
```

## API Reference

### AGUIService Methods

#### `generateVisualization(request: VisualizationRequest): Promise<VisualizationResult>`

Generate a self-contained HTML visualization.

**Parameters:**

- `type` - Visualization type (`'agent-flow'`, `'service-map'`,
  `'workflow-deps'`, etc.)
- `data` - Visualization data (structure depends on type)
- `title` - Visualization title
- `aiInsights` (optional) - HTML content with AI analysis

**Returns:**

- `success` - Boolean indicating success
- `filePath` - Absolute path to generated HTML file
- `html` - Complete HTML content

#### `getActiveSessions(): SessionInfo[]`

Get all active AG-UI agent sessions.

**Returns:** Array of session info objects with:

- `id` - Session ID
- `agentId` - Agent identifier
- `createdAt` - Session creation timestamp
- `lastActivity` - Last activity timestamp
- `stateSize` - Number of state variables

#### `notifyAgent(sessionId: string, method: string, params: any): void`

Send notification to specific agent session.

#### `registerHandler(method: string, handler: Function): void`

Register custom AG-UI protocol handler.

## Best Practices

### 1. Visualization Timing

**❌ Don't:**

```typescript
// Generating visualizations too frequently
for (const item of largeArray) {
  await aguiService.generateVisualization({...}); // Slow!
}
```

**✅ Do:**

```typescript
// Batch data, generate once
const allData = largeArray.map(item => processItem(item));
await aguiService.generateVisualization({
  type: 'agent-flow',
  data: { nodes: allData, edges: [...] }
});
```

### 2. AI Insights Generation

**❌ Don't:**

```typescript
aiInsights: '<p>Analysis complete</p>'; // Generic, not useful
```

**✅ Do:**

```typescript
aiInsights: `
  <div style="padding: 20px; background: #f0f7ff; border-radius: 8px;">
    <h3>Performance Analysis</h3>
    <ul>
      <li><strong>Average Response Time:</strong> ${avgResponseTime}ms</li>
      <li><strong>Success Rate:</strong> ${successRate}%</li>
      <li><strong>Bottleneck:</strong> ${bottleneckAgent}</li>
    </ul>
    <p><strong>Recommendation:</strong> ${recommendation}</p>
  </div>
`;
```

### 3. Error Handling

**❌ Don't:**

```typescript
const result = await aguiService.generateVisualization({...});
// No error handling
```

**✅ Do:**

```typescript
try {
  const result = await aguiService.generateVisualization({...});
  return result;
} catch (error) {
  console.error('Visualization generation failed:', error);
  // Fallback: return data in JSON format
  return { type: 'json', data: rawData };
}
```

### 4. File Management

**❌ Don't:**

```typescript
// Let visualizations pile up indefinitely
const result = await aguiService.generateVisualization({...});
// Never clean up old files
```

**✅ Do:**

```typescript
const result = await aguiService.generateVisualization({...});

// Store reference in database
await this.db.visualization.create({
  filePath: result.filePath,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
});

// Schedule cleanup job
@Cron('0 0 * * *') // Daily at midnight
async cleanupOldVisualizations() {
  const expired = await this.db.visualization.findExpired();
  for (const viz of expired) {
    await fs.unlink(viz.filePath);
    await this.db.visualization.delete(viz.id);
  }
}
```

## Troubleshooting

### AG-UI Server Not Starting

**Symptoms:** Backend starts but no AG-UI logs

**Solutions:**

1. Check AGUIModule is imported in backend `app.module.ts`
2. Verify `@the-new-fuse/ag-ui-core` is in `package.json`
3. Run `pnpm install` to install dependencies
4. Check for TypeScript compilation errors

### Visualization Generation Fails

**Symptoms:** `generateVisualization()` throws error

**Solutions:**

1. Check data structure matches expected format
2. Verify visualization type is supported
3. Check `/tmp` directory is writable
4. Increase timeout for large datasets

### WebSocket Connection Refused

**Symptoms:** External agent can't connect

**Solutions:**

1. Verify backend is running: `pnpm run dev`
2. Check port 8765 is not in use: `lsof -i :8765`
3. Verify firewall allows WebSocket connections
4. Check `X-Agent-Id` header is set correctly

### Generated Files Not Found

**Symptoms:** `filePath` in result doesn't exist

**Solutions:**

1. Check backend and client are on same machine
2. For remote backends, files are on server, not client
3. Use cloud storage integration for remote access
4. Check `VIZ_OUTPUT_DIR` environment variable

## Next Steps

1. **Review Examples:** Study `examples/` directory for working code
2. **Start Small:** Begin with one integration pattern
3. **Test Thoroughly:** Verify visualizations render correctly
4. **Monitor Performance:** Track generation times
5. **Gather Feedback:** Share visualizations with team

For more information:

- [AG-UI Core README](./README.md)
- [Examples Directory](./examples/)
- [The New Fuse Documentation](../../README.md)
