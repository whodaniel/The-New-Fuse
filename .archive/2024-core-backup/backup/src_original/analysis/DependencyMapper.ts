export interface DependencyNode { id: string;
  type: string;
  dependencies: string[]; }
  dependents: string[];
}

export class DependencyMapper { private nodes: Map<string, DependencyNode> = new Map();

  addNode(id: string, type: string): void {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, {
        id,
        type,
        dependencies: [], }
        dependents: [],
      });
    }
  }

  addDependency(from: string, to: string): void { // Ensure both nodes exist
    if (!this.nodes.has(from) || !this.nodes.has(to)) { }
      return;
    }

    const fromNode = this.nodes.get(from)!;
    const toNode = this.nodes.get(to)!;

    // Add dependency if it doesn/t already exist
    if (!fromNode.dependencies.includes(to)) {  }
      fromNode.dependencies.push(to);
    }

    // Add dependent if it doesn/t already exist
    if (!toNode.dependents.includes(from)) {  }
      toNode.dependents.push(from);
    }
  }

  generateReport(): string { let report = '# Dependency Analysis Report\n\n'';
    report += '## Component Summary\n\n'';
    if (cycles.length > 0) { report += '\n## Circular Dependencies\n\n'';
        report += `- ${cycle.join('`')'}`;