exports.useGraphVisualization = useGraphVisualization;
import react_1 from 'react';
import useSocket_1 from './useSocket';
function useGraphVisualization(initialNodes, initialEdges) {
    if (initialNodes === void 0) { initialNodes = []; }
    if (initialEdges === void 0) { initialEdges = []; }
    var socket = (0, useSocket_1.useSocket)();
    var _a = (0, react_1.useState)(initialNodes), nodes = _a[0], setNodes = _a[1];
    var _b = (0, react_1.useState)(initialEdges), edges = _b[0], setEdges = _b[1];
    var _c = (0, react_1.useState)({
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
    }), state = _c[0], setState = _c[1];
    var _d = (0, react_1.useState)(null), metrics = _d[0], setMetrics = _d[1];
    var _e = (0, react_1.useState)(false), isProcessing = _e[0], setIsProcessing = _e[1];
    var _f = (0, react_1.useState)(null), error = _f[0], setError = _f[1];
    var handleLayoutUpdate = (0, react_1.useCallback)(function (data) {
        setNodes(data.nodes);
        setEdges(data.edges);
        setState(function (prev) { return (Object.assign(Object.assign({}, prev), { layout: data.layout })); });
        setIsProcessing(false);
        setError(null);
    }, []);
    var handleMetricsUpdate = (0, react_1.useCallback)(function (data) {
        setMetrics(data);
    }, []);
    var handleClusteringUpdate = (0, react_1.useCallback)(function (data) {
        setNodes(function (prev) { return prev.map(function (node) { return (Object.assign(Object.assign({}, node), { community: data.communities.get(node.id) })); }); });
        setIsProcessing(false);
    }, []);
    var handleError = (0, react_1.useCallback)(function (error) {
        setError(error);
        setIsProcessing(false);
    }, []);
    (0, react_1.useEffect)(function () {
        if (!socket)
            return;
        socket.on('graph:layout:update', handleLayoutUpdate);
        socket.on('graph:metrics:update', handleMetricsUpdate);
        socket.on('graph:clustering:update', handleClusteringUpdate);
        socket.on('graph:error', handleError);
        return function () {
            socket.off('graph:layout:update', handleLayoutUpdate);
            socket.off('graph:metrics:update', handleMetricsUpdate);
            socket.off('graph:clustering:update', handleClusteringUpdate);
            socket.off('graph:error', handleError);
        };
    }, [socket, handleLayoutUpdate, handleMetricsUpdate, handleClusteringUpdate, handleError]);
    var highlightedNodes = (0, react_1.useMemo)(function () {
        if (!state.highlighting.enabled || !metrics)
            return new Set();
        var metric = metrics.centrality[state.highlighting.metric];
        if (!metric)
            return new Set();
        var values = Array.from(metric.values());
        var threshold = Math.max.apply(Math, values) * state.highlighting.threshold;
        return new Set(Array.from(metric.entries())
            .filter(function (_a) {
            var _ = _a[0], value = _a[1];
            return value >= threshold;
        })
            .map(function (_a) {
            var nodeId = _a[0];
            return nodeId;
        }));
    }, [state.highlighting, metrics]);
    var updateLayout = (0, react_1.useCallback)(function (layout) {
        if (!socket)
            return;
        setIsProcessing(true);
        socket.emit('graph:layout:update', {
            nodes: nodes,
            edges: edges,
            layout: layout,
            physics: state.physics
        });
    }, [socket, nodes, edges, state.physics]);
    var updatePhysics = (0, react_1.useCallback)(function (physics) {
        setState(function (prev) { return (Object.assign(Object.assign({}, prev), { physics: Object.assign(Object.assign({}, prev.physics), physics) })); });
        if (socket && state.layout === 'force') {
            socket.emit('graph:physics:update', physics);
        }
    }, [socket, state.layout]);
    var updateClustering = (0, react_1.useCallback)(function (clustering) {
        if (!socket)
            return;
        setIsProcessing(true);
        setState(function (prev) { return (Object.assign(Object.assign({}, prev), { clustering: Object.assign(Object.assign({}, prev.clustering), clustering) })); });
        socket.emit('graph:clustering:update', Object.assign({ nodes: nodes, edges: edges }, clustering));
    }, [socket, nodes, edges]);
    var updateHighlighting = (0, react_1.useCallback)(function (highlighting) {
        setState(function (prev) { return (Object.assign(Object.assign({}, prev), { highlighting: Object.assign(Object.assign({}, prev.highlighting), highlighting) })); });
    }, []);
    var updateLabels = (0, react_1.useCallback)(function (labels) {
        setState(function (prev) { return (Object.assign(Object.assign({}, prev), { labels: Object.assign(Object.assign({}, prev.labels), labels) })); });
    }, []);
    var centerGraph = (0, react_1.useCallback)(function () {
        if (!socket)
            return;
        socket.emit('graph:center');
    }, [socket]);
    var zoomToFit = (0, react_1.useCallback)(function () {
        if (!socket)
            return;
        socket.emit('graph:zoom:fit');
    }, [socket]);
    var exportGraph = (0, react_1.useCallback)(function (format) {
        if (!socket)
            return;
        socket.emit('graph:export', { format: format });
    }, [socket]);
    return {
        nodes: nodes,
        edges: edges,
        state: state,
        metrics: metrics,
        isProcessing: isProcessing,
        error: error,
        highlightedNodes: highlightedNodes,
        updateLayout: updateLayout,
        updatePhysics: updatePhysics,
        updateClustering: updateClustering,
        updateHighlighting: updateHighlighting,
        updateLabels: updateLabels,
        centerGraph: centerGraph,
        zoomToFit: zoomToFit,
        exportGraph: exportGraph
    };
}
