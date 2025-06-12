
export interface DependencyNode {
  id: string;
  type: string;
  dependencies: string[];
  dependents: string[];
}

export class DependencyMapper {
  private nodes: Map<string, DependencyNode> = new Map();

  addNode(id: string, type: string) {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, {
        id,
        type,
        dependencies: [],
        dependents: []
      });
    }
  }

  addDependency(fromId: string, toId: string) {
    const from = this.nodes.get(fromId);
    const to = this.nodes.get(toId);

    if (from && to) {
      if (!from.dependencies.includes(toId)) {
        from.dependencies.push(toId);
      }
      if (!to.dependents.includes(fromId)) {
        to.dependents.push(fromId);
      }
    }
  }

  findCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const path: string[] = [];

    const dfs = (nodeId: string) => {
      if (path.includes(nodeId)) {
        const cycle = path.slice(path.indexOf(nodeId));
        cycles.push(cycle);
        return;
      }

      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      path.push(nodeId);

      const node = this.nodes.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          dfs(depId);
        }
      }

      path.pop();
    };

    for (const nodeId of this.nodes.keys()) {
      dfs(nodeId);
    }

    return cycles;
  }

  generateReport(): string {
    let report = '# Dependency Analysis Report\n\n';

    // Add component summary
    const typeCount = new Map<string, number>();
    this.nodes.forEach(node => {
      typeCount.set(node.type, (typeCount.get(node.type) || 0) + 1);
    });
    
    typeCount.forEach((count, type) => {
      report += `- ${type}: ${count} components\n`;
    });

    // Add circular dependencies
    const cycles = this.findCircularDependencies();
    if (cycles.length > 0) {
      report += '\n## Circular Dependencies\n\n';
      cycles.forEach(cycle => {
        report += `- ${cycle.join(' -> ')} -> ${cycle[0]}\n`;
      });
    }

    return report;
  }
}