export interface DependencyNode {
  id: string;
  type: string;
  dependencies: string[];
  dependents: string[];
}

export class DependencyMapper {
  private nodes: Map<string, DependencyNode> = new Map();

  addNode(id: string, type: string): void {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, {
        id,
        type,
        dependencies: [],
        dependents: [],
      });
    }
  }

  addDependency(from: string, to: string): void {
    // Ensure both nodes exist
    if (!this.nodes.has(from) || !this.nodes.has(to)) {
      return;
    }

    const fromNode = this.nodes.get(from)!;
    const toNode = this.nodes.get(to)!;

    // Add dependency if it doesn't already exist
    if (!fromNode.dependencies.includes(to)) {
      fromNode.dependencies.push(to);
    }

    // Add dependent if it doesn't already exist
    if (!toNode.dependents.includes(from)) {
      toNode.dependents.push(from);
    }
  }

  detectCircularDependencies(): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        this.dfsDetectCycles(nodeId, visited, recursionStack, [], cycles);
      }
    });

    return cycles;
  }

  private dfsDetectCycles(
    nodeId: string,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[],
    cycles: string[][],
  ): void {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const node = this.nodes.get(nodeId);
    if (node) {
      for (const dependency of node.dependencies) {
        if (!visited.has(dependency)) {
          this.dfsDetectCycles(dependency, visited, recursionStack, [...path], cycles);
        } else if (recursionStack.has(dependency)) {
          // Found a cycle
          const cycleStart = path.indexOf(dependency);
          if (cycleStart >= 0) {
            cycles.push([...path.slice(cycleStart), dependency]);
          }
        }
      }
    }

    recursionStack.delete(nodeId);
  }

  generateReport(): string {
    let report = '# Dependency Analysis Report\n\n';
    report += '## Component Summary\n\n';
    report += `Total components: ${this.nodes.size}\n\n`;

    const cycles = this.detectCircularDependencies();

    if (cycles.length > 0) {
      report += '\n## Circular Dependencies\n\n';
      cycles.forEach((cycle, index) => {
        report += `${index + 1}. ${cycle.join(' → ')}\n`;
      });
    } else {
      report += '\n## Circular Dependencies\n\nNo circular dependencies detected.\n';
    }

    report += '\n## Detailed Dependencies\n\n';

    for (const [nodeId, node] of this.nodes) {
      report += `### ${nodeId} (${node.type})\n`;
      if (node.dependencies.length > 0) {
        report += `**Dependencies:** ${node.dependencies.join(', ')}\n`;
      }
      if (node.dependents.length > 0) {
        report += `**Dependents:** ${node.dependents.join(', ')}\n`;
      }
      report += '\n';
    });

    return report;
  }

  getNode(id: string): DependencyNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): DependencyNode[] {
    return Array.from(this.nodes.values());
  }

  clear(): void {
    this.nodes.clear();
  }
}
