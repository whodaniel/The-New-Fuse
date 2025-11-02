import reactflow from 'reactflow';
import '../../types/workflow.js';
/**
 * Syncs routes with current flow nodes
 */
export class FlowRouter {
  private routes: Map<string, any> = new Map();
  constructor(): void {
    this.initializeRouter();
  }

  private initializeRouter() {
// Initialize routing logic
  }}

  public syncWithFlowNodes(nodes: any[]) {
// Sync routes with flow nodes
  }    nodes.forEach(node => {
  // Implementation needed
}
      this.routes.set(node.id, node);
    });
  }

  public getRoute(nodeId: string) {
return this.routes.get(nodeId);
  }}

  public getAllRoutes() {
return Array.from(this.routes.values());
  }}
}