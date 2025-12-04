var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var AdvancedGraphAlgorithms = /** @class */ (function () {
    function AdvancedGraphAlgorithms(nodes, edges) {
        this.nodes = nodes;
        this.edges = edges;
        this.nodeIndices = new Map(nodes.map(function (node, i) { return [node.id, i]; }));
        this.adjacencyMatrix = this.buildAdjacencyMatrix();
        this.laplacianMatrix = this.buildLaplacianMatrix();
    }
    AdvancedGraphAlgorithms.prototype.buildAdjacencyMatrix = function () {
        var _this = this;
        var n = this.nodes.length;
        var matrix = Array(n).fill(0).map(function () { return Array(n).fill(0); });
        this.edges.forEach(function (edge) {
            var sourceIdx = _this.nodeIndices.get(edge.source);
            var targetIdx = _this.nodeIndices.get(edge.target);
            if (sourceIdx !== undefined && targetIdx !== undefined) {
                matrix[sourceIdx][targetIdx] = 1;
                matrix[targetIdx][sourceIdx] = 1;
            }
        });
        return matrix;
    };
    AdvancedGraphAlgorithms.prototype.buildLaplacianMatrix = function () {
        var n = this.nodes.length;
        var matrix = Array(n).fill(0).map(function () { return Array(n).fill(0); });
        var degrees = this.adjacencyMatrix.map(function (row) { return row.reduce(function (a, b) { return a + b; }, 0); });
        for (var i = 0; i < n; i++) {
            matrix[i][i] = degrees[i];
            for (var j = 0; j < n; j++) {
                if (i !== j) {
                    matrix[i][j] = -this.adjacencyMatrix[i][j];
                }
            }
        }
        return matrix;
    };
    AdvancedGraphAlgorithms.prototype.powerIteration = function (matrix, iterations) {
        if (iterations === void 0) { iterations = 100; }
        var n = matrix.length;
        var vector = Array(n).fill(1 / Math.sqrt(n));
        var eigenvalue = 0;
        var _loop_1 = function (iter) {
            var newVector = Array(n).fill(0);
            for (var i = 0; i < n; i++) {
                for (var j = 0; j < n; j++) {
                    newVector[i] += matrix[i][j] * vector[j];
                }
            }
            var norm = Math.sqrt(newVector.reduce(function (a, b) { return a + b * b; }, 0));
            vector = newVector.map(function (v) { return v / norm; });
            eigenvalue = vector.reduce(function (sum, v, i) {
                return sum + v * (matrix[i].reduce(function (s, m, j) { return s + m * vector[j]; }, 0));
            }, 0);
        };
        for (var iter = 0; iter < iterations; iter++) {
            _loop_1(iter);
        }
        return [vector, eigenvalue];
    };
    AdvancedGraphAlgorithms.prototype.calculateEigenvectorCentrality = function () {
        var eigenvector = this.powerIteration(this.adjacencyMatrix)[0];
        return new Map(this.nodes.map(function (node, i) { return [node.id, eigenvector[i]]; }));
    };
    AdvancedGraphAlgorithms.prototype.calculateKatzCentrality = function (alpha) {
        var _this = this;
        if (alpha === void 0) { alpha = 0.1; }
        var n = this.nodes.length;
        var beta = 1;
        var identity = Array(n).fill(0).map(function (_, i) { return Array(n).fill(0).map(function (_, j) { return i === j ? 1 : 0; }); });
        var matrix = identity.map(function (row, i) { return row.map(function (val, j) { return val - alpha * _this.adjacencyMatrix[i][j]; }); });
        var katz = Array(n).fill(beta);
        for (var i = 0; i < n; i++) {
            var pivot = matrix[i][i];
            for (var j = i + 1; j < n; j++) {
                var factor = matrix[j][i] / pivot;
                for (var k = i; k < n; k++) {
                    matrix[j][k] -= factor * matrix[i][k];
                }
                katz[j] -= factor * katz[i];
            }
        }
        for (var i = n - 1; i >= 0; i--) {
            for (var j = i + 1; j < n; j++) {
                katz[i] -= matrix[i][j] * katz[j];
            }
            katz[i] /= matrix[i][i];
        }
        return new Map(this.nodes.map(function (node, i) { return [node.id, katz[i]]; }));
    };
    AdvancedGraphAlgorithms.prototype.calculateSpectralProperties = function () {
        var numEigenvalues = Math.min(5, this.nodes.length);
        var eigenvalues = [];
        var eigenvectors = [];
        var matrix = this.adjacencyMatrix.map(function (row) { return __spreadArray([], row, true); });
        for (var i = 0; i < numEigenvalues; i++) {
            var _a = this.powerIteration(matrix), eigenvector = _a[0], eigenvalue = _a[1];
            eigenvalues.push(eigenvalue);
            eigenvectors.push(eigenvector);
            for (var j = 0; j < matrix.length; j++) {
                for (var k = 0; k < matrix.length; k++) {
                    matrix[j][k] -= eigenvalue * eigenvector[j] * eigenvector[k];
                }
            }
        }
        var _b = this.powerIteration(this.laplacianMatrix), _ = _b[0], laplacianEigenvalue = _b[1];
        var laplacianSpectrum = [laplacianEigenvalue];
        return {
            eigenvalues: eigenvalues,
            eigenvectors: eigenvectors,
            laplacianSpectrum: laplacianSpectrum
        };
    };
    AdvancedGraphAlgorithms.prototype.detectStructuralHoles = function () {
        var _this = this;
        var constraints = new Map();
        this.nodes.forEach(function (node) {
            var neighbors = _this.edges
                .filter(function (e) { return e.source === node.id || e.target === node.id; })
                .map(function (e) { return e.source === node.id ? e.target : e.source; });
            if (neighbors.length < 2) {
                constraints.set(node.id, 0);
                return;
            }
            var constraint = 0;
            neighbors.forEach(function (neighbor1) {
                neighbors.forEach(function (neighbor2) {
                    if (neighbor1 !== neighbor2) {
                        var hasConnection = _this.edges.some(function (e) { return (e.source === neighbor1 && e.target === neighbor2) ||
                            (e.source === neighbor2 && e.target === neighbor1); });
                        if (hasConnection) {
                            constraint += 1 / (neighbors.length * neighbors.length);
                        }
                    }
                });
            });
            constraints.set(node.id, 1 - constraint);
        });
        return constraints;
    };
    AdvancedGraphAlgorithms.prototype.findCorePeriphery = function () {
        var _this = this;
        var degrees = new Map();
        this.nodes.forEach(function (node) {
            degrees.set(node.id, _this.edges.filter(function (e) { return e.source === node.id || e.target === node.id; }).length);
        });
        var sortedNodes = __spreadArray([], degrees.entries(), true).sort(function (a, b) { return b[1] - a[1]; });
        var medianDegree = sortedNodes[Math.floor(sortedNodes.length / 2)][1];
        var core = new Set();
        var periphery = new Set();
        sortedNodes.forEach(function (_a) {
            var nodeId = _a[0], degree = _a[1];
            if (degree > medianDegree) {
                core.add(nodeId);
            }
            else {
                periphery.add(nodeId);
            }
        });
        return { core: core, periphery: periphery };
    };
    AdvancedGraphAlgorithms.prototype.calculateAllMetrics = function () {
        var _this = this;
        var eigenvectorCentrality = this.calculateEigenvectorCentrality();
        var katzCentrality = this.calculateKatzCentrality();
        var spectralProperties = this.calculateSpectralProperties();
        var structuralHoles = this.detectStructuralHoles();
        var _a = this.findCorePeriphery(), core = _a.core, periphery = _a.periphery;
        var degreeCentrality = new Map();
        this.nodes.forEach(function (node) {
            degreeCentrality.set(node.id, _this.edges.filter(function (e) { return e.source === node.id || e.target === node.id; }).length);
        });
        var localCoefficients = new Map();
        var globalCoefficient = 0;
        this.nodes.forEach(function (node) {
            var neighbors = _this.edges
                .filter(function (e) { return e.source === node.id || e.target === node.id; })
                .map(function (e) { return e.source === node.id ? e.target : e.source; });
            if (neighbors.length < 2) {
                localCoefficients.set(node.id, 0);
                return;
            }
            var triangles = 0;
            var _loop_2 = function (i) {
                var _loop_3 = function (j) {
                    if (_this.edges.some(function (e) { return (e.source === neighbors[i] && e.target === neighbors[j]) ||
                        (e.source === neighbors[j] && e.target === neighbors[i]); })) {
                        triangles++;
                    }
                };
                for (var j = i + 1; j < neighbors.length; j++) {
                    _loop_3(j);
                }
            };
            for (var i = 0; i < neighbors.length; i++) {
                _loop_2(i);
            }
            var coefficient = (2 * triangles) / (neighbors.length * (neighbors.length - 1));
            localCoefficients.set(node.id, coefficient);
            globalCoefficient += coefficient;
        });
        globalCoefficient /= this.nodes.length;
        var communities = new Map();
        core.forEach(function (nodeId) { return communities.set(nodeId, 1); });
        periphery.forEach(function (nodeId) { return communities.set(nodeId, 0); });
        return {
            centrality: {
                degree: degreeCentrality,
                betweenness: new Map(),
                closeness: new Map(),
                eigenvector: eigenvectorCentrality,
                katz: katzCentrality
            },
            clustering: {
                globalCoefficient: globalCoefficient,
                localCoefficients: localCoefficients,
                communities: communities
            },
            paths: {
                averagePathLength: 0,
                diameter: 0,
                eccentricity: new Map()
            },
            spectral: spectralProperties
        };
    };
    return AdvancedGraphAlgorithms;
}());
export { AdvancedGraphAlgorithms };
