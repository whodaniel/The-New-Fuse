var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import dagre from 'dagre';
/**
 * Optimizes the layout of a workflow
 * @param nodes The nodes to optimize
 * @param edges The edges to optimize
 * @param options Options for optimization
 * @returns The optimized nodes and edges
 */
export function optimizeWorkflowLayout(nodes, edges, options) {
    if (options === void 0) { options = {}; }
    // Default options
    var _a = options.direction, direction = _a === void 0 ? 'LR' : _a, _b = options.nodeWidth, nodeWidth = _b === void 0 ? 200 : _b, _c = options.nodeHeight, nodeHeight = _c === void 0 ? 100 : _c, _d = options.nodeSpacing, nodeSpacing = _d === void 0 ? 50 : _d, _e = options.rankSpacing, rankSpacing = _e === void 0 ? 200 : _e, _f = options.alignRanks, alignRanks = _f === void 0 ? true : _f, _g = options.optimizeEdgeCrossings, optimizeEdgeCrossings = _g === void 0 ? true : _g, _h = options.optimizeNodePositions, optimizeNodePositions = _h === void 0 ? true : _h;
    // Create a new graph
    var g = new dagre.graphlib.Graph();
    // Set graph direction
    g.setGraph({
        rankdir: direction,
        nodesep: nodeSpacing,
        ranksep: rankSpacing,
        align: alignRanks ? 'UL' : undefined,
        acyclicer: optimizeEdgeCrossings ? 'greedy' : undefined,
        ranker: optimizeNodePositions ? 'network-simplex' : undefined
    });
    // Default to assigning a new object as a label for each edge
    g.setDefaultEdgeLabel(function () { return ({}); });
    // Add nodes to the graph
    nodes.forEach(function (node) {
        g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });
    // Add edges to the graph
    edges.forEach(function (edge) {
        g.setEdge(edge.source, edge.target);
    });
    // Layout the graph
    dagre.layout(g);
    // Get the optimized nodes with new positions
    var optimizedNodes = nodes.map(function (node) {
        var nodeWithPosition = g.node(node.id);
        return __assign(__assign({}, node), { position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2
            } });
    });
    return { nodes: optimizedNodes, edges: edges };
}
/**
 * Optimizes a workflow by removing unused nodes and edges
 * @param nodes The nodes to optimize
 * @param edges The edges to optimize
 * @returns The optimized nodes and edges
 */
export function optimizeWorkflowNodes(nodes, edges) {
    // Find nodes that are connected to other nodes
    var connectedNodeIds = new Set();
    edges.forEach(function (edge) {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
    });
    // Filter out nodes that are not connected to any other node
    var optimizedNodes = nodes.filter(function (node) { return connectedNodeIds.has(node.id); });
    return { nodes: optimizedNodes, edges: edges };
}
/**
 * Optimizes a workflow by removing duplicate edges
 * @param nodes The nodes to optimize
 * @param edges The edges to optimize
 * @returns The optimized nodes and edges
 */
export function optimizeWorkflowEdges(nodes, edges) {
    // Find duplicate edges (same source and target)
    var edgeMap = new Map();
    edges.forEach(function (edge) {
        var key = "".concat(edge.source, "-").concat(edge.target);
        if (!edgeMap.has(key)) {
            edgeMap.set(key, edge);
        }
    });
    // Get unique edges
    var optimizedEdges = Array.from(edgeMap.values());
    return { nodes: nodes, edges: optimizedEdges };
}
/**
 * Optimizes a workflow by applying all optimizations
 * @param nodes The nodes to optimize
 * @param edges The edges to optimize
 * @param options Options for optimization
 * @returns The optimized nodes and edges
 */
export function optimizeWorkflow(nodes, edges, options) {
    if (options === void 0) { options = {}; }
    // Optimize nodes
    var _a = optimizeWorkflowNodes(nodes, edges), optimizedNodes = _a.nodes, optimizedEdges = _a.edges;
    // Optimize edges
    var finalEdges = optimizeWorkflowEdges(optimizedNodes, optimizedEdges).edges;
    // Optimize layout
    return optimizeWorkflowLayout(optimizedNodes, finalEdges, options);
}
