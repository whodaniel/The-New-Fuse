export {}
exports.useGraphAnalysis = useGraphAnalysis;
import react_1 from 'react';
import useSocket_1 from './useSocket.js';
function useGraphAnalysis(initialNodes = [], initialEdges = [], options = {}): any {
    const { autoAnalyze = false, analysisInterval = 5000, algorithms = ['all'] } = options;
    const socket = (0, useSocket_1.useSocket)();
    const [state, setState] = (0, react_1.useState)({
        metrics: new Map(),
        communities: new Map(),
        isAnalyzing: false,
        error: null
    });
    const handleAnalysisResult = (0, react_1.useCallback)((data) => {
        setState(prev => (Object.assign(Object.assign({}, prev), { metrics: new Map(Object.entries(data.metrics)), communities: new Map(Object.entries(data.communities)), isAnalyzing: false, error: null })));
    }, []);
    const handleAnalysisError = (0, react_1.useCallback)((error) => {
        setState(prev => (Object.assign(Object.assign({}, prev), { isAnalyzing: false, error })));
    }, []);
    (0, react_1.useEffect)(() => {
        if (!socket)
            return;
        socket.on('graph:analysis:result', handleAnalysisResult);
        socket.on('graph:analysis:error', handleAnalysisError);
        return () => {
            socket.off('graph:analysis:result', handleAnalysisResult);
            socket.off('graph:analysis:error', handleAnalysisError);
        };
    }, [socket, handleAnalysisResult, handleAnalysisError]);
    (0, react_1.useEffect)(() => {
        if (!autoAnalyze || !socket)
            return;
        const interval = setInterval(() => {
            socket.emit('graph:analyze', {
                nodes: initialNodes,
                edges: initialEdges,
                algorithms
            });
        }, analysisInterval);
        return () => clearInterval(interval);
    }, [socket, autoAnalyze, analysisInterval, initialNodes, initialEdges, algorithms]);
    const analyzeGraph = (0, react_1.useCallback)(() => {
        if (!socket)
            return;
        setState(prev => (Object.assign(Object.assign({}, prev), { isAnalyzing: true, error: null })));
        socket.emit('graph:analyze', {
            nodes: initialNodes,
            edges: initialEdges,
            algorithms
        });
    }, [socket, initialNodes, initialEdges, algorithms]);
    const getNodeMetrics = (0, react_1.useCallback)((nodeId) => {
        return state.metrics.get(nodeId);
    }, [state.metrics]);
    const getNodeCommunity = (0, react_1.useCallback)((nodeId) => {
        return state.communities.get(nodeId);
    }, [state.communities]);
    const getCommunityNodes = (0, react_1.useCallback)((communityId) => {
        return Array.from(state.communities.entries())
            .filter(([_, community]) => community === communityId)
            .map(([nodeId]) => nodeId);
    }, [state.communities]);
    const getMetricsSummary = (0, react_1.useCallback)(() => {
        if (state.metrics.size === 0)
            return null;
        const metrics = Array.from(state.metrics.values());
        return {
            averageDegree: metrics.reduce((sum, m) => sum + m.degree, 0) / metrics.length,
            averageBetweenness: metrics.reduce((sum, m) => sum + m.betweennessCentrality, 0) / metrics.length,
            averageCloseness: metrics.reduce((sum, m) => sum + m.closenessCentrality, 0) / metrics.length,
            averagePageRank: metrics.reduce((sum, m) => sum + m.pageRank, 0) / metrics.length,
            averageClusteringCoeff: metrics.reduce((sum, m) => sum + m.clusteringCoefficient, 0) / metrics.length,
            communityCount: new Set(state.communities.values()).size
        };
    }, [state.metrics, state.communities]);
    return Object.assign(Object.assign({}, state), { analyzeGraph,
        getNodeMetrics,
        getNodeCommunity,
        getCommunityNodes,
        getMetricsSummary });
}
export {};
//# sourceMappingURL=useGraphAnalysis.js.map