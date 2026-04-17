import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';

@Injectable()
export class WorkflowExecutionService {
  private readonly logger = new Logger(WorkflowExecutionService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Run a workflow execution.
   * Currently implements a basic sequential simulation.
   */
  async run(executionId: string, definition: any, input: any = {}): Promise<void> {
    this.logger.log(`Running workflow execution ${executionId}`);
    const nodes = definition?.nodes || [];
    const edges = definition?.edges || [];

    try {
      // 1. Initial status update
      await this.db.workflows.updateExecution(executionId, {
        status: 'RUNNING',
        startedAt: new Date(),
      } as any);

      // 2. Identify start nodes (nodes with no incoming edges)
      const targetIds = new Set(edges.map((e: any) => e.target));
      const startNodes = nodes.filter((n: any) => !targetIds.has(n.id));

      if (startNodes.length === 0 && nodes.length > 0) {
        // Fallback to the first node if no clear start node
        startNodes.push(nodes[0]);
      }

      this.logger.log(`Found ${startNodes.length} start nodes for execution ${executionId}`);

      // 3. Sequential traversal (simple BFS/DFS-like simulation)
      const visited = new Set<string>();
      const queue = [...startNodes];

      const results: Record<string, any> = { ...input };

      while (queue.length > 0) {
        const node = queue.shift();
        if (!node || visited.has(node.id)) continue;

        visited.add(node.id);
        this.logger.log(`Executing node ${node.id} (${node.type})`);

        // Record node start
        // (Assuming we have a way to log per-node results in the future)

        // Simulate work
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Identify next nodes
        const nextEdges = edges.filter((e: any) => e.source === node.id);
        for (const edge of nextEdges) {
          const nextNode = nodes.find((n: any) => n.id === edge.target);
          if (nextNode) {
            queue.push(nextNode);
          }
        }
      }

      // 4. Final status update
      await this.db.workflows.updateExecution(executionId, {
        status: 'COMPLETED',
        completedAt: new Date(),
        output: results,
      } as any);

      this.logger.log(`Workflow execution ${executionId} completed successfully`);
    } catch (error) {
      this.logger.error(`Workflow execution ${executionId} failed: ${error}`);
      await this.db.workflows.updateExecution(executionId, {
        status: 'FAILED',
        completedAt: new Date(),
        error: (error as Error).message,
      } as any);
    }
  }
}
