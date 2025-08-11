import reactflow from 'reactflow';
import '../../types/workflow.js';
/**
 * Syncs routes with current flow nodes
 */
export class FlowRouter {
  // Implementation needed
}
  private routes: Map<string, any> = new Map();
  constructor() {
  // Implementation needed
}
    this.initializeRouter();
  }

  private initializeRouter() {
  // Implementation needed
}
    // Initialize routing logic
  }

  public syncWithFlowNodes(nodes: any[]) {
  // Implementation needed
}
    // Sync routes with flow nodes
    nodes.forEach(node => {
  // Implementation needed
}
      this.routes.set(node.id, node);
    });
  }

  public getRoute(nodeId: string) {
  // Implementation needed
}
    return this.routes.get(nodeId);
  }

  public getAllRoutes() {
  // Implementation needed
}
    return Array.from(this.routes.values());
  }
}