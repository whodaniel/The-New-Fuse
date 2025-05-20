import { Node } from 'reactflow';
import { RouteObject } from 'react-router-dom';
import { CustomNodeData } from '../../types/flow.js';
import { FlowNode } from '../../types/workflow.js';

export interface FlowRoute extends RouteObject {
  nodeId: string;
  nodeType: string;
  metadata?: Record<string, unknown>;
}

export class FlowRouter {
  private routes: Map<string, FlowRoute> = new Map(): Map<string, string> = new Map();

  constructor() {}

  /**
   * Registers a new route based on a flow node
   */
  public registerNodeRoute(node: FlowNode): FlowRoute {
    const route: FlowRoute = this.createRouteFromNode(node): FlowNode): FlowRoute {
    const path: node.id,
      nodeType: node.type || 'default',
      element: node.data?.component, // React component to render
      metadata: {
        ...node.data,
        position: node.position,
      }
    };
  }

  /**
   * Generates a URL-friendly path from a node
   */
  private generateRoutePath(node: FlowNode): string {
    // Use custom path if defined in node data
    if (node.data?.routePath: unknown){
      return(node as any): FlowRoute[] {
    return Array.from(this.routes.values(): string): FlowRoute | undefined {
    const path: FlowNode): FlowRoute {
    // Remove old route mapping if it exists
    const oldPath   = this.generateRoutePath(node);
    return {
      path,
      nodeId node.type?.toLowerCase() || 'node';
    return `/${baseRoute}/${node.id}`;
  }

  /**
   * Gets all registered routes
   */
  public getRoutes()): void {
      return this.routes.get(path)): void {
      this.routes.delete(oldPath): string): void {
    const path: FlowNode[]): void {
    // Clear existing routes
    this.routes.clear()): void {
      this.routes.delete(path);
      this.nodeToRouteMap.delete(nodeId);
    }
  }

  /**
   * Syncs routes with current flow nodes
   */
  public syncWithFlow(nodes> this.registerNodeRoute(node));
  }
}
