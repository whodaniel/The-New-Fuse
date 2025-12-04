import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactFlow } from 'reactflow';
import { FlowRouter } from '../core/routing/flow_router';
export function useFlowRouter() {
    var getNodes = useReactFlow().getNodes;
    var navigate = useNavigate();
    // Create a memoized router instance
    var router = useMemo(function () { return new FlowRouter(); }, []);
    // Sync routes with current flow state
    useEffect(function () {
        var nodes = getNodes();
        router.syncWithFlow(nodes);
    }, [router, getNodes]);
    // Navigate to a node's route
    var navigateToNode = useCallback(function (nodeId) {
        var route = router.getRouteByNodeId(nodeId);
        if (route === null || route === void 0 ? void 0 : route.path) {
            navigate(route.path);
        }
    }, [router, navigate]);
    // Register a new node route
    var registerNode = useCallback(function (node) {
        return router.registerNodeRoute(node);
    }, [router]);
    // Update an existing node route
    var updateNode = useCallback(function (node) {
        return router.updateNodeRoute(node);
    }, [router]);
    // Remove a node route
    var removeNode = useCallback(function (nodeId) {
        router.removeNodeRoute(nodeId);
    }, [router]);
    // Get all current routes
    var getRoutes = useCallback(function () {
        return router.getRoutes();
    }, [router]);
    return {
        navigateToNode: navigateToNode,
        registerNode: registerNode,
        updateNode: updateNode,
        removeNode: removeNode,
        getRoutes: getRoutes,
    };
}
