export class WorkflowValidator {
  validate(nodes: any[], edges: any[], nodeTypes: any[]): string[] {
    const errors: string[] = [];

    // Check for required nodes
    if (!nodes || nodes.length === 0) {
      errors.push('Workflow must contain at least one node');
      return errors;
    }

    // Validate each node
    nodes.forEach((node) => {
      const nodeTypeData = nodeTypes.find((nt) => nt.name === node.type);
      
      if (!nodeTypeData) {
        errors.push(`Unknown node type: ${node.type}`);
        return;
      }

      // Validate required parameters
      const paramErrors = this.validateNodeParameters(node, nodeTypeData);
      errors.push(...paramErrors);

      // Validate credentials if required
      const credentialErrors = this.validateNodeCredentials(node, nodeTypeData);
      errors.push(...credentialErrors);
    });

    // Validate connections
    const connectionErrors = this.validateConnections(nodes, edges);
    errors.push(...connectionErrors);

    // Check for circular dependencies
    const circularErrors = this.checkCircularDependencies(nodes, edges);
    errors.push(...circularErrors);

    return errors;
  }

  private validateNodeParameters(node: any, nodeTypeData: any): string[] {
    const errors: string[] = [];
    const requiredParams = nodeTypeData.properties.properties.filter(
      (prop: any) => prop.required
    );

    requiredParams.forEach((param: any) => {
      if (!node.parameters || node.parameters[param.name] === undefined) {
        errors.push(`Missing required parameter '${param.name}' in node ${node.name || node.id}`);
      }
    });

    return errors;
  }

  private validateNodeCredentials(node: any, nodeTypeData: any): string[] {
    const errors: string[] = [];

    if (nodeTypeData.credentials && nodeTypeData.credentials.length > 0) {
      const requiredCred = nodeTypeData.credentials[0];
      if (!node.credentials || !node.credentials[requiredCred.name]) {
        errors.push(
          `Missing required credentials '${requiredCred.name}' in node ${node.name || node.id}`
        );
      }
    }

    return errors;
  }

  private validateConnections(nodes: any[], edges: any[]): string[] {
    const errors: string[] = [];

    // Check for orphaned nodes (no incoming or outgoing connections)
    const connectedNodeIds = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
    const orphanedNodes = nodes.filter((node) => !connectedNodeIds.has(node.id));

    if (orphanedNodes.length > 0) {
      errors.push(
        `Orphaned nodes found: ${orphanedNodes.map((n) => n.name || n.id).join(', ')}`
      );
    }

    // Validate connection compatibility
    edges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      if (!sourceNode || !targetNode) {
        errors.push(`Invalid connection: missing source or target node`);
        return;
      }

      // Check if the connection type is valid for both nodes
      const sourceHandle = edge.sourceHandle?.replace('output-', '') || 'main';
      const targetHandle = edge.targetHandle?.replace('input-', '') || 'main';

      if (!this.isValidConnection(sourceNode, targetNode, sourceHandle, targetHandle)) {
        errors.push(
          `Invalid connection type from ${sourceNode.name || sourceNode.id} to ${
            targetNode.name || targetNode.id
          }`
        );
      }
    });

    return errors;
  }

  private isValidConnection(
    sourceNode: any,
    targetNode: any,
    sourceHandle: string,
    targetHandle: string
  ): boolean {
    // Default to true if we can't determine compatibility
    // In a production environment, you'd want to be more strict
    return true;
  }

  private checkCircularDependencies(nodes: any[], edges: any[]): string[] {
    const errors: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCircularDependency = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true;
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = edges.filter((edge) => edge.source === nodeId);
      for (const edge of outgoingEdges) {
        if (hasCircularDependency(edge.target)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    nodes.forEach((node) => {
      if (hasCircularDependency(node.id)) {
        errors.push(`Circular dependency detected in workflow involving node ${node.name || node.id}`);
      }
    });

    return errors;
  }
}
