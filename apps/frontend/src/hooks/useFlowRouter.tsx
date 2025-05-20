import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Node, useReactFlow } from 'reactflow';
import { FlowRouter } from '../core/routing/flow_router.js';
import { FlowNode } from '../types/workflow.js';

export function useFlowRouter(): any {
  const { getNodes } = useReactFlow();
  const navigate = useNavigate();
  
  // Create a memoized router instance
  const router = useMemo(() => new FlowRouter(), []);

  // Sync routes with current flow state
  useEffect(() => {
    const nodes = getNodes() as FlowNode[];
    router.syncWithFlow(nodes);
  }, [router, getNodes]);

  // Navigate to a node's route
  const navigateToNode = useCallback((nodeId: string) => {
    const route = router.getRouteByNodeId(nodeId);
    if (route?.path) {
      navigate(route.path);
    }
  }, [router, navigate]);

  // Register a new node route
  const registerNode = useCallback((node: FlowNode) => {
    return router.registerNodeRoute(node);
  }, [router]);

  // Update an existing node route
  const updateNode = useCallback((node: FlowNode) => {
    return router.updateNodeRoute(node);
  }, [router]);

  // Remove a node route
  const removeNode = useCallback((nodeId: string) => {
    router.removeNodeRoute(nodeId);
  }, [router]);

  // Get all current routes
  const getRoutes = useCallback(() => {
    return router.getRoutes();
  }, [router]);

  return {
    navigateToNode,
    registerNode,
    updateNode,
    removeNode,
    getRoutes,
  };
}
