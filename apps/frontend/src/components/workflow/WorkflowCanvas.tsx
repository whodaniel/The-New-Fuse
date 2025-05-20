"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowCanvas = void 0;
import react_1 from 'react';
import reactflow_1 from 'reactflow';
require("reactflow/dist/style.css");
import WorkflowContext_1 from '@/contexts/WorkflowContext';
import WorkflowNode_1 from './WorkflowNode.js';
import WorkflowEdge_1 from './WorkflowEdge.js';
import Button_1 from '@/components/ui/Button';
import react_toastify_1 from 'react-toastify';
import WorkflowExecutionContext from './WorkflowExecutionContext.js';
import WorkflowDebugger from './WorkflowDebugger.js';
import WorkflowTemplates from './WorkflowTemplates.js';
import { workflowBuilderConfig } from '@/config/workflow-builder.config';
// Import node components
import {
    AgentNode,
    MCPToolNode,
    InputNode,
    OutputNode,
    ConditionNode,
    TransformNode,
    NotificationNode,
    A2ANode,
    LoopNode,
    SubworkflowNode
} from './nodes.js';

const nodeTypes = {
    agent: AgentNode,
    mcpTool: MCPToolNode,
    input: InputNode,
    output: OutputNode,
    condition: ConditionNode,
    transform: TransformNode,
    notification: NotificationNode,
    a2a: A2ANode,
};
const edgeTypes = {
    default: WorkflowEdge_1.WorkflowEdge,
    conditional: WorkflowEdge_1.WorkflowEdge,
};
const WorkflowCanvas = () => {
    const { nodes, edges, selectedNode, isReadOnly, actions: { addNode, updateNode, removeNode, addEdge, updateEdge, removeEdge, selectNode, clearSelection, validate, optimize, exportWorkflow, importWorkflow, }, } = (0, WorkflowContext_1.useWorkflow)();
    const [rfInstance, setRfInstance] = (0, react_1.useState)(null);
    const { fitView, zoomIn, zoomOut } = (0, reactflow_1.useReactFlow)();
    const canvasRef = (0, react_1.useRef)(null);

    // Get configuration
    const { ui, features } = workflowBuilderConfig;
    const onNodesChange = (0, react_1.useCallback)((changes) => {
        changes.forEach((change) => {
            if (change.type === 'position' && change.position && change.id) {
                updateNode(change.id, { position: change.position });
            }
            else if (change.type === 'remove' && change.id) {
                removeNode(change.id);
            }
        });
    }, [updateNode, removeNode]);
    const onEdgesChange = (0, react_1.useCallback)((changes) => {
        changes.forEach((change) => {
            if (change.type === 'remove' && change.id) {
                removeEdge(change.id);
            }
        });
    }, [removeEdge]);
    const onConnect = (0, react_1.useCallback)((params) => {
        if (params.source && params.target) {
            addEdge(params.source, params.target);
        }
    }, [addEdge]);
    const onNodeClick = (0, react_1.useCallback)((_, node) => {
        selectNode(node);
    }, [selectNode]);
    const onPaneClick = (0, react_1.useCallback)(() => {
        clearSelection();
    }, [clearSelection]);
    const handleSave = (0, react_1.useCallback)(() => {
        if (rfInstance) {
            const flow = rfInstance.toObject();
            localStorage.setItem('workflow', JSON.stringify(flow));
            react_toastify_1.toast.success('Workflow saved successfully');
        }
    }, [rfInstance]);
    const handleLoad = (0, react_1.useCallback)(() => {
        const savedFlow = localStorage.getItem('workflow');
        if (savedFlow) {
            const flow = JSON.parse(savedFlow);
            importWorkflow(flow);
            react_toastify_1.toast.success('Workflow loaded successfully');
        }
    }, [importWorkflow]);
    const handleValidate = (0, react_1.useCallback)(() => {
        const isValid = validate();
        if (isValid) {
            react_toastify_1.toast.success('Workflow is valid');
        }
    }, [validate]);
    const handleOptimize = (0, react_1.useCallback)(() => {
        optimize();
        react_toastify_1.toast.success('Workflow optimized');
    }, [optimize]);
    const handleExport = (0, react_1.useCallback)(() => {
        const flow = exportWorkflow();
        const blob = new Blob([JSON.stringify(flow, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'workflow.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        react_toastify_1.toast.success('Workflow exported successfully');
    }, [exportWorkflow]);
    const handleImport = (0, react_1.useCallback)(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            var _a;
            const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    var _a;
                    try {
                        const flow = JSON.parse((_a = event.target) === null || _a === void 0 ? void 0 : _a.result);
                        importWorkflow(flow);
                        react_toastify_1.toast.success('Workflow imported successfully');
                    }
                    catch (error) {
                        react_toastify_1.toast.error('Failed to import workflow: Invalid format');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }, [importWorkflow]);

    // Import workflow from template
    const handleImportTemplate = (0, react_1.useCallback)((template) => {
        if (isReadOnly) {
            react_toastify_1.toast.warning('Cannot apply template in read-only mode');
            return;
        }

        try {
            // Import template as workflow
            const flow = {
                nodes: template.nodes.map(nod(e: any) => ({
                    ...node,
                    data: {
                        ...node.data,
                        onUpdate: handleNodeUpdate
                    }
                })),
                edges: template.edges
            };

            importWorkflow(flow);
            react_toastify_1.toast.success(`Applied template: ${template.name}`);
        } catch (error) {
            console.error('Error applying template:', error);
            react_toastify_1.toast.error('Failed to apply template');
        }
    }, [importWorkflow, isReadOnly, handleNodeUpdate]);
    return (<div ref={canvasRef} className="h-screen w-full">
      <reactflow_1.default
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={setRfInstance}
        fitView
        attributionPosition="bottom-right"
        nodesDraggable={!isReadOnly}
        nodesConnectable={!isReadOnly}
        elementsSelectable={!isReadOnly}
        minZoom={0.1}
        maxZoom={4}
        defaultEdgeOptions={{ type: ui.defaultEdgeType }}
        snapToGrid={ui.snapToGrid}
        snapGrid={[ui.gridSize, ui.gridSize]}>
        {ui.showGrid && (
          <reactflow_1.Background
            variant={reactflow_1.BackgroundVariant.Dots}
            gap={ui.gridSize}
            size={1}
            color="#cccccc"
          />
        )}
        <reactflow_1.Controls showInteractive={false}/>
        {ui.showMinimap && (
          <reactflow_1.MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case 'agent':
                  return '#6366f1';
                case 'mcpTool':
                  return '#10b981';
                case 'input':
                  return '#3b82f6';
                case 'output':
                  return '#ef4444';
                case 'condition':
                  return '#f59e0b';
                case 'transform':
                  return '#8b5cf6';
                case 'notification':
                  return '#0ea5e9';
                case 'a2a':
                  return '#ec4899';
                case 'loop':
                  return '#f97316';
                case 'subworkflow':
                  return '#14b8a6';
                default:
                  return '#94a3b8';
              }
            }}
            style={{ height: 120 }}
          />
        )}
        <reactflow_1.Panel position="top-right" className="space-x-2">
          <WorkflowTemplates onApplyTemplate={handleImportTemplate} />
          <Button_1.Button variant="outline" size="sm" onClick={handleSave} disabled={isReadOnly}>
            Save
          </Button_1.Button>
          <Button_1.Button variant="outline" size="sm" onClick={handleLoad} disabled={isReadOnly}>
            Load
          </Button_1.Button>
          <Button_1.Button variant="outline" size="sm" onClick={handleValidate}>
            Validate
          </Button_1.Button>
          <Button_1.Button variant="outline" size="sm" onClick={handleOptimize} disabled={isReadOnly}>
            Optimize
          </Button_1.Button>
          <Button_1.Button variant="outline" size="sm" onClick={handleExport}>
            Export
          </Button_1.Button>
          <Button_1.Button variant="outline" size="sm" onClick={handleImport} disabled={isReadOnly}>
            Import
          </Button_1.Button>
        </reactflow_1.Panel>

        {/* Workflow Execution Context */}
        <WorkflowExecutionContext workflowId={workflow?.id || 'current'} />

        {/* Workflow Debugger */}
        {features.enableDebugging && (
          <WorkflowDebugger workflowId={workflow?.id || 'current'} />
        )}

        {/* Grid */}
        {ui.showGrid && <reactflow_1.Background gap={ui.gridSize} size={1} />}

        {/* Minimap */}
        {ui.showMinimap && <reactflow_1.MiniMap />}
      </reactflow_1.default>
    </div>);
};
exports.WorkflowCanvas = WorkflowCanvas;
export {};
//# sourceMappingURL=WorkflowCanvas.js.map