"use strict";
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWorkflow = exports.WorkflowProvider = void 0;
var react_1 = require("react");
var defaultWorkflow = {
    nodes: [],
    edges: [],
};
var WorkflowContext = (0, react_1.createContext)(undefined);
var WorkflowProvider = function (_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)(defaultWorkflow), workflow = _b[0], setWorkflowState = _b[1];
    var _c = (0, react_1.useState)(null), selectedNode = _c[0], setSelectedNode = _c[1];
    var _d = (0, react_1.useState)(null), selectedEdge = _d[0], setSelectedEdge = _d[1];
    var setWorkflow = (0, react_1.useCallback)(function (newWorkflow) {
        setWorkflowState(newWorkflow);
    }, []);
    var addNode = (0, react_1.useCallback)(function (node) {
        setWorkflowState(function (prev) { return (__assign(__assign({}, prev), { nodes: __spreadArray(__spreadArray([], prev.nodes, true), [node], false) })); });
    }, []);
    var updateNode = (0, react_1.useCallback)(function (nodeId, data) {
        setWorkflowState(function (prev) { return (__assign(__assign({}, prev), { nodes: prev.nodes.map(function (node) {
                return node.id === nodeId ? __assign(__assign({}, node), data) : node;
            }) })); });
    }, []);
    var removeNode = (0, react_1.useCallback)(function (nodeId) {
        setWorkflowState(function (prev) { return ({
            edges: prev.edges.filter(function (edge) { return edge.source !== nodeId && edge.target !== nodeId; }),
            nodes: prev.nodes.filter(function (node) { return node.id !== nodeId; }),
        }); });
    }, []);
    var addEdge = (0, react_1.useCallback)(function (edge) {
        setWorkflowState(function (prev) { return (__assign(__assign({}, prev), { edges: __spreadArray(__spreadArray([], prev.edges, true), [edge], false) })); });
    }, []);
    var updateEdge = (0, react_1.useCallback)(function (edgeId, data) {
        setWorkflowState(function (prev) { return (__assign(__assign({}, prev), { edges: prev.edges.map(function (edge) {
                return edge.id === edgeId ? __assign(__assign({}, edge), data) : edge;
            }) })); });
    }, []);
    var removeEdge = (0, react_1.useCallback)(function (edgeId) {
        setWorkflowState(function (prev) { return (__assign(__assign({}, prev), { edges: prev.edges.filter(function (edge) { return edge.id !== edgeId; }) })); });
    }, []);
    var selectNode = (0, react_1.useCallback)(function (node) {
        setSelectedNode(node);
    }, []);
    var selectEdge = (0, react_1.useCallback)(function (edge) {
        setSelectedEdge(edge);
    }, []);
    var value = {
        workflow: workflow,
        selectedNode: selectedNode,
        selectedEdge: selectedEdge,
        setWorkflow: setWorkflow,
        addNode: addNode,
        updateNode: updateNode,
        removeNode: removeNode,
        addEdge: addEdge,
        updateEdge: updateEdge,
        removeEdge: removeEdge,
        selectNode: selectNode,
        selectEdge: selectEdge,
    };
    return (<WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>);
};
exports.WorkflowProvider = WorkflowProvider;
var useWorkflow = function () {
    var context = (0, react_1.useContext)(WorkflowContext);
    if (context === undefined) {
        throw new Error('useWorkflow must be used within a WorkflowProvider');
    }
    return context;
};
exports.useWorkflow = useWorkflow;
export {};
