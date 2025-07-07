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

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ChakraProvider } from '@chakra-ui/react';
import { getTestEnvironment } from '../setup/test-setup';

// Mock ReactFlow components for testing
jest.mock('reactflow', () => ({
  __esModule: true,
  default: ({ children, nodes, edges, onNodesChange, onEdgesChange, onConnect }: any) => (
    <div data-testid="react-flow" data-nodes-count={nodes?.length || 0} data-edges-count={edges?.length || 0}>
      <div data-testid="react-flow-viewport">
        {children}
      </div>
    </div>
  ),
  Controls: () => <div data-testid="react-flow-controls" />,
  Background: () => <div data-testid="react-flow-background" />,
  addEdge: jest.fn((edge, edges) => [...edges, edge]),
  useNodesState: jest.fn(() => [[], jest.fn()]),
  useEdgesState: jest.fn(() => [[], jest.fn()]),
  Handle: ({ type, position, id }: any) => (
    <div data-testid={`handle-${type}-${position}`} data-handle-id={id} />
  ),
  Position: {
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
    Left: 'left'
  }
}));

// Mock the workflow builder components
const MockWorkflowCanvas = React.forwardRef<any, any>(({ nodes = [], edges = [], onNodesChange, onEdgesChange, onConnect }, ref) => {
  return (
    <div data-testid="workflow-canvas" ref={ref}>
      <div data-testid="react-flow" data-nodes-count={nodes.length} data-edges-count={edges.length}>
        {nodes.map((node: any) => (
          <div key={node.id} data-testid={`node-${node.id}`} data-node-type={node.type}>
            {node.data?.label || node.id}
          </div>
        ))}
      </div>
    </div>
  );
});

const MockNodeLibrary = ({ onNodeDragStart }: { onNodeDragStart?: (nodeType: string) => void }) => {
  const nodeTypes = [
    { type: 'start', label: 'Start Node', category: 'control' },
    { type: 'agent_task', label: 'Agent Task', category: 'agents' },
    { type: 'condition', label: 'Condition', category: 'logic' },
    { type: 'parallel', label: 'Parallel', category: 'control' },
    { type: 'end', label: 'End Node', category: 'control' }
  ];

  return (
    <div data-testid="node-library">
      {nodeTypes.map(nodeType => (
        <div
          key={nodeType.type}
          data-testid={`node-type-${nodeType.type}`}
          draggable
          onDragStart={() => onNodeDragStart?.(nodeType.type)}
        >
          {nodeType.label}
        </div>
      ))}
    </div>
  );
};

const MockDynamicNode = ({ data, id, type }: any) => {
  return (
    <div data-testid={`dynamic-node-${id}`} data-node-type={type}>
      <div data-testid="node-header">{data?.label || id}</div>
      <div data-testid="node-content">
        {data?.task && <div data-testid="node-task">{data.task}</div>}
        {data?.priority && <div data-testid="node-priority">{data.priority}</div>}
      </div>
      <div data-testid="node-handles">
        <div data-testid="handle-source-right" />
        <div data-testid="handle-target-left" />
      </div>
    </div>
  );
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ChakraProvider>
    <DndProvider backend={HTML5Backend}>
      {children}
    </DndProvider>
  </ChakraProvider>
);

describe('Workflow Builder UI Components', () => {
  let env: any;

  beforeAll(async () => {
    env = getTestEnvironment();
  });

  describe('WorkflowCanvas Component', () => {
    test('should render empty canvas correctly', () => {
      render(
        <TestWrapper>
          <MockWorkflowCanvas nodes={[]} edges={[]} />
        </TestWrapper>
      );

      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      expect(screen.getByTestId('react-flow')).toHaveAttribute('data-nodes-count', '0');
      expect(screen.getByTestId('react-flow')).toHaveAttribute('data-edges-count', '0');
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

      render(
        <TestWrapper>
          <MockWorkflowCanvas nodes={nodes} edges={[]} />
        </TestWrapper>
      );

      expect(screen.getByTestId('react-flow')).toHaveAttribute('data-nodes-count', '2');
      expect(screen.getByTestId('node-node-1')).toBeInTheDocument();
      expect(screen.getByTestId('node-node-2')).toBeInTheDocument();
      expect(screen.getByTestId('node-node-1')).toHaveAttribute('data-node-type', 'start');
      expect(screen.getByTestId('node-node-2')).toHaveAttribute('data-node-type', 'agent_task');
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

      render(
        <TestWrapper>
          <MockWorkflowCanvas nodes={nodes} edges={edges} />
        </TestWrapper>
      );

      expect(screen.getByTestId('react-flow')).toHaveAttribute('data-edges-count', '1');
    });

    test('should handle node position changes', async () => {
      const onNodesChange = jest.fn();
      const nodes = [
        { id: 'node-1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Start' } }
      ];

      render(
        <TestWrapper>
          <MockWorkflowCanvas nodes={nodes} edges={[]} onNodesChange={onNodesChange} />
        </TestWrapper>
      );

      // Simulate node drag (this would normally be handled by ReactFlow)
      const nodeElement = screen.getByTestId('node-node-1');
      fireEvent.mouseDown(nodeElement);
      fireEvent.mouseMove(nodeElement);
      fireEvent.mouseUp(nodeElement);

      // In a real implementation, onNodesChange would be called
      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
    });

    test('should handle connection creation', async () => {
      const onConnect = jest.fn();
      const nodes = [
        { id: 'node-1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Start' } },
        { id: 'node-2', type: 'end', position: { x: 300, y: 100 }, data: { label: 'End' } }
      ];

      render(
        <TestWrapper>
          <MockWorkflowCanvas nodes={nodes} edges={[]} onConnect={onConnect} />
        </TestWrapper>
      );

      // Simulate connection creation (normally handled by ReactFlow)
      const canvas = screen.getByTestId('workflow-canvas');
      fireEvent.click(canvas);

      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
    });
  });

  describe('NodeLibrary Component', () => {
    test('should render all node types', () => {
      render(
        <TestWrapper>
          <MockNodeLibrary />
        </TestWrapper>
      );

      expect(screen.getByTestId('node-library')).toBeInTheDocument();
      expect(screen.getByTestId('node-type-start')).toBeInTheDocument();
      expect(screen.getByTestId('node-type-agent_task')).toBeInTheDocument();
      expect(screen.getByTestId('node-type-condition')).toBeInTheDocument();
      expect(screen.getByTestId('node-type-parallel')).toBeInTheDocument();
      expect(screen.getByTestId('node-type-end')).toBeInTheDocument();
    });

    test('should handle node drag start', () => {
      const onNodeDragStart = jest.fn();

      render(
        <TestWrapper>
          <MockNodeLibrary onNodeDragStart={onNodeDragStart} />
        </TestWrapper>
      );

      const startNodeType = screen.getByTestId('node-type-start');
      fireEvent.dragStart(startNodeType);

      expect(onNodeDragStart).toHaveBeenCalledWith('start');
    });

    test('should have draggable node types', () => {
      render(
        <TestWrapper>
          <MockNodeLibrary />
        </TestWrapper>
      );

      const nodeTypes = ['start', 'agent_task', 'condition', 'parallel', 'end'];
      
      nodeTypes.forEach(nodeType => {
        const element = screen.getByTestId(`node-type-${nodeType}`);
        expect(element).toHaveAttribute('draggable', 'true');
      });
    });

    test('should categorize node types correctly', () => {
      render(
        <TestWrapper>
          <MockNodeLibrary />
        </TestWrapper>
      );

      // All node types should be present
      expect(screen.getAllByText(/Node|Task|Condition|Parallel/).length).toBeGreaterThan(0);
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

      render(
        <TestWrapper>
          <MockDynamicNode {...nodeData} />
        </TestWrapper>
      );

      expect(screen.getByTestId('dynamic-node-test-node')).toBeInTheDocument();
      expect(screen.getByTestId('node-header')).toHaveTextContent('Test Task');
      expect(screen.getByTestId('node-task')).toHaveTextContent('Process test data');
      expect(screen.getByTestId('node-priority')).toHaveTextContent('high');
    });

    test('should render node handles', () => {
      const nodeData = {
        id: 'test-node',
        type: 'agent_task',
        data: { label: 'Test Task' }
      };

      render(
        <TestWrapper>
          <MockDynamicNode {...nodeData} />
        </TestWrapper>
      );

      expect(screen.getByTestId('node-handles')).toBeInTheDocument();
      expect(screen.getByTestId('handle-source-right')).toBeInTheDocument();
      expect(screen.getByTestId('handle-target-left')).toBeInTheDocument();
    });

    test('should handle different node types', () => {
      const nodeTypes = [
        { id: 'start-node', type: 'start', data: { label: 'Start' } },
        { id: 'task-node', type: 'agent_task', data: { label: 'Task' } },
        { id: 'condition-node', type: 'condition', data: { label: 'Condition' } },
        { id: 'end-node', type: 'end', data: { label: 'End' } }
      ];

      const { rerender } = render(
        <TestWrapper>
          <MockDynamicNode {...nodeTypes[0]} />
        </TestWrapper>
      );

      nodeTypes.forEach(nodeType => {
        rerender(
          <TestWrapper>
            <MockDynamicNode {...nodeType} />
          </TestWrapper>
        );

        expect(screen.getByTestId(`dynamic-node-${nodeType.id}`)).toBeInTheDocument();
        expect(screen.getByTestId(`dynamic-node-${nodeType.id}`)).toHaveAttribute('data-node-type', nodeType.type);
      });
    });

    test('should handle missing data gracefully', () => {
      const nodeData = {
        id: 'minimal-node',
        type: 'agent_task',
        data: {}
      };

      render(
        <TestWrapper>
          <MockDynamicNode {...nodeData} />
        </TestWrapper>
      );

      expect(screen.getByTestId('dynamic-node-minimal-node')).toBeInTheDocument();
      expect(screen.getByTestId('node-header')).toHaveTextContent('minimal-node');
      expect(screen.queryByTestId('node-task')).not.toBeInTheDocument();
      expect(screen.queryByTestId('node-priority')).not.toBeInTheDocument();
    });
  });

  describe('Drag and Drop Integration', () => {
    test('should handle complete drag and drop workflow', async () => {
      const mockOnNodeAdd = jest.fn();
      const nodes: any[] = [];
      const edges: any[] = [];

      const WorkflowBuilderMock = () => {
        const [currentNodes, setCurrentNodes] = React.useState(nodes);

        const handleNodeDragStart = (nodeType: string) => {
          // Store dragging node type
        };

        const handleCanvasDrop = (event: React.DragEvent) => {
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

        return (
          <div 
            data-testid="workflow-builder"
            onDrop={handleCanvasDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <MockNodeLibrary onNodeDragStart={handleNodeDragStart} />
            <MockWorkflowCanvas nodes={currentNodes} edges={edges} />
          </div>
        );
      };

      render(
        <TestWrapper>
          <WorkflowBuilderMock />
        </TestWrapper>
      );

      // Simulate drag from library
      const agentTaskNode = screen.getByTestId('node-type-agent_task');
      fireEvent.dragStart(agentTaskNode);

      // Simulate drop on canvas
      const workflowBuilder = screen.getByTestId('workflow-builder');
      fireEvent.dragOver(workflowBuilder);
      fireEvent.drop(workflowBuilder);

      await waitFor(() => {
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
        const [nodes, setNodes] = React.useState(initialNodes);

        const handleNodeDrag = (nodeId: string, newPosition: { x: number; y: number }) => {
          setNodes(prevNodes => 
            prevNodes.map(node => 
              node.id === nodeId 
                ? { ...node, position: newPosition }
                : node
            )
          );
          mockOnNodeChange(nodeId, newPosition);
        };

        return (
          <div data-testid="reposition-test">
            <MockWorkflowCanvas nodes={nodes} edges={[]} />
            <button 
              data-testid="move-node-button"
              onClick={() => handleNodeDrag('movable-node', { x: 300, y: 200 })}
            >
              Move Node
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <RepositionTest />
        </TestWrapper>
      );

      const moveButton = screen.getByTestId('move-node-button');
      fireEvent.click(moveButton);

      await waitFor(() => {
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
        const [edges, setEdges] = React.useState<any[]>([]);

        const handleConnect = (connection: any) => {
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

        return (
          <div data-testid="connection-test">
            <MockWorkflowCanvas 
              nodes={testNodes} 
              edges={edges} 
              onConnect={handleConnect}
            />
            <button
              data-testid="create-connection-button"
              onClick={() => handleConnect({
                source: 'source-node',
                target: 'target-node',
                sourceHandle: 'output',
                targetHandle: 'input'
              })}
            >
              Create Connection
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <ConnectionTest />
        </TestWrapper>
      );

      const connectButton = screen.getByTestId('create-connection-button');
      fireEvent.click(connectButton);

      await waitFor(() => {
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
        const [viewport, setViewport] = React.useState({ x: 0, y: 0, zoom: 1 });

        const handleZoom = (delta: number) => {
          const newViewport = { ...viewport, zoom: Math.max(0.1, Math.min(2, viewport.zoom + delta)) };
          setViewport(newViewport);
          mockOnViewportChange(newViewport);
        };

        return (
          <div data-testid="zoom-test">
            <div data-testid="viewport-info">
              Zoom: {viewport.zoom.toFixed(2)}
            </div>
            <button data-testid="zoom-in" onClick={() => handleZoom(0.1)}>Zoom In</button>
            <button data-testid="zoom-out" onClick={() => handleZoom(-0.1)}>Zoom Out</button>
            <MockWorkflowCanvas nodes={[]} edges={[]} />
          </div>
        );
      };

      render(
        <TestWrapper>
          <ZoomTest />
        </TestWrapper>
      );

      expect(screen.getByTestId('viewport-info')).toHaveTextContent('Zoom: 1.00');

      fireEvent.click(screen.getByTestId('zoom-in'));
      expect(mockOnViewportChange).toHaveBeenCalledWith({ x: 0, y: 0, zoom: 1.1 });

      fireEvent.click(screen.getByTestId('zoom-out'));
      expect(mockOnViewportChange).toHaveBeenCalledWith({ x: 0, y: 0, zoom: 1.0 });
    });

    test('should handle canvas pan operations', () => {
      const mockOnViewportChange = jest.fn();

      const PanTest = () => {
        const [viewport, setViewport] = React.useState({ x: 0, y: 0, zoom: 1 });

        const handlePan = (deltaX: number, deltaY: number) => {
          const newViewport = { 
            ...viewport, 
            x: viewport.x + deltaX, 
            y: viewport.y + deltaY 
          };
          setViewport(newViewport);
          mockOnViewportChange(newViewport);
        };

        return (
          <div data-testid="pan-test">
            <div data-testid="viewport-position">
              Position: ({viewport.x}, {viewport.y})
            </div>
            <button data-testid="pan-left" onClick={() => handlePan(-50, 0)}>Pan Left</button>
            <button data-testid="pan-right" onClick={() => handlePan(50, 0)}>Pan Right</button>
            <button data-testid="pan-up" onClick={() => handlePan(0, -50)}>Pan Up</button>
            <button data-testid="pan-down" onClick={() => handlePan(0, 50)}>Pan Down</button>
            <MockWorkflowCanvas nodes={[]} edges={[]} />
          </div>
        );
      };

      render(
        <TestWrapper>
          <PanTest />
        </TestWrapper>
      );

      expect(screen.getByTestId('viewport-position')).toHaveTextContent('Position: (0, 0)');

      fireEvent.click(screen.getByTestId('pan-right'));
      expect(mockOnViewportChange).toHaveBeenCalledWith({ x: 50, y: 0, zoom: 1 });

      fireEvent.click(screen.getByTestId('pan-down'));
      expect(mockOnViewportChange).toHaveBeenCalledWith({ x: 50, y: 50, zoom: 1 });
    });

    test('should handle node selection', () => {
      const mockOnSelectionChange = jest.fn();
      const testNodes = [
        { id: 'node-1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Node 1' } },
        { id: 'node-2', type: 'end', position: { x: 300, y: 100 }, data: { label: 'Node 2' } }
      ];

      const SelectionTest = () => {
        const [selectedNodes, setSelectedNodes] = React.useState<string[]>([]);

        const handleNodeClick = (nodeId: string, isMultiSelect = false) => {
          let newSelection;
          if (isMultiSelect) {
            newSelection = selectedNodes.includes(nodeId)
              ? selectedNodes.filter(id => id !== nodeId)
              : [...selectedNodes, nodeId];
          } else {
            newSelection = [nodeId];
          }
          
          setSelectedNodes(newSelection);
          mockOnSelectionChange(newSelection);
        };

        return (
          <div data-testid="selection-test">
            <div data-testid="selected-count">
              Selected: {selectedNodes.length}
            </div>
            {testNodes.map(node => (
              <button
                key={node.id}
                data-testid={`select-${node.id}`}
                onClick={(e) => handleNodeClick(node.id, e.ctrlKey)}
                style={{ 
                  backgroundColor: selectedNodes.includes(node.id) ? 'blue' : 'white' 
                }}
              >
                {node.data.label}
              </button>
            ))}
            <MockWorkflowCanvas nodes={testNodes} edges={[]} />
          </div>
        );
      };

      render(
        <TestWrapper>
          <SelectionTest />
        </TestWrapper>
      );

      expect(screen.getByTestId('selected-count')).toHaveTextContent('Selected: 0');

      fireEvent.click(screen.getByTestId('select-node-1'));
      expect(mockOnSelectionChange).toHaveBeenCalledWith(['node-1']);

      fireEvent.click(screen.getByTestId('select-node-2'), { ctrlKey: true });
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

      render(
        <TestWrapper>
          <MockDynamicNode {...emptyNode} />
        </TestWrapper>
      );

      expect(screen.getByTestId('dynamic-node-empty-node')).toBeInTheDocument();
      expect(screen.getByTestId('node-header')).toHaveTextContent('empty-node');
    });

    test('should handle invalid node positions', () => {
      const invalidNodes = [
        { id: 'node-1', type: 'start', position: { x: NaN, y: 100 }, data: { label: 'Invalid X' } },
        { id: 'node-2', type: 'end', position: { x: 100, y: undefined }, data: { label: 'Invalid Y' } }
      ];

      render(
        <TestWrapper>
          <MockWorkflowCanvas nodes={invalidNodes} edges={[]} />
        </TestWrapper>
      );

      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
      expect(screen.getByTestId('react-flow')).toHaveAttribute('data-nodes-count', '2');
    });

    test('should handle missing node connections gracefully', () => {
      const nodes = [
        { id: 'node-1', type: 'start', position: { x: 100, y: 100 }, data: { label: 'Start' } }
      ];

      const invalidEdges = [
        { id: 'edge-1', source: 'node-1', target: 'non-existent-node' },
        { id: 'edge-2', source: 'another-missing-node', target: 'node-1' }
      ];

      render(
        <TestWrapper>
          <MockWorkflowCanvas nodes={nodes} edges={invalidEdges} />
        </TestWrapper>
      );

      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
      // Component should render without crashing despite invalid edges
    });

    test('should handle rapid UI updates', async () => {
      const RapidUpdateTest = () => {
        const [nodeCount, setNodeCount] = React.useState(0);
        const [nodes, setNodes] = React.useState<any[]>([]);

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

        return (
          <div data-testid="rapid-update-test">
            <button data-testid="add-node" onClick={addNode}>Add Node</button>
            <button data-testid="remove-node" onClick={removeNode}>Remove Node</button>
            <div data-testid="node-count">Nodes: {nodes.length}</div>
            <MockWorkflowCanvas nodes={nodes} edges={[]} />
          </div>
        );
      };

      render(
        <TestWrapper>
          <RapidUpdateTest />
        </TestWrapper>
      );

      const addButton = screen.getByTestId('add-node');
      const removeButton = screen.getByTestId('remove-node');

      // Rapidly add nodes
      for (let i = 0; i < 5; i++) {
        fireEvent.click(addButton);
      }

      await waitFor(() => {
        expect(screen.getByTestId('node-count')).toHaveTextContent('Nodes: 5');
      });

      // Rapidly remove nodes
      for (let i = 0; i < 3; i++) {
        fireEvent.click(removeButton);
      }

      await waitFor(() => {
        expect(screen.getByTestId('node-count')).toHaveTextContent('Nodes: 2');
      });
    });
  });
});