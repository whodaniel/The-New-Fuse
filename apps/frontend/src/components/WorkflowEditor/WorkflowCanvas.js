import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState, useEffect } from 'react';
import { ReactFlow, Controls, Background, MiniMap, Panel } from 'reactflow';
import { useSelector, useDispatch } from 'react-redux';
import { NodeLibrary } from './NodeLibrary';
import { ExecutionOverlay } from './ExecutionOverlay';
import { WorkflowToolbar } from './WorkflowToolbar';
import { NodeInspector } from './NodeInspector';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { useWorkflowHistory } from '../../hooks/useWorkflowHistory';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useWorkflowValidation } from '../../hooks/useWorkflowValidation';
import { useRealTimeCollaboration } from '../../hooks/useRealTimeCollaboration';
import { WorkflowAnalytics } from './WorkflowAnalytics';
import { CUSTOM_NODE_TYPES } from './nodes';
import { CUSTOM_EDGE_TYPES } from './edges';
export var WorkflowCanvas = function () {
    var dispatch = useDispatch();
    var _a = useSelector(function (state) { return state.workflow; }), nodes = _a.nodes, edges = _a.edges, selectedNodes = _a.selectedNodes;
    var _b = useState(false), isPanelOpen = _b[0], setIsPanelOpen = _b[1];
    // Initialize hooks
    var _c = useWorkflowHistory(), undo = _c.undo, redo = _c.redo, canUndo = _c.canUndo, canRedo = _c.canRedo;
    var _d = useAutoSave(), saveWorkflow = _d.saveWorkflow, lastSaved = _d.lastSaved;
    var _e = useWorkflowValidation(), validationErrors = _e.validationErrors, validateWorkflow = _e.validateWorkflow;
    var _f = useRealTimeCollaboration(), collaborators = _f.collaborators, onUserAction = _f.onUserAction;
    // Node and edge event handlers
    var onNodesChange = useCallback(function (changes) {
        dispatch({ type: 'UPDATE_NODES', payload: changes });
        onUserAction('node_change', changes);
    }, [dispatch, onUserAction]);
    var onEdgesChange = useCallback(function (changes) {
        dispatch({ type: 'UPDATE_EDGES', payload: changes });
        onUserAction('edge_change', changes);
    }, [dispatch, onUserAction]);
    var onConnect = useCallback(function (connection) {
        dispatch({ type: 'ADD_EDGE', payload: connection });
        onUserAction('connect', connection);
    }, [dispatch, onUserAction]);
    // Validate workflow on changes
    useEffect(function () {
        validateWorkflow({ nodes: nodes, edges: edges });
    }, [nodes, edges, validateWorkflow]);
    return (_jsx(ErrorBoundary, { children: _jsxs("div", { className: "workflow-canvas h-full w-full relative", children: [_jsx(WorkflowToolbar, { onSave: saveWorkflow, canUndo: canUndo, canRedo: canRedo, onUndo: undo, onRedo: redo, lastSaved: lastSaved, validationErrors: validationErrors }), _jsxs("div", { className: "flex h-full", children: [_jsx(NodeLibrary, { isPanelOpen: isPanelOpen, onTogglePanel: function () { return setIsPanelOpen(!isPanelOpen); } }), _jsx("div", { className: "flex-grow relative", children: _jsxs(ReactFlow, { nodes: nodes, edges: edges, onNodesChange: onNodesChange, onEdgesChange: onEdgesChange, onConnect: onConnect, nodeTypes: CUSTOM_NODE_TYPES, edgeTypes: CUSTOM_EDGE_TYPES, proOptions: {
                                    hideAttribution: true,
                                    account: 'pro'
                                }, fitView: true, selectNodesOnDrag: false, snapToGrid: true, snapGrid: [15, 15], children: [_jsx(ExecutionOverlay, {}), _jsx(Controls, { showInteractive: true }), _jsx(Background, { variant: "dots", gap: 12, size: 1 }), _jsx(MiniMap, { nodeStrokeColor: function (n) {
                                            if (n.type === 'input')
                                                return '#0041d0';
                                            if (n.type === 'output')
                                                return '#ff0072';
                                            return '#eee';
                                        }, nodeColor: function (n) {
                                            if (n.type === 'input')
                                                return '#0041d0';
                                            if (n.type === 'output')
                                                return '#ff0072';
                                            return '#fff';
                                        } }), _jsx(Panel, { position: "top-right", children: _jsx(WorkflowAnalytics, { nodes: nodes, edges: edges }) }), collaborators.map(function (user) { return (_jsx("div", { className: "collaborator-cursor", style: {
                                            left: user.position.x,
                                            top: user.position.y,
                                            backgroundColor: user.color
                                        }, children: user.name }, user.id)); })] }) }), selectedNodes.length > 0 && (_jsx(NodeInspector, { node: selectedNodes[0], onUpdate: onNodesChange }))] })] }) }));
};
