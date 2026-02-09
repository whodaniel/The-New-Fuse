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
exports.WorkflowCanvas = void 0;
var react_1 = require("react");
var reactflow_1 = require("reactflow");
var WorkflowContext_1 = require("./WorkflowContext");
require("reactflow/dist/style.css");
var WorkflowCanvas = function (_a) {
    var nodeTypes = _a.nodeTypes, edgeTypes = _a.edgeTypes, onNodeDoubleClick = _a.onNodeDoubleClick, onEdgeDoubleClick = _a.onEdgeDoubleClick, _b = _a.className, className = _b === void 0 ? '' : _b;
    var _c = (0, WorkflowContext_1.useWorkflow)(), workflow = _c.workflow, setWorkflow = _c.setWorkflow, selectNode = _c.selectNode, selectEdge = _c.selectEdge;
    var onNodesChange = (0, react_1.useCallback)(function (changes) {
        setWorkflow(function (prev) {
            var nextNodes = __spreadArray([], prev.nodes, true);
            changes.forEach(function (change) {
                switch (change.type) {
                    case 'position':
                        var node = nextNodes.find(function (n) { return n.id === change.id; });
                        if (node) {
                            node.position = change.position;
                        }
                        break;
                    case 'remove':
                        var index = nextNodes.findIndex(function (n) { return n.id === change.id; });
                        if (index !== -1) {
                            nextNodes.splice(index, 1);
                        }
                        break;
                    // Handle other change types as needed
                }
            });
            return __assign(__assign({}, prev), { nodes: nextNodes });
        });
    }, [setWorkflow]);
    var onEdgesChange = (0, react_1.useCallback)(function (changes) {
        setWorkflow(function (prev) {
            var nextEdges = __spreadArray([], prev.edges, true);
            changes.forEach(function (change) {
                switch (change.type) {
                    case 'remove':
                        var index = nextEdges.findIndex(function (e) { return e.id === change.id; });
                        if (index !== -1) {
                            nextEdges.splice(index, 1);
                        }
                        break;
                    // Handle other change types as needed
                }
            });
            return __assign(__assign({}, prev), { edges: nextEdges });
        });
    }, [setWorkflow]);
    var onConnect = (0, react_1.useCallback)(function (connection) {
        setWorkflow(function (prev) { return (__assign(__assign({}, prev), { edges: __spreadArray(__spreadArray([], prev.edges, true), [
                {
                    id: "".concat(connection.source, "-").concat(connection.target),
                    source: connection.source,
                    target: connection.target,
                },
            ], false) })); });
    }, [setWorkflow]);
    return (<div className={"h-full w-full ".concat(className)}>
      <reactflow_1.default nodes={workflow.nodes} edges={workflow.edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={function (_, node) { return selectNode(node); }} onEdgeClick={function (_, edge) { return selectEdge(edge); }} onNodeDoubleClick={onNodeDoubleClick} onEdgeDoubleClick={onEdgeDoubleClick} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView>
        <reactflow_1.Background />
        <reactflow_1.Controls />
        <reactflow_1.MiniMap />
      </reactflow_1.default>
    </div>);
};
exports.WorkflowCanvas = WorkflowCanvas;
export {};
