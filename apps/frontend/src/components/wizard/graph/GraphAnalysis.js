var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var GraphAnalyzer = /** @class */ (function () {
    function GraphAnalyzer(nodes, edges) {
        this.nodes = nodes;
        this.edges = edges;
        this.adjacencyMatrix = this.buildAdjacencyMatrix();
        this.nodeMetrics = new Map();
    }
    GraphAnalyzer.prototype.buildAdjacencyMatrix = function () {
        var n = this.nodes.length;
        var matrix = Array(n).fill(0).map(function () { return Array(n).fill(0); });
        var nodeIndices = new Map(this.nodes.map(function (node, i) { return [node.id, i]; }));
        this.edges.forEach(function (edge) {
            var sourceIdx = nodeIndices.get(edge.source);
            var targetIdx = nodeIndices.get(edge.target);
            if (sourceIdx !== undefined && targetIdx !== undefined) {
                matrix[sourceIdx][targetIdx] = 1;
                matrix[targetIdx][sourceIdx] = 1;
            }
        });
        return matrix;
    };
    GraphAnalyzer.prototype.calculateDegrees = function () {
        var _this = this;
        var degrees = new Map();
        this.nodes.forEach(function (node) {
            var inDegree = _this.edges.filter(function (e) { return e.target === node.id; }).length;
            var outDegree = _this.edges.filter(function (e) { return e.source === node.id; }).length;
            degrees.set(node.id, {
                in: inDegree,
                out: outDegree,
                total: inDegree + outDegree
            });
        });
        return degrees;
    };
    GraphAnalyzer.prototype.calculateBetweennessCentrality = function () {
        var _this = this;
        var betweenness = new Map();
        var n = this.nodes.length;
        this.nodes.forEach(function (node) { return betweenness.set(node.id, 0); });
        for (var i = 0; i < n; i++) {
            var _loop_1 = function (j) {
                var paths = this_1.findAllShortestPaths(i, j);
                if (paths.length > 0) {
                    var intermediateNodes = new Set(paths.flat());
                    intermediateNodes.delete(i);
                    intermediateNodes.delete(j);
                    intermediateNodes.forEach(function (nodeIdx) {
                        var nodeId = _this.nodes[nodeIdx].id;
                        var pathsThroughNode = paths.filter(function (path) { return path.includes(nodeIdx); });
                        betweenness.set(nodeId, betweenness.get(nodeId) + pathsThroughNode.length / paths.length);
                    });
                }
            };
            var this_1 = this;
            for (var j = i + 1; j < n; j++) {
                _loop_1(j);
            }
        }
        var maxBetweenness = Math.max.apply(Math, betweenness.values());
        if (maxBetweenness > 0) {
            betweenness.forEach(function (value, key) {
                betweenness.set(key, value / maxBetweenness);
            });
        }
        return betweenness;
    };
    GraphAnalyzer.prototype.calculateClosenessCentrality = function () {
        var _this = this;
        var closeness = new Map();
        var n = this.nodes.length;
        this.nodes.forEach(function (node, i) {
            var totalDistance = 0;
            var reachableNodes = 0;
            for (var j = 0; j < n; j++) {
                if (i !== j) {
                    var distance = _this.findShortestPath(i, j).length - 1;
                    if (distance > 0) {
                        totalDistance += distance;
                        reachableNodes++;
                    }
                }
            }
            closeness.set(node.id, reachableNodes > 0 ? reachableNodes / totalDistance : 0);
        });
        return closeness;
    };
    GraphAnalyzer.prototype.calculatePageRank = function (damping, iterations) {
        var _this = this;
        if (damping === void 0) { damping = 0.85; }
        if (iterations === void 0) { iterations = 100; }
        var n = this.nodes.length;
        var pageRank = new Map();
        this.nodes.forEach(function (node) { return pageRank.set(node.id, 1 / n); });
        var _loop_2 = function (iter) {
            var newRank = new Map();
            this_2.nodes.forEach(function (node, i) {
                var sum = 0;
                var incomingEdges = _this.edges.filter(function (e) { return e.target === node.id; });
                incomingEdges.forEach(function (edge) {
                    var sourceRank = pageRank.get(edge.source) || 0;
                    var sourceDegree = _this.edges.filter(function (e) { return e.source === edge.source; }).length;
                    sum += sourceRank / sourceDegree;
                });
                newRank.set(node.id, (1 - damping) / n + damping * sum);
            });
            pageRank = newRank;
        };
        var this_2 = this;
        for (var iter = 0; iter < iterations; iter++) {
            _loop_2(iter);
        }
        return pageRank;
    };
    GraphAnalyzer.prototype.detectCommunities = function () {
        var _this = this;
        var communities = new Map();
        var currentCommunity = 0;
        var visited = new Set();
        var dfs = function (nodeId) {
            visited.add(nodeId);
            communities.set(nodeId, currentCommunity);
            var neighbors = _this.edges
                .filter(function (e) { return e.source === nodeId || e.target === nodeId; })
                .map(function (e) { return e.source === nodeId ? e.target : e.source; });
            neighbors.forEach(function (neighbor) {
                if (!visited.has(neighbor)) {
                    dfs(neighbor);
                }
            });
        };
        this.nodes.forEach(function (node) {
            if (!visited.has(node.id)) {
                dfs(node.id);
                currentCommunity++;
            }
        });
        return communities;
    };
    GraphAnalyzer.prototype.findAllShortestPaths = function (start, end) {
        var paths = [];
        var queue = [{ path: [start], node: start }];
        var shortestLength = this.findShortestPath(start, end).length;
        while (queue.length > 0) {
            var _a = queue.shift(), path = _a.path, node = _a.node;
            if (path.length > shortestLength)
                break;
            if (node === end && path.length === shortestLength) {
                paths.push(path);
                continue;
            }
            for (var i = 0; i < this.adjacencyMatrix[node].length; i++) {
                if (this.adjacencyMatrix[node][i] && !path.includes(i)) {
                    queue.push({
                        path: __spreadArray(__spreadArray([], path, true), [i], false),
                        node: i
                    });
                }
            }
        }
        return paths;
    };
    GraphAnalyzer.prototype.findShortestPath = function (start, end) {
        var visited = new Set();
        var queue = [{ path: [start], node: start }];
        while (queue.length > 0) {
            var _a = queue.shift(), path = _a.path, node = _a.node;
            if (node === end)
                return path;
            if (!visited.has(node)) {
                visited.add(node);
                for (var i = 0; i < this.adjacencyMatrix[node].length; i++) {
                    if (this.adjacencyMatrix[node][i] && !visited.has(i)) {
                        queue.push({
                            path: __spreadArray(__spreadArray([], path, true), [i], false),
                            node: i
                        });
                    }
                }
            }
        }
        return [start];
    };
    GraphAnalyzer.prototype.analyzeGraph = function () {
        var _this = this;
        var degrees = this.calculateDegrees();
        var betweenness = this.calculateBetweennessCentrality();
        var closeness = this.calculateClosenessCentrality();
        var pageRank = this.calculatePageRank();
        var communities = this.detectCommunities();
        this.nodes.forEach(function (node) {
            var degree = degrees.get(node.id);
            _this.nodeMetrics.set(node.id, {
                degree: (degree === null || degree === void 0 ? void 0 : degree.total) || 0,
                inDegree: (degree === null || degree === void 0 ? void 0 : degree.in) || 0,
                outDegree: (degree === null || degree === void 0 ? void 0 : degree.out) || 0,
                betweennessCentrality: betweenness.get(node.id) || 0,
                closenessCentrality: closeness.get(node.id) || 0,
                eigenvectorCentrality: 0,
                pageRank: pageRank.get(node.id) || 0,
                clusteringCoefficient: _this.calculateLocalClusteringCoefficient(node.id),
                community: communities.get(node.id) || 0
            });
        });
        return this.nodeMetrics;
    };
    GraphAnalyzer.prototype.calculateLocalClusteringCoefficient = function (nodeId) {
        var neighbors = this.edges
            .filter(function (e) { return e.source === nodeId || e.target === nodeId; })
            .map(function (e) { return e.source === nodeId ? e.target : e.source; });
        if (neighbors.length < 2)
            return 0;
        var connections = 0;
        var _loop_3 = function (i) {
            var _loop_4 = function (j) {
                if (this_3.edges.some(function (e) { return (e.source === neighbors[i] && e.target === neighbors[j]) ||
                    (e.source === neighbors[j] && e.target === neighbors[i]); })) {
                    connections++;
                }
            };
            for (var j = i + 1; j < neighbors.length; j++) {
                _loop_4(j);
            }
        };
        var this_3 = this;
        for (var i = 0; i < neighbors.length; i++) {
            _loop_3(i);
        }
        var possibleConnections = (neighbors.length * (neighbors.length - 1)) / 2;
        return connections / possibleConnections;
    };
    return GraphAnalyzer;
}());
export { GraphAnalyzer };
