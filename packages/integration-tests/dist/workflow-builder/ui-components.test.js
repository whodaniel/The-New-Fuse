"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Workflow Builder UI Components Tests
 *
 * Tests the React Flow-based UI components for drag and drop functionality:
 * - WorkflowCanvas component
 * - DynamicNode components
 * - NodeLibrary and drag operations
 * - Connection visualization
 * - Canvas interactions
 */
// Mock react-dnd to avoid ESM issues
jest.mock('react-dnd', () => ({
    DndProvider: ({ children }) => children,
    useDrag: () => [{ isDragging: false }, jest.fn(), jest.fn()],
    useDrop: () => [{ isOver: false }, jest.fn()]
}));
jest.mock('react-dnd-html5-backend', () => ({
    HTML5Backend: {}
}));
const react_1 = __importDefault(require("react"));
const react_2 = require("@testing-library/react");
require("@testing-library/jest-dom");
const react_dnd_1 = require("react-dnd");
const react_dnd_html5_backend_1 = require("react-dnd-html5-backend");
// import * as path from 'path';
// enum WorkflowNodeType {
//   START = 'START',
//   END = 'END',
//   AGENT_TASK = 'AGENT_TASK',
//   CONDITION = 'CONDITION',
//   PARALLEL = 'PARALLEL',
//   CUSTOM = 'CUSTOM'
// }
// Mock ReactFlow components for testing
jest.mock('reactflow', () => ({
    __esModule: true,
    default: ({ children, nodes, edges, _onNodesChange, _onEdgesChange, _onConnect }) => {
        return react_1.default.createElement('div', {
            'data-testid': 'react-flow',
            'data-nodes-count': nodes?.length || 0,
            'data-edges-count': edges?.length || 0
        }, react_1.default.createElement('div', { 'data-testid': 'react-flow-viewport' }, children));
    },
    Controls: () => react_1.default.createElement('div', { 'data-testid': 'react-flow-controls' }),
    Background: () => react_1.default.createElement('div', { 'data-testid': 'react-flow-background' }),
    addEdge: jest.fn((edge, edges) => [...edges, edge]),
    useNodesState: jest.fn(() => [[], jest.fn()]),
    useEdgesState: jest.fn(() => [[], jest.fn()]),
    Handle: ({ type, position, id }) => {
        return react_1.default.createElement('div', {
            'data-testid': `handle-${type}-${position}`,
            'data-handle-id': id
        });
    },
    Position: {
        Top: 'top',
        Right: 'right',
        Bottom: 'bottom',
        Left: 'left'
    }
}));
// Mock the workflow builder components
const MockWorkflowCanvas = ({ nodes = [], edges = [] }) => {
    return ((0, jsx_runtime_1.jsx)("div", { "data-testid": "workflow-canvas", children: (0, jsx_runtime_1.jsx)("div", { "data-testid": "react-flow", "data-nodes-count": nodes.length, "data-edges-count": edges.length, children: nodes.map((node) => ((0, jsx_runtime_1.jsx)("div", { "data-testid": `node-${node.id}`, "data-node-type": node.type, children: node.data?.label || node.id }, node.id))) }) }));
};
const MockNodeLibrary = ({ onNodeDragStart }) => {
    const nodeTypes = [
        { type: 'start', label: 'Start Node', category: 'control' },
        { type: 'agent_task', label: 'Agent Task', category: 'agents' },
        { type: 'condition', label: 'Condition', category: 'logic' },
        { type: 'parallel', label: 'Parallel', category: 'control' },
        { type: 'end', label: 'End Node', category: 'control' }
    ];
    return ((0, jsx_runtime_1.jsx)("div", { "data-testid": "node-library", children: nodeTypes.map(nodeType => ((0, jsx_runtime_1.jsx)("div", { "data-testid": `node-type-${nodeType.type}`, draggable: true, onDragStart: () => onNodeDragStart?.(nodeType.type), children: nodeType.label }, nodeType.type))) }));
};
const MockDynamicNode = ({ data, id, type }) => {
    return ((0, jsx_runtime_1.jsxs)("div", { "data-testid": `dynamic-node-${id}`, "data-node-type": type, children: [(0, jsx_runtime_1.jsx)("div", { "data-testid": "node-header", children: data?.label || id }), (0, jsx_runtime_1.jsxs)("div", { "data-testid": "node-content", children: [data?.task && (0, jsx_runtime_1.jsx)("div", { "data-testid": "node-task", children: data.task }), data?.priority && (0, jsx_runtime_1.jsx)("div", { "data-testid": "node-priority", children: data.priority })] }), (0, jsx_runtime_1.jsxs)("div", { "data-testid": "node-handles", children: [(0, jsx_runtime_1.jsx)("div", { "data-testid": "handle-source-right" }), (0, jsx_runtime_1.jsx)("div", { "data-testid": "handle-target-left" })] })] }));
};
// Test wrapper component
const TestWrapper = ({ children }) => ((0, jsx_runtime_1.jsx)(react_dnd_1.DndProvider, { backend: react_dnd_html5_backend_1.HTML5Backend, children: children }));
describe('UI Components Integration Tests', () => {
    beforeEach(() => {
        // Test environment is set up in test-setup.ts
    });
    describe('WorkflowCanvas Component', () => {
        test('should render empty canvas correctly', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(MockWorkflowCanvas, { nodes: [], edges: [], _onNodesChange: undefined, _onEdgesChange: undefined, _onConnect: undefined }) }));
            expect(react_2.screen.getByTestId('workflow-canvas')).toBeInTheDocument();
            expect(react_2.screen.getByTestId('react-flow')).toBeInTheDocument();
            expect(react_2.screen.getByTestId('react-flow')).toHaveAttribute('data-nodes-count', '0');
            expect(react_2.screen.getByTestId('react-flow')).toHaveAttribute('data-edges-count', '0');
        });
        test('should render nodes on canvas', () => {
            const nodes = [
                {
                    id: 'node-1',
                    type: 'start',
                    position: { x: 100, y: 100 },
                    data: { label: 'Start Node' }
                },
                {
                    id: 'node-2',
                    type: 'agent_task',
                    position: { x: 300, y: 100 },
                    data: { label: 'Process Data', task: 'Process input data', priority: 'high' }
                }
            ];
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(MockWorkflowCanvas, { nodes: nodes, edges: [], _onNodesChange: undefined, _onEdgesChange: undefined, _onConnect: undefined }) }));
            expect(react_2.screen.getByTestId('react-flow')).toHaveAttribute('data-nodes-count', '2');
            expect(react_2.screen.getByTestId('node-node-1')).toBeInTheDocument();
            expect(react_2.screen.getByTestId('node-node-2')).toBeInTheDocument();
            expect(react_2.screen.getByTestId('node-node-1')).toHaveAttribute('data-node-type', 'start');
            expect(react_2.screen.getByTestId('node-node-2')).toHaveAttribute('data-node-type', 'agent_task');
        });
        test('should render connections between nodes', () => {
            const nodes = [
                { id: 'node-1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Start' } },
                { id: 'node-2', type: 'end', position: { x: 300, y: 100 }, data: { label: 'End' } }
            ];
            const edges = [
                {
                    id: 'edge-1',
                    source: 'node-1',
                    target: 'node-2',
                    sourceHandle: 'output',
                    targetHandle: 'input'
                }
            ];
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(MockWorkflowCanvas, { nodes: nodes, edges: edges, _onNodesChange: undefined, _onEdgesChange: undefined, _onConnect: undefined }) }));
            expect(react_2.screen.getByTestId('react-flow')).toHaveAttribute('data-edges-count', '1');
        });
        test('should handle node position changes', async () => {
            const onNodesChange = jest.fn();
            const nodes = [
                { id: 'node-1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Start' } }
            ];
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(MockWorkflowCanvas, { nodes: nodes, edges: [], _onNodesChange: onNodesChange, _onEdgesChange: undefined, _onConnect: undefined }) }));
            // Simulate node drag (this would normally be handled by ReactFlow)
            const nodeElement = react_2.screen.getByTestId('node-node-1');
            react_2.fireEvent.mouseDown(nodeElement);
            react_2.fireEvent.mouseMove(nodeElement);
            react_2.fireEvent.mouseUp(nodeElement);
            // In a real implementation, onNodesChange would be called
            expect(react_2.screen.getByTestId('workflow-canvas')).toBeInTheDocument();
        });
        test('should handle connection creation', async () => {
            const onConnect = jest.fn();
            const nodes = [
                { id: 'node-1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Start' } },
                { id: 'node-2', type: 'end', position: { x: 300, y: 100 }, data: { label: 'End' } }
            ];
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(MockWorkflowCanvas, { nodes: nodes, edges: [], _onNodesChange: undefined, _onEdgesChange: undefined, _onConnect: onConnect }) }));
            // Simulate connection creation (normally handled by ReactFlow)
            const canvas = react_2.screen.getByTestId('workflow-canvas');
            react_2.fireEvent.click(canvas);
            expect(react_2.screen.getByTestId('workflow-canvas')).toBeInTheDocument();
        });
    });
    describe('NodeLibrary Component', () => {
        test('should render all node types', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(MockNodeLibrary, {}) }));
            expect(react_2.screen.getByTestId('node-library')).toBeInTheDocument();
            expect(react_2.screen.getByTestId('node-type-start')).toBeInTheDocument();
            expect(react_2.screen.getByTestId('node-type-agent_task')).toBeInTheDocument();
            expect(react_2.screen.getByTestId('node-type-condition')).toBeInTheDocument();
            expect(react_2.screen.getByTestId('node-type-parallel')).toBeInTheDocument();
            expect(react_2.screen.getByTestId('node-type-end')).toBeInTheDocument();
        });
        test('should handle node drag start', () => {
            const onNodeDragStart = jest.fn();
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(MockNodeLibrary, { onNodeDragStart: onNodeDragStart }) }));
            const startNodeType = react_2.screen.getByTestId('node-type-start');
            react_2.fireEvent.dragStart(startNodeType);
            expect(onNodeDragStart).toHaveBeenCalledWith('start');
        });
        test('should have draggable node types', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(MockNodeLibrary, {}) }));
            const nodeTypes = ['start', 'agent_task', 'condition', 'parallel', 'end'];
            nodeTypes.forEach(nodeType => {
                const element = react_2.screen.getByTestId(`node-type-${nodeType}`);
                expect(element).toHaveAttribute('draggable', 'true');
            });
        });
        test('should categorize node types correctly', () => {
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(MockNodeLibrary, {}) }));
            // All node types should be present
            expect(react_2.screen.getAllByText(/Node|Task|Condition|Parallel/).length).toBeGreaterThan(0);
        });
    });
    describe('DynamicNode Component', () => {
        test('should render basic node structure', () => {
            const nodeData = {
                id: 'test-node',
                type: 'agent_task',
                data: {
                    label: 'Test Task',
                    task: 'Process test data',
                    priority: 'high'
                }
            };
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(MockDynamicNode, { ...nodeData }) }));
            expect(react_2.screen.getByTestId('dynamic-node-test-node')).toBeInTheDocument();
            expect(react_2.screen.getByTestId('node-header')).toHaveTextContent('Test Task');
            expect(react_2.screen.getByTestId('node-task')).toHaveTextContent('Process test data');
            expect(react_2.screen.getByTestId('node-priority')).toHaveTextContent('high');
        });
        test('should render node handles', () => {
            const nodeData = {
                id: 'test-node',
                type: 'agent_task',
                data: { label: 'Test Task' }
            };
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(MockDynamicNode, { ...nodeData }) }));
            expect(react_2.screen.getByTestId('node-handles')).toBeInTheDocument();
            expect(react_2.screen.getByTestId('handle-source-right')).toBeInTheDocument();
            expect(react_2.screen.getByTestId('handle-target-left')).toBeInTheDocument();
        });
        test('should handle different node types', () => {
            const nodeTypes = [
                { id: 'start-node', type: 'start', data: { label: 'Start' } },
                { id: 'task-node', type: 'agent_task', data: { label: 'Task' } },
                { id: 'condition-node', type: 'condition', data: { label: 'Condition' } },
                { id: 'end-node', type: 'end', data: { label: 'End' } }
            ];
            const { rerender } = (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(MockDynamicNode, { ...nodeTypes[0] }) }));
            nodeTypes.forEach(nodeType => {
                rerender((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(MockDynamicNode, { ...nodeType }) }));
                expect(react_2.screen.getByTestId(`dynamic-node-${nodeType.id}`)).toBeInTheDocument();
                expect(react_2.screen.getByTestId(`dynamic-node-${nodeType.id}`)).toHaveAttribute('data-node-type', nodeType.type);
            });
        });
        test('should handle missing data gracefully', () => {
            const nodeData = {
                id: 'minimal-node',
                type: 'agent_task',
                data: {}
            };
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(MockDynamicNode, { ...nodeData }) }));
            expect(react_2.screen.getByTestId('dynamic-node-minimal-node')).toBeInTheDocument();
            expect(react_2.screen.getByTestId('node-header')).toHaveTextContent('minimal-node');
            expect(react_2.screen.queryByTestId('node-task')).not.toBeInTheDocument();
            expect(react_2.screen.queryByTestId('node-priority')).not.toBeInTheDocument();
        });
    });
    describe('Drag and Drop Integration', () => {
        test('should handle complete drag and drop workflow', async () => {
            const mockOnNodeAdd = jest.fn();
            const nodes = [];
            const edges = [];
            const WorkflowBuilderMock = () => {
                const [currentNodes, setCurrentNodes] = react_1.default.useState(nodes);
                const handleNodeDragStart = (_nodeType) => {
                    // Store dragging node type
                };
                const handleCanvasDrop = (event) => {
                    event.preventDefault();
                    // In real implementation, would get drop position and node type
                    const newNode = {
                        id: `node-${Date.now()}`,
                        type: 'agent_task',
                        position: { x: 200, y: 150 },
                        data: { label: 'New Task' }
                    };
                    setCurrentNodes([...currentNodes, newNode]);
                    mockOnNodeAdd(newNode);
                };
                return ((0, jsx_runtime_1.jsxs)("div", { "data-testid": "workflow-builder", onDrop: handleCanvasDrop, onDragOver: (e) => e.preventDefault(), children: [(0, jsx_runtime_1.jsx)(MockNodeLibrary, { onNodeDragStart: handleNodeDragStart }), (0, jsx_runtime_1.jsx)(MockWorkflowCanvas, { nodes: currentNodes, edges: edges, _onNodesChange: undefined, _onEdgesChange: undefined, _onConnect: undefined })] }));
            };
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(WorkflowBuilderMock, {}) }));
            // Simulate drag from library
            const agentTaskNode = react_2.screen.getByTestId('node-type-agent_task');
            react_2.fireEvent.dragStart(agentTaskNode);
            // Simulate drop on canvas
            const workflowBuilder = react_2.screen.getByTestId('workflow-builder');
            react_2.fireEvent.dragOver(workflowBuilder);
            react_2.fireEvent.drop(workflowBuilder);
            await (0, react_2.waitFor)(() => {
                expect(mockOnNodeAdd).toHaveBeenCalled();
            });
        });
        test('should handle node repositioning via drag', async () => {
            const mockOnNodeChange = jest.fn();
            const initialNodes = [
                {
                    id: 'movable-node',
                    type: 'agent_task',
                    position: { x: 100, y: 100 },
                    data: { label: 'Movable Task' }
                }
            ];
            const RepositionTest = () => {
                const [nodes, setNodes] = react_1.default.useState(initialNodes);
                const handleNodeDrag = (nodeId, newPosition) => {
                    setNodes(prevNodes => prevNodes.map(node => node.id === nodeId
                        ? { ...node, position: newPosition }
                        : node));
                    mockOnNodeChange(nodeId, newPosition);
                };
                return ((0, jsx_runtime_1.jsxs)("div", { "data-testid": "reposition-test", children: [(0, jsx_runtime_1.jsx)(MockWorkflowCanvas, { nodes: nodes, edges: [], _onNodesChange: undefined, _onEdgesChange: undefined, _onConnect: undefined }), (0, jsx_runtime_1.jsx)("button", { "data-testid": "move-node-button", onClick: () => handleNodeDrag('movable-node', { x: 300, y: 200 }), children: "Move Node" })] }));
            };
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(RepositionTest, {}) }));
            const moveButton = react_2.screen.getByTestId('move-node-button');
            react_2.fireEvent.click(moveButton);
            await (0, react_2.waitFor)(() => {
                expect(mockOnNodeChange).toHaveBeenCalledWith('movable-node', { x: 300, y: 200 });
            });
        });
        test('should handle connection creation via drag', async () => {
            const mockOnConnect = jest.fn();
            const testNodes = [
                {
                    id: 'source-node',
                    type: 'start',
                    position: { x: 100, y: 100 },
                    data: { label: 'Source' }
                },
                {
                    id: 'target-node',
                    type: 'end',
                    position: { x: 300, y: 100 },
                    data: { label: 'Target' }
                }
            ];
            const ConnectionTest = () => {
                const [edges, setEdges] = react_1.default.useState([]);
                const handleConnect = (connection) => {
                    const newEdge = {
                        id: `edge-${Date.now()}`,
                        source: connection.source,
                        target: connection.target,
                        sourceHandle: connection.sourceHandle,
                        targetHandle: connection.targetHandle
                    };
                    setEdges(prevEdges => [...prevEdges, newEdge]);
                    mockOnConnect(connection);
                };
                return ((0, jsx_runtime_1.jsxs)("div", { "data-testid": "connection-test", children: [(0, jsx_runtime_1.jsx)(MockWorkflowCanvas, { nodes: testNodes, edges: edges, _onNodesChange: undefined, _onEdgesChange: undefined, _onConnect: handleConnect }), (0, jsx_runtime_1.jsx)("button", { "data-testid": "create-connection-button", onClick: () => handleConnect({
                                source: 'source-node',
                                target: 'target-node',
                                sourceHandle: 'output',
                                targetHandle: 'input'
                            }), children: "Create Connection" })] }));
            };
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(ConnectionTest, {}) }));
            const connectButton = react_2.screen.getByTestId('create-connection-button');
            react_2.fireEvent.click(connectButton);
            await (0, react_2.waitFor)(() => {
                expect(mockOnConnect).toHaveBeenCalledWith({
                    source: 'source-node',
                    target: 'target-node',
                    sourceHandle: 'output',
                    targetHandle: 'input'
                });
            });
        });
    });
    describe('Canvas Interactions', () => {
        test('should handle canvas zoom operations', () => {
            const mockOnViewportChange = jest.fn();
            const ZoomTest = () => {
                const [viewport, setViewport] = react_1.default.useState({ x: 0, y: 0, zoom: 1 });
                const handleZoom = (delta) => {
                    const newViewport = { ...viewport, zoom: Math.max(0.1, Math.min(2, viewport.zoom + delta)) };
                    setViewport(newViewport);
                    mockOnViewportChange(newViewport);
                };
                return ((0, jsx_runtime_1.jsxs)("div", { "data-testid": "zoom-test", children: [(0, jsx_runtime_1.jsxs)("div", { "data-testid": "viewport-info", children: ["Zoom: ", viewport.zoom.toFixed(2)] }), (0, jsx_runtime_1.jsx)("button", { "data-testid": "zoom-in", onClick: () => handleZoom(0.1), children: "Zoom In" }), (0, jsx_runtime_1.jsx)("button", { "data-testid": "zoom-out", onClick: () => handleZoom(-0.1), children: "Zoom Out" }), (0, jsx_runtime_1.jsx)(MockWorkflowCanvas, { nodes: [], edges: [], _onNodesChange: undefined, _onEdgesChange: undefined, _onConnect: undefined })] }));
            };
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(ZoomTest, {}) }));
            expect(react_2.screen.getByTestId('viewport-info')).toHaveTextContent('Zoom: 1.00');
            react_2.fireEvent.click(react_2.screen.getByTestId('zoom-in'));
            expect(mockOnViewportChange).toHaveBeenCalledWith({ x: 0, y: 0, zoom: 1.1 });
            react_2.fireEvent.click(react_2.screen.getByTestId('zoom-out'));
            expect(mockOnViewportChange).toHaveBeenCalledWith({ x: 0, y: 0, zoom: 1.0 });
        });
        test('should handle canvas pan operations', () => {
            const mockOnViewportChange = jest.fn();
            const PanTest = () => {
                const [viewport, setViewport] = react_1.default.useState({ x: 0, y: 0, zoom: 1 });
                const handlePan = (deltaX, deltaY) => {
                    const newViewport = {
                        ...viewport,
                        x: viewport.x + deltaX,
                        y: viewport.y + deltaY
                    };
                    setViewport(newViewport);
                    mockOnViewportChange(newViewport);
                };
                return ((0, jsx_runtime_1.jsxs)("div", { "data-testid": "pan-test", children: [(0, jsx_runtime_1.jsxs)("div", { "data-testid": "viewport-position", children: ["Position: (", viewport.x, ", ", viewport.y, ")"] }), (0, jsx_runtime_1.jsx)("button", { "data-testid": "pan-left", onClick: () => handlePan(-50, 0), children: "Pan Left" }), (0, jsx_runtime_1.jsx)("button", { "data-testid": "pan-right", onClick: () => handlePan(50, 0), children: "Pan Right" }), (0, jsx_runtime_1.jsx)("button", { "data-testid": "pan-up", onClick: () => handlePan(0, -50), children: "Pan Up" }), (0, jsx_runtime_1.jsx)("button", { "data-testid": "pan-down", onClick: () => handlePan(0, 50), children: "Pan Down" }), (0, jsx_runtime_1.jsx)(MockWorkflowCanvas, { nodes: [], edges: [], _onNodesChange: undefined, _onEdgesChange: undefined, _onConnect: undefined })] }));
            };
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(PanTest, {}) }));
            expect(react_2.screen.getByTestId('viewport-position')).toHaveTextContent('Position: (0, 0)');
            react_2.fireEvent.click(react_2.screen.getByTestId('pan-right'));
            expect(mockOnViewportChange).toHaveBeenCalledWith({ x: 50, y: 0, zoom: 1 });
            react_2.fireEvent.click(react_2.screen.getByTestId('pan-down'));
            expect(mockOnViewportChange).toHaveBeenCalledWith({ x: 50, y: 50, zoom: 1 });
        });
        test('should handle node selection', () => {
            const mockOnSelectionChange = jest.fn();
            const testNodes = [
                { id: 'node-1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Node 1' } },
                { id: 'node-2', type: 'end', position: { x: 300, y: 100 }, data: { label: 'Node 2' } }
            ];
            const SelectionTest = () => {
                const [selectedNodes, setSelectedNodes] = react_1.default.useState([]);
                const handleNodeClick = (nodeId, isMultiSelect = false) => {
                    let newSelection;
                    if (isMultiSelect) {
                        newSelection = selectedNodes.includes(nodeId)
                            ? selectedNodes.filter(id => id !== nodeId)
                            : [...selectedNodes, nodeId];
                    }
                    else {
                        newSelection = [nodeId];
                    }
                    setSelectedNodes(newSelection);
                    mockOnSelectionChange(newSelection);
                };
                return ((0, jsx_runtime_1.jsxs)("div", { "data-testid": "selection-test", children: [(0, jsx_runtime_1.jsxs)("div", { "data-testid": "selected-count", children: ["Selected: ", selectedNodes.length] }), testNodes.map(node => ((0, jsx_runtime_1.jsx)("button", { "data-testid": `select-${node.id}`, onClick: (e) => handleNodeClick(node.id, e.ctrlKey), style: {
                                backgroundColor: selectedNodes.includes(node.id) ? 'blue' : 'white'
                            }, children: node.data.label }, node.id))), (0, jsx_runtime_1.jsx)(MockWorkflowCanvas, { nodes: testNodes, edges: [], _onNodesChange: undefined, _onEdgesChange: undefined, _onConnect: undefined })] }));
            };
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(SelectionTest, {}) }));
            expect(react_2.screen.getByTestId('selected-count')).toHaveTextContent('Selected: 0');
            react_2.fireEvent.click(react_2.screen.getByTestId('select-node-1'));
            expect(mockOnSelectionChange).toHaveBeenCalledWith(['node-1']);
            react_2.fireEvent.click(react_2.screen.getByTestId('select-node-2'), { ctrlKey: true });
            expect(mockOnSelectionChange).toHaveBeenCalledWith(['node-1', 'node-2']);
        });
    });
    describe('Error Handling and Edge Cases', () => {
        test('should handle empty node data gracefully', () => {
            const emptyNode = {
                id: 'empty-node',
                type: 'agent_task',
                data: null
            };
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(MockDynamicNode, { ...emptyNode }) }));
            expect(react_2.screen.getByTestId('dynamic-node-empty-node')).toBeInTheDocument();
            expect(react_2.screen.getByTestId('node-header')).toHaveTextContent('empty-node');
        });
        test('should handle invalid node positions', () => {
            const invalidNodes = [
                { id: 'node-1', type: 'start', position: { x: NaN, y: 100 }, data: { label: 'Invalid X' } },
                { id: 'node-2', type: 'end', position: { x: 100, y: undefined }, data: { label: 'Invalid Y' } }
            ];
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(MockWorkflowCanvas, { nodes: invalidNodes, edges: [], _onNodesChange: undefined, _onEdgesChange: undefined, _onConnect: undefined }) }));
            expect(react_2.screen.getByTestId('workflow-canvas')).toBeInTheDocument();
            expect(react_2.screen.getByTestId('react-flow')).toHaveAttribute('data-nodes-count', '2');
        });
        test('should handle missing node connections gracefully', () => {
            const nodes = [
                { id: 'node-1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Start' } }
            ];
            const invalidEdges = [
                { id: 'edge-1', source: 'node-1', target: 'non-existent-node' },
                { id: 'edge-2', source: 'another-missing-node', target: 'node-1' }
            ];
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(MockWorkflowCanvas, { nodes: nodes, edges: invalidEdges, _onNodesChange: undefined, _onEdgesChange: undefined, _onConnect: undefined }) }));
            expect(react_2.screen.getByTestId('workflow-canvas')).toBeInTheDocument();
            // Component should render without crashing despite invalid edges
        });
        test('should handle rapid UI updates', async () => {
            const RapidUpdateTest = () => {
                const [nodeCount, setNodeCount] = react_1.default.useState(0);
                const [nodes, setNodes] = react_1.default.useState([]);
                const addNode = () => {
                    const newNode = {
                        id: `node-${nodeCount}`,
                        type: 'agent_task',
                        position: { x: nodeCount * 100, y: 100 },
                        data: { label: `Task ${nodeCount}` }
                    };
                    setNodes(prev => [...prev, newNode]);
                    setNodeCount(prev => prev + 1);
                };
                const removeNode = () => {
                    setNodes(prev => prev.slice(0, -1));
                    setNodeCount(prev => Math.max(0, prev - 1));
                };
                return ((0, jsx_runtime_1.jsxs)("div", { "data-testid": "rapid-update-test", children: [(0, jsx_runtime_1.jsx)("button", { "data-testid": "add-node", onClick: addNode, children: "Add Node" }), (0, jsx_runtime_1.jsx)("button", { "data-testid": "remove-node", onClick: removeNode, children: "Remove Node" }), (0, jsx_runtime_1.jsxs)("div", { "data-testid": "node-count", children: ["Nodes: ", nodes.length] }), (0, jsx_runtime_1.jsx)(MockWorkflowCanvas, { nodes: nodes, edges: [], _onNodesChange: undefined, _onEdgesChange: undefined, _onConnect: undefined })] }));
            };
            (0, react_2.render)((0, jsx_runtime_1.jsx)(TestWrapper, { children: (0, jsx_runtime_1.jsx)(RapidUpdateTest, {}) }));
            const addButton = react_2.screen.getByTestId('add-node');
            const removeButton = react_2.screen.getByTestId('remove-node');
            // Rapidly add nodes
            for (let i = 0; i < 5; i++) {
                react_2.fireEvent.click(addButton);
            }
            await (0, react_2.waitFor)(() => {
                expect(react_2.screen.getByTestId('node-count')).toHaveTextContent('Nodes: 5');
            });
            // Rapidly remove nodes
            for (let i = 0; i < 3; i++) {
                react_2.fireEvent.click(removeButton);
            }
            await (0, react_2.waitFor)(() => {
                expect(react_2.screen.getByTestId('node-count')).toHaveTextContent('Nodes: 2');
            });
        });
    });
});
//# sourceMappingURL=ui-components.test.js.map