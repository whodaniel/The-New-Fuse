export {}
exports.useGraphVisualization = useGraphVisualization;
import react_1 from 'react';
import useSocket_1 from './useSocket.js';
function useGraphVisualization(initialNodes = [], initialEdges = []): any {
    const socket = (0, useSocket_1.useSocket)();
    const [nodes, setNodes] = (0, react_1.useState)(initialNodes);
    const [edges, setEdges] = (0, react_1.useState)(initialEdges);
    const [state, setState] = (0, react_1.useState)({
        layout: 'force',
        physics: {
            enabled: true,
            stabilization: true,
            springLength: 100,
            springConstant: 0.04,
            damping: 0.09,
            avoidOverlap: true
        },
        clustering: {
            enabled: false,
            method: 'louvain',
            resolution: 1.0
        },
        highlighting: {
            enabled: false,
            metric: 'degree',
            threshold: 0.7
        },
        labels: {
            enabled: true,
            properties: ['id', 'label'],
            size: 12
        }
    });
    const [metrics, setMetrics] = (0, react_1.useState)(null);
    const [isProcessing, setIsProcessing] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const handleLayoutUpdate = (0, react_1.useCallback)((data) => {
        setNodes(data.nodes);
        setEdges(data.edges);
        setState(prev => (Object.assign(Object.assign({}, prev), { layout: data.layout })));
        setIsProcessing(false);
        setError(null);
    }, []);
    const handleMetricsUpdate = (0, react_1.useCallback)((data) => {
        setMetrics(data);
    }, []);
    const handleClusteringUpdate = (0, react_1.useCallback)((data) => {
        setNodes(prev => prev.map(node => (Object.assign(Object.assign({}, node), { community: data.communities.get(node.id) }))));
        setIsProcessing(false);
    }, []);
    const handleError = (0, react_1.useCallback)((error) => {
        setError(error);
        setIsProcessing(false);
    }, []);
    (0, react_1.useEffect)(() => {
        if (!socket)
            return;
        socket.on('graph:layout:update', handleLayoutUpdate);
        socket.on('graph:metrics:update', handleMetricsUpdate);
        socket.on('graph:clustering:update', handleClusteringUpdate);
        socket.on('graph:error', handleError);
        return () => {
            socket.off('graph:layout:update', handleLayoutUpdate);
            socket.off('graph:metrics:update', handleMetricsUpdate);
            socket.off('graph:clustering:update', handleClusteringUpdate);
            socket.off('graph:error', handleError);
        };
    }, [socket, handleLayoutUpdate, handleMetricsUpdate, handleClusteringUpdate, handleError]);
    const highlightedNodes = (0, react_1.useMemo)(() => {
        if (!state.highlighting.enabled || !metrics)
            return new Set();
        const metric = metrics.centrality[state.highlighting.metric];
        if (!metric)
            return new Set();
        const values = Array.from(metric.values());
        const threshold = Math.max(...values) * state.highlighting.threshold;
        return new Set(Array.from(metric.entries())
            .filter(([_, value]) => value >= threshold)
            .map(([nodeId]) => nodeId));
    }, [state.highlighting, metrics]);
    const updateLayout = (0, react_1.useCallback)((layout) => {
        if (!socket)
            return;
        setIsProcessing(true);
        socket.emit('graph:layout:update', {
            nodes,
            edges,
            layout,
            physics: state.physics
        });
    }, [socket, nodes, edges, state.physics]);
    const updatePhysics = (0, react_1.useCallback)((physics) => {
        setState(prev => (Object.assign(Object.assign({}, prev), { physics: Object.assign(Object.assign({}, prev.physics), physics) })));
        if (socket && state.layout === 'force') {
            socket.emit('graph:physics:update', physics);
        }
    }, [socket, state.layout]);
    const updateClustering = (0, react_1.useCallback)((clustering) => {
        if (!socket)
            return;
        setIsProcessing(true);
        setState(prev => (Object.assign(Object.assign({}, prev), { clustering: Object.assign(Object.assign({}, prev.clustering), clustering) })));
        socket.emit('graph:clustering:update', Object.assign({ nodes,
            edges }, clustering));
    }, [socket, nodes, edges]);
    const updateHighlighting = (0, react_1.useCallback)((highlighting) => {
        setState(prev => (Object.assign(Object.assign({}, prev), { highlighting: Object.assign(Object.assign({}, prev.highlighting), highlighting) })));
    }, []);
    const updateLabels = (0, react_1.useCallback)((labels) => {
        setState(prev => (Object.assign(Object.assign({}, prev), { labels: Object.assign(Object.assign({}, prev.labels), labels) })));
    }, []);
    const centerGraph = (0, react_1.useCallback)(() => {
        if (!socket)
            return;
        socket.emit('graph:center');
    }, [socket]);
    const zoomToFit = (0, react_1.useCallback)(() => {
        if (!socket)
            return;
        socket.emit('graph:zoom:fit');
    }, [socket]);
    const exportGraph = (0, react_1.useCallback)((format) => {
        if (!socket)
            return;
        socket.emit('graph:export', { format });
    }, [socket]);
    return {
        nodes,
        edges,
        state,
        metrics,
        isProcessing,
        error,
        highlightedNodes,
        updateLayout,
        updatePhysics,
        updateClustering,
        updateHighlighting,
        updateLabels,
        centerGraph,
        zoomToFit,
        exportGraph
    };
}
export {};
//# sourceMappingURL=useGraphVisualization.js.map