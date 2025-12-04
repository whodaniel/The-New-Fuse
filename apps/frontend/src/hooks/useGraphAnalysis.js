exports.useGraphAnalysis = useGraphAnalysis;
import react_1 from 'react';
import useSocket_1 from './useSocket';
function useGraphAnalysis(initialNodes, initialEdges, options) {
    if (initialNodes === void 0) { initialNodes = []; }
    if (initialEdges === void 0) { initialEdges = []; }
    if (options === void 0) { options = {}; }
    var _a = options.autoAnalyze, autoAnalyze = _a === void 0 ? false : _a, _b = options.analysisInterval, analysisInterval = _b === void 0 ? 5000 : _b, _c = options.algorithms, algorithms = _c === void 0 ? ['all'] : _c;
    var socket = (0, useSocket_1.useSocket)();
    var _d = (0, react_1.useState)({
        metrics: new Map(),
        communities: new Map(),
        isAnalyzing: false,
        error: null
    }), state = _d[0], setState = _d[1];
    var handleAnalysisResult = (0, react_1.useCallback)(function (data) {
        setState(function (prev) { return (Object.assign(Object.assign({}, prev), { metrics: new Map(Object.entries(data.metrics)), communities: new Map(Object.entries(data.communities)), isAnalyzing: false, error: null })); });
    }, []);
    var handleAnalysisError = (0, react_1.useCallback)(function (error) {
        setState(function (prev) { return (Object.assign(Object.assign({}, prev), { isAnalyzing: false, error: error })); });
    }, []);
    (0, react_1.useEffect)(function () {
        if (!socket)
            return;
        socket.on('graph:analysis:result', handleAnalysisResult);
        socket.on('graph:analysis:error', handleAnalysisError);
        return function () {
            socket.off('graph:analysis:result', handleAnalysisResult);
            socket.off('graph:analysis:error', handleAnalysisError);
        };
    }, [socket, handleAnalysisResult, handleAnalysisError]);
    (0, react_1.useEffect)(function () {
        if (!autoAnalyze || !socket)
            return;
        var interval = setInterval(function () {
            socket.emit('graph:analyze', {
                nodes: initialNodes,
                edges: initialEdges,
                algorithms: algorithms
            });
        }, analysisInterval);
        return function () { return clearInterval(interval); };
    }, [socket, autoAnalyze, analysisInterval, initialNodes, initialEdges, algorithms]);
    var analyzeGraph = (0, react_1.useCallback)(function () {
        if (!socket)
            return;
        setState(function (prev) { return (Object.assign(Object.assign({}, prev), { isAnalyzing: true, error: null })); });
        socket.emit('graph:analyze', {
            nodes: initialNodes,
            edges: initialEdges,
            algorithms: algorithms
        });
    }, [socket, initialNodes, initialEdges, algorithms]);
    var getNodeMetrics = (0, react_1.useCallback)(function (nodeId) {
        return state.metrics.get(nodeId);
    }, [state.metrics]);
    var getNodeCommunity = (0, react_1.useCallback)(function (nodeId) {
        return state.communities.get(nodeId);
    }, [state.communities]);
    var getCommunityNodes = (0, react_1.useCallback)(function (communityId) {
        return Array.from(state.communities.entries())
            .filter(function (_a) {
            var _ = _a[0], community = _a[1];
            return community === communityId;
        })
            .map(function (_a) {
            var nodeId = _a[0];
            return nodeId;
        });
    }, [state.communities]);
    var getMetricsSummary = (0, react_1.useCallback)(function () {
        if (state.metrics.size === 0)
            return null;
        var metrics = Array.from(state.metrics.values());
        return {
            averageDegree: metrics.reduce(function (sum, m) { return sum + m.degree; }, 0) / metrics.length,
            averageBetweenness: metrics.reduce(function (sum, m) { return sum + m.betweennessCentrality; }, 0) / metrics.length,
            averageCloseness: metrics.reduce(function (sum, m) { return sum + m.closenessCentrality; }, 0) / metrics.length,
            averagePageRank: metrics.reduce(function (sum, m) { return sum + m.pageRank; }, 0) / metrics.length,
            averageClusteringCoeff: metrics.reduce(function (sum, m) { return sum + m.clusteringCoefficient; }, 0) / metrics.length,
            communityCount: new Set(state.communities.values()).size
        };
    }, [state.metrics, state.communities]);
    return Object.assign(Object.assign({}, state), { analyzeGraph: analyzeGraph, getNodeMetrics: getNodeMetrics, getNodeCommunity: getNodeCommunity, getCommunityNodes: getCommunityNodes, getMetricsSummary: getMetricsSummary });
}
