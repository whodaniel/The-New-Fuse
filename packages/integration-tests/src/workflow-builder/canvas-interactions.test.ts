/**
 * Canvas Interactions and Visual Feedback Tests
 * 
 * Tests advanced canvas interactions, visual feedback, and user experience features:
 * - Mouse and keyboard interactions
 * - Visual feedback during drag operations
 * - Connection visualization and validation
 * - Selection tools and multi-select
 * - Copy/paste and keyboard shortcuts
 * - Performance with large workflows
 */

import { getTestEnvironment } from '../setup/test-setup';
import { WorkflowBuilder } from '@the-new-fuse/workflow-engine/builder';
import { WorkflowNodeType } from '@the-new-fuse/workflow-engine/types';
import { performance } from 'perf_hooks';

// Mock canvas and DOM APIs for testing
global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(),
  putImageData: jest.fn(),
  createImageData: jest.fn(),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 100 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}));

// Mock getBoundingClientRect for canvas interactions
Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
  writable: true,
  value: jest.fn(() => ({
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    width: 800,
    height: 600,
    x: 0,
    y: 0,
  })),
});

describe('Canvas Interactions and Visual Feedback', () => {
  let env: any; // Used for test environment
  let builder: WorkflowBuilder;

  beforeAll(async () => {
    env = getTestEnvironment();
  });

  beforeEach(async () => {
    builder = new WorkflowBuilder();
    await builder.initialize();
  });

  afterEach(async () => {
    if (builder) {
      await builder.cleanup();
    }
  });

  describe('Mouse Interactions', () => {
    test('should handle single click node selection', async () => {
      const node1 = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const node2 = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });

      // Simulate mouse click on node1
      const clickEvent = {
        type: 'click',
        target: { nodeId: node1.id },
        clientX: 100,
        clientY: 100,
        button: 0,
        ctrlKey: false,
        shiftKey: false
      };

      builder.handleCanvasClick(clickEvent);
      
      const selectedNodes = builder.getSelectedNodes();
      expect(selectedNodes).toEqual([node1.id]);
      expect(selectedNodes).not.toContain(node2.id);
    });

    test('should handle ctrl+click for multi-selection', async () => {
      const node1 = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const node2 = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task', { x: 200, y: 100 });
      const node3 = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });

      // Select first node
      builder.handleCanvasClick({
        type: 'click',
        target: { nodeId: node1.id },
        clientX: 100,
        clientY: 100,
        button: 0,
        ctrlKey: false
      });

      // Ctrl+click second node to add to selection
      builder.handleCanvasClick({
        type: 'click',
        target: { nodeId: node2.id },
        clientX: 200,
        clientY: 100,
        button: 0,
        ctrlKey: true
      });

      const selectedNodes = builder.getSelectedNodes();
      expect(selectedNodes).toContain(node1.id);
      expect(selectedNodes).toContain(node2.id);
      expect(selectedNodes).not.toContain(node3.id);
      expect(selectedNodes).toHaveLength(2);
    });

    test('should handle shift+click for range selection', async () => {
      // Create a row of nodes
      const nodes = [];
      for (let i = 0; i < 5; i++) {
        const node = builder.addNode(
          WorkflowNodeType.AGENT_TASK, 
          `Task ${i}`, 
          { x: i * 100 + 100, y: 100 }
        );
        nodes.push(node);
      }

      // Select first node
      builder.handleCanvasClick({
        type: 'click',
        target: { nodeId: nodes[0].id },
        clientX: 100,
        clientY: 100,
        button: 0,
        ctrlKey: false
      });

      // Shift+click third node to select range
      builder.handleCanvasClick({
        type: 'click',
        target: { nodeId: nodes[2].id },
        clientX: 300,
        clientY: 100,
        button: 0,
        shiftKey: true
      });

      const selectedNodes = builder.getSelectedNodes();
      expect(selectedNodes).toContain(nodes[0].id);
      expect(selectedNodes).toContain(nodes[1].id);
      expect(selectedNodes).toContain(nodes[2].id);
      expect(selectedNodes).toHaveLength(3);
    });

    test('should handle double-click for node editing', async () => {
      const node = builder.addNode(
        WorkflowNodeType.AGENT_TASK, 
        'Editable Task', 
        { x: 100, y: 100 },
        { task: 'Original task', priority: 'medium' }
      );

      const editSpy = jest.fn();
      builder.onNodeEdit = editSpy;

      // Simulate double-click
      builder.handleCanvasDoubleClick({
        type: 'dblclick',
        target: { nodeId: node.id },
        clientX: 100,
        clientY: 100
      });

      expect(editSpy).toHaveBeenCalledWith(node.id);
    });

    test('should handle right-click for context menu', async () => {
      const node = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });

      const contextMenuSpy = jest.fn();
      builder.onContextMenu = contextMenuSpy;

      // Simulate right-click
      builder.handleCanvasRightClick({
        type: 'contextmenu',
        target: { nodeId: node.id },
        clientX: 100,
        clientY: 100,
        button: 2
      });

      expect(contextMenuSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          nodeId: node.id,
          position: { x: 100, y: 100 }
        })
      );
    });

    test('should handle mouse wheel for zooming', async () => {
      const initialViewport = builder.getViewport();
      expect(initialViewport.zoom).toBe(1);

      // Simulate mouse wheel zoom in
      builder.handleCanvasWheel({
        type: 'wheel',
        deltaY: -100, // Negative for zoom in
        clientX: 400,
        clientY: 300,
        ctrlKey: false
      });

      const zoomedViewport = builder.getViewport();
      expect(zoomedViewport.zoom).toBeGreaterThan(1);

      // Simulate mouse wheel zoom out
      builder.handleCanvasWheel({
        type: 'wheel',
        deltaY: 200, // Positive for zoom out
        clientX: 400,
        clientY: 300,
        ctrlKey: false
      });

      const zoomedOutViewport = builder.getViewport();
      expect(zoomedOutViewport.zoom).toBeLessThan(zoomedViewport.zoom);
    });
  });

  describe('Drag and Drop Visual Feedback', () => {
    test('should provide visual feedback during node drag', async () => {
      const node = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });

      // Start drag
      const dragStartEvent = {
        type: 'dragstart',
        target: { nodeId: node.id },
        clientX: 100,
        clientY: 100,
        dataTransfer: {
          setData: jest.fn(),
          effectAllowed: 'move'
        }
      };

      builder.handleDragStart(dragStartEvent);
      
      const dragState = builder.getDragState();
      expect(dragState.isDragging).toBe(true);
      expect(dragState.draggedNode).toBe(node.id);
      expect(dragState.dragStartPosition).toEqual({ x: 100, y: 100 });
    });

    test('should show drop zones during library node drag', async () => {
      // Simulate dragging from node library
      const libraryDragEvent = {
        type: 'dragstart',
        target: { nodeType: 'agent_task' },
        dataTransfer: {
          setData: jest.fn(),
          effectAllowed: 'copy'
        }
      };

      builder.handleLibraryDragStart(libraryDragEvent);

      const dragState = builder.getDragState();
      expect(dragState.isDragging).toBe(true);
      expect(dragState.draggedNodeType).toBe('agent_task');

      // Check drop zones are visible
      const dropZones = builder.getDropZones();
      expect(dropZones.canvasDropZone.visible).toBe(true);
      expect(dropZones.canvasDropZone.accepts).toContain('agent_task');
    });

    test('should provide connection preview during handle drag', async () => {
      const sourceNode = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      void builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });

      // Start connection drag from source handle
      const connectionDragEvent = {
        type: 'dragstart',
        target: { 
          nodeId: sourceNode.id, 
          handleId: 'output',
          handleType: 'source' 
        },
        clientX: 150, // Right side of source node
        clientY: 100
      };

      builder.handleConnectionDragStart(connectionDragEvent);

      const connectionState = builder.getConnectionState();
      expect(connectionState.isConnecting).toBe(true);
      expect(connectionState.sourceNode).toBe(sourceNode.id);
      expect(connectionState.sourceHandle).toBe('output');
      expect(connectionState.previewPath).toBeDefined();
    });

    test('should highlight compatible targets during connection drag', async () => {
      const sourceNode = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const compatibleTarget = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task', { x: 300, y: 100 });
      const incompatibleTarget = builder.addNode(WorkflowNodeType.START, 'Another Start', { x: 300, y: 200 });

      // Start connection drag
      builder.handleConnectionDragStart({
        type: 'dragstart',
        target: { 
          nodeId: sourceNode.id, 
          handleId: 'output',
          handleType: 'source' 
        },
        clientX: 150,
        clientY: 100
      });

      // Check target highlighting
      const connectionState = builder.getConnectionState();
      expect(connectionState.compatibleTargets).toContain(compatibleTarget.id);
      expect(connectionState.incompatibleTargets).toContain(incompatibleTarget.id);

      // Compatible targets should be highlighted
      const compatibleHighlight = builder.getNodeHighlight(compatibleTarget.id);
      expect(compatibleHighlight.type).toBe('compatible-target');
      expect(compatibleHighlight.visible).toBe(true);

      // Incompatible targets should be dimmed
      const incompatibleHighlight = builder.getNodeHighlight(incompatibleTarget.id);
      expect(incompatibleHighlight.type).toBe('incompatible-target');
      expect(incompatibleHighlight.dimmed).toBe(true);
    });

    test('should show snap guides during node positioning', async () => {
      // Enable snap to grid
      builder.setGridSnap(true, { size: 20, showGuides: true });

      const node = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });

      // Simulate dragging near grid lines
      builder.handleNodeDragMove({
        nodeId: node.id,
        position: { x: 118, y: 97 }, // Near grid lines
        originalPosition: { x: 100, y: 100 }
      });

      const snapGuides = builder.getSnapGuides();
      expect(snapGuides.vertical.visible).toBe(true);
      expect(snapGuides.vertical.position).toBe(120); // Nearest grid line
      expect(snapGuides.horizontal.visible).toBe(true);
      expect(snapGuides.horizontal.position).toBe(100);
    });

    test('should show alignment guides with other nodes', async () => {
      const node1 = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const node2 = builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task', { x: 300, y: 100 });
      const draggingNode = builder.addNode(WorkflowNodeType.END, 'End', { x: 200, y: 200 });

      // Enable alignment guides
      builder.setAlignmentGuides(true, { threshold: 10 });

      // Drag node near alignment with existing nodes
      builder.handleNodeDragMove({
        nodeId: draggingNode.id,
        position: { x: 200, y: 105 }, // Near horizontal alignment
        originalPosition: { x: 200, y: 200 }
      });

      const alignmentGuides = builder.getAlignmentGuides();
      expect(alignmentGuides.horizontal.visible).toBe(true);
      expect(alignmentGuides.horizontal.position).toBe(100); // Aligned with other nodes
      expect(alignmentGuides.horizontal.alignedNodes).toEqual([node1.id, node2.id]);
    });
  });

  describe('Selection Tools', () => {
    test('should handle marquee selection', async () => {
      // Create multiple nodes in different positions
      const nodes = [
        builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 }),
        builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task 1', { x: 200, y: 150 }),
        builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task 2', { x: 300, y: 200 }),
        builder.addNode(WorkflowNodeType.END, 'End', { x: 400, y: 100 })
      ];

      // Start marquee selection
      builder.startMarqueeSelection({ x: 80, y: 80 });

      // Update marquee to cover first three nodes
      builder.updateMarqueeSelection({ x: 320, y: 220 });

      const marqueeState = builder.getMarqueeState();
      expect(marqueeState.isActive).toBe(true);
      expect(marqueeState.startPosition).toEqual({ x: 80, y: 80 });
      expect(marqueeState.currentPosition).toEqual({ x: 320, y: 220 });

      // End marquee selection
      builder.endMarqueeSelection();

      const selectedNodes = builder.getSelectedNodes();
      expect(selectedNodes).toContain(nodes[0].id); // Start node
      expect(selectedNodes).toContain(nodes[1].id); // Task 1
      expect(selectedNodes).toContain(nodes[2].id); // Task 2
      expect(selectedNodes).not.toContain(nodes[3].id); // End node (outside marquee)
    });

    test('should handle lasso selection', async () => {
      // Create nodes in circular pattern
      const centerX = 300;
      const centerY = 200;
      const radius = 80;
      const nodes = [];

      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * 2 * Math.PI;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const node = builder.addNode(
          WorkflowNodeType.AGENT_TASK, 
          `Task ${i}`, 
          { x, y }
        );
        nodes.push(node);
      }

      // Start lasso selection
      builder.startLassoSelection({ x: centerX + radius + 20, y: centerY });

      // Draw lasso path around half the nodes
      const lassoPath = [
        { x: centerX + radius + 20, y: centerY },
        { x: centerX, y: centerY - radius - 20 },
        { x: centerX - radius - 20, y: centerY },
        { x: centerX, y: centerY + radius + 20 },
        { x: centerX + radius + 20, y: centerY }
      ];

      builder.updateLassoSelection(lassoPath);
      builder.endLassoSelection();

      const selectedNodes = builder.getSelectedNodes();
      expect(selectedNodes.length).toBeGreaterThan(0);
      expect(selectedNodes.length).toBeLessThan(nodes.length);
    });

    test('should handle selection with modifier keys', async () => {
      const nodes = [
        builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 }),
        builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task', { x: 200, y: 100 }),
        builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 })
      ];

      // Select first node
      builder.selectNode(nodes[0].id);
      expect(builder.getSelectedNodes()).toEqual([nodes[0].id]);

      // Ctrl+select to add second node
      builder.selectNode(nodes[1].id, { addToSelection: true });
      expect(builder.getSelectedNodes()).toEqual([nodes[0].id, nodes[1].id]);

      // Ctrl+select selected node to remove it
      builder.selectNode(nodes[0].id, { addToSelection: true });
      expect(builder.getSelectedNodes()).toEqual([nodes[1].id]);

      // Shift+select to select range
      builder.selectNode(nodes[2].id, { extendSelection: true });
      expect(builder.getSelectedNodes()).toEqual([nodes[1].id, nodes[2].id]);
    });

    test('should invert selection', async () => {
      const nodes = [
        builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 }),
        builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task 1', { x: 200, y: 100 }),
        builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task 2', { x: 300, y: 100 }),
        builder.addNode(WorkflowNodeType.END, 'End', { x: 400, y: 100 })
      ];

      // Select first two nodes
      builder.selectNode(nodes[0].id);
      builder.selectNode(nodes[1].id, { addToSelection: true });

      expect(builder.getSelectedNodes()).toEqual([nodes[0].id, nodes[1].id]);

      // Invert selection
      builder.invertSelection();

      const selectedAfterInvert = builder.getSelectedNodes();
      expect(selectedAfterInvert).toContain(nodes[2].id);
      expect(selectedAfterInvert).toContain(nodes[3].id);
      expect(selectedAfterInvert).not.toContain(nodes[0].id);
      expect(selectedAfterInvert).not.toContain(nodes[1].id);
    });
  });

  describe('Keyboard Interactions', () => {
    test('should handle keyboard shortcuts for common operations', async () => {
      const node = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      builder.selectNode(node.id);

      // Test copy (Ctrl+C)
      const copyResult = builder.handleKeyboardShortcut({
        key: 'c',
        ctrlKey: true,
        preventDefault: jest.fn()
      });
      expect(copyResult.action).toBe('copy');
      expect(copyResult.success).toBe(true);

      // Test paste (Ctrl+V)
      const pasteResult = builder.handleKeyboardShortcut({
        key: 'v',
        ctrlKey: true,
        preventDefault: jest.fn()
      });
      expect(pasteResult.action).toBe('paste');
      expect(pasteResult.success).toBe(true);
      expect(builder.getNodes()).toHaveLength(2); // Original + pasted

      // Test undo (Ctrl+Z)
      const undoResult = builder.handleKeyboardShortcut({
        key: 'z',
        ctrlKey: true,
        preventDefault: jest.fn()
      });
      expect(undoResult.action).toBe('undo');
      expect(undoResult.success).toBe(true);

      // Test redo (Ctrl+Shift+Z)
      const redoResult = builder.handleKeyboardShortcut({
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        preventDefault: jest.fn()
      });
      expect(redoResult.action).toBe('redo');
      expect(redoResult.success).toBe(true);
    });

    test('should handle delete key for removing selected items', async () => {
      const node1 = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const node2 = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });
      const connection = builder.addConnection(node1.id, 'output', node2.id, 'input');

      // Select node and connection
      builder.selectNode(node1.id);
      builder.selectConnection(connection.id, { addToSelection: true });

      // Press delete key
      const deleteResult = builder.handleKeyboardShortcut({
        key: 'Delete',
        preventDefault: jest.fn()
      });

      expect(deleteResult.action).toBe('delete');
      expect(deleteResult.success).toBe(true);
      expect(builder.getNodes()).toHaveLength(1); // Only node2 remains
      expect(builder.getConnections()).toHaveLength(0);
    });

    test('should handle arrow keys for node navigation', async () => {
      const nodes = [
        builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 }),
        builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task', { x: 200, y: 100 }),
        builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 })
      ];

      // Connect nodes
      builder.addConnection(nodes[0].id, 'output', nodes[1].id, 'input');
      builder.addConnection(nodes[1].id, 'output', nodes[2].id, 'input');

      // Select first node
      builder.selectNode(nodes[0].id);

      // Press right arrow to navigate to next connected node
      const rightArrowResult = builder.handleKeyboardShortcut({
        key: 'ArrowRight',
        preventDefault: jest.fn()
      });

      expect(rightArrowResult.action).toBe('navigate');
      expect(builder.getSelectedNodes()).toEqual([nodes[1].id]);

      // Press right arrow again
      builder.handleKeyboardShortcut({
        key: 'ArrowRight',
        preventDefault: jest.fn()
      });

      expect(builder.getSelectedNodes()).toEqual([nodes[2].id]);

      // Press left arrow to go back
      builder.handleKeyboardShortcut({
        key: 'ArrowLeft',
        preventDefault: jest.fn()
      });

      expect(builder.getSelectedNodes()).toEqual([nodes[1].id]);
    });

    test('should handle arrow keys with shift for extending selection', async () => {
      const nodes = [
        builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 }),
        builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task 1', { x: 200, y: 100 }),
        builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task 2', { x: 300, y: 100 }),
        builder.addNode(WorkflowNodeType.END, 'End', { x: 400, y: 100 })
      ];

      // Connect nodes in sequence
      for (let i = 0; i < nodes.length - 1; i++) {
        builder.addConnection(nodes[i].id, 'output', nodes[i + 1].id, 'input');
      }

      // Select first node
      builder.selectNode(nodes[0].id);

      // Shift+right arrow to extend selection
      builder.handleKeyboardShortcut({
        key: 'ArrowRight',
        shiftKey: true,
        preventDefault: jest.fn()
      });

      expect(builder.getSelectedNodes()).toEqual([nodes[0].id, nodes[1].id]);

      // Shift+right arrow again
      builder.handleKeyboardShortcut({
        key: 'ArrowRight',
        shiftKey: true,
        preventDefault: jest.fn()
      });

      expect(builder.getSelectedNodes()).toEqual([nodes[0].id, nodes[1].id, nodes[2].id]);
    });

    test('should handle escape key to clear selection', async () => {
      const nodes = [
        builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 }),
        builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 })
      ];

      // Select both nodes
      builder.selectNode(nodes[0].id);
      builder.selectNode(nodes[1].id, { addToSelection: true });

      expect(builder.getSelectedNodes()).toHaveLength(2);

      // Press escape to clear selection
      const escapeResult = builder.handleKeyboardShortcut({
        key: 'Escape',
        preventDefault: jest.fn()
      });

      expect(escapeResult.action).toBe('clear_selection');
      expect(builder.getSelectedNodes()).toHaveLength(0);
    });

    test('should handle spacebar for canvas panning mode', async () => {
      // Press spacebar to enter pan mode
      const spaceDownResult = builder.handleKeyDown({
        key: ' ',
        preventDefault: jest.fn()
      });

      expect(spaceDownResult.action).toBe('enter_pan_mode');
      expect(builder.getInteractionMode()).toBe('pan');

      // Release spacebar to exit pan mode
      const spaceUpResult = builder.handleKeyUp({
        key: ' ',
        preventDefault: jest.fn()
      });

      expect(spaceUpResult.action).toBe('exit_pan_mode');
      expect(builder.getInteractionMode()).toBe('default');
    });
  });

  describe('Performance with Visual Effects', () => {
    test('should maintain performance with many visual elements', async () => {
      const startTime = performance.now();

      // Create large workflow with visual effects
      const nodeCount = 100;
      const nodes = [];

      for (let i = 0; i < nodeCount; i++) {
        const node = builder.addNode(
          WorkflowNodeType.AGENT_TASK,
          `Task ${i}`,
          { x: (i % 10) * 100 + 50, y: Math.floor(i / 10) * 100 + 50 },
          { task: `Process data ${i}` }
        );
        nodes.push(node);

        // Add visual effects to some nodes
        if (i % 5 === 0) {
          builder.setNodeHighlight(node.id, {
            type: 'processing',
            animated: true,
            color: '#ffeb3b'
          });
        }
      }

      // Connect adjacent nodes
      for (let i = 0; i < nodes.length - 1; i++) {
        if (i % 10 !== 9) { // Don't connect across rows
          builder.addConnection(nodes[i].id, 'output', nodes[i + 1].id, 'input');
        }
      }

      // Enable all visual features
      builder.setConfiguration({
        enableAnimations: true,
        enableParticleEffects: true,
        enableNodeGlow: true,
        enableConnectionPulse: true
      });

      const endTime = performance.now();
      const setupTime = endTime - startTime;

      expect(setupTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(nodes).toHaveLength(nodeCount);

      // Test interaction performance
      const interactionStart = performance.now();

      // Simulate rapid selection changes
      for (let i = 0; i < 50; i++) {
        builder.selectNode(nodes[i].id);
        builder.clearSelection();
      }

      const interactionEnd = performance.now();
      const interactionTime = interactionEnd - interactionStart;

      expect(interactionTime).toBeLessThan(500); // Interactions should be fast
    });

    test('should handle smooth animation during node drag', async () => {
      const node = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });

      // Enable smooth animations
      builder.setConfiguration({
        enableSmoothDrag: true,
        dragAnimationDuration: 200
      });

      const dragStart = performance.now();

      // Start drag
      builder.handleDragStart({
        type: 'dragstart',
        target: { nodeId: node.id },
        clientX: 100,
        clientY: 100
      });

      // Simulate drag movement with multiple updates
      const positions = [
        { x: 110, y: 110 },
        { x: 130, y: 120 },
        { x: 160, y: 140 },
        { x: 200, y: 160 }
      ];

      for (const position of positions) {
        builder.handleDragMove({
          type: 'dragmove',
          clientX: position.x,
          clientY: position.y
        });
      }

      // End drag
      builder.handleDragEnd({
        type: 'dragend',
        clientX: 200,
        clientY: 160
      });

      const dragEnd = performance.now();
      const dragTime = dragEnd - dragStart;

      expect(dragTime).toBeLessThan(100); // Drag should be smooth and fast

      // Verify final position
      const updatedNode = builder.getNode(node.id);
      expect(updatedNode.position.x).toBeCloseTo(200, 5);
      expect(updatedNode.position.y).toBeCloseTo(160, 5);
    });

    test('should optimize rendering for large canvas areas', async () => {
      // Create nodes spread across large canvas area
      const canvasSize = 5000; // 5000x5000 canvas
      const nodeSpacing = 500;
      const nodes = [];

      for (let x = 0; x < canvasSize; x += nodeSpacing) {
        for (let y = 0; y < canvasSize; y += nodeSpacing) {
          const node = builder.addNode(
            WorkflowNodeType.AGENT_TASK,
            `Task ${x}-${y}`,
            { x, y }
          );
          nodes.push(node);
        }
      }

      expect(nodes.length).toBe(121); // 11x11 grid

      // Test viewport culling
      builder.setViewport({ x: -1000, y: -1000, zoom: 0.5 });

      const visibilityStart = performance.now();
      const visibleNodes = builder.getVisibleNodes();
      const visibilityEnd = performance.now();

      expect(visibilityEnd - visibilityStart).toBeLessThan(50); // Visibility calculation should be fast
      expect(visibleNodes.length).toBeLessThan(nodes.length); // Some nodes should be culled

      // Test zoom performance
      const zoomStart = performance.now();
      
      for (let i = 0; i < 10; i++) {
        builder.setViewport({ 
          x: -500, 
          y: -500, 
          zoom: 0.5 + (i * 0.1) 
        });
      }

      const zoomEnd = performance.now();
      expect(zoomEnd - zoomStart).toBeLessThan(100); // Zoom should be smooth
    });

    test('should handle efficient connection path calculation', async () => {
      const sourceNode = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const targetNode = builder.addNode(WorkflowNodeType.END, 'End', { x: 500, y: 300 });

      const pathStart = performance.now();

      // Calculate connection path with various styles
      const straightPath = builder.calculateConnectionPath(
        sourceNode.id, 'output',
        targetNode.id, 'input',
        { style: 'straight' }
      );

      const bezierPath = builder.calculateConnectionPath(
        sourceNode.id, 'output',
        targetNode.id, 'input',
        { style: 'bezier' }
      );

      const steppedPath = builder.calculateConnectionPath(
        sourceNode.id, 'output',
        targetNode.id, 'input',
        { style: 'stepped' }
      );

      const pathEnd = performance.now();
      const pathTime = pathEnd - pathStart;

      expect(pathTime).toBeLessThan(10); // Path calculation should be very fast

      expect(straightPath).toBeDefined();
      expect(bezierPath).toBeDefined();
      expect(steppedPath).toBeDefined();

      expect(straightPath.length).toBeGreaterThan(0);
      expect(bezierPath.length).toBeGreaterThan(straightPath.length); // Bezier has more points
      expect(steppedPath.length).toBeGreaterThan(straightPath.length);
    });
  });

  describe('Accessibility and User Experience', () => {
    test('should provide keyboard navigation for accessibility', async () => {
      const nodes = [
        builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 }),
        builder.addNode(WorkflowNodeType.AGENT_TASK, 'Task', { x: 200, y: 100 }),
        builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 })
      ];

      // Test tab navigation
      let focusedNode = builder.focusNextNode();
      expect(focusedNode).toBe(nodes[0].id);

      focusedNode = builder.focusNextNode();
      expect(focusedNode).toBe(nodes[1].id);

      focusedNode = builder.focusNextNode();
      expect(focusedNode).toBe(nodes[2].id);

      // Test shift+tab (previous)
      focusedNode = builder.focusPreviousNode();
      expect(focusedNode).toBe(nodes[1].id);

      // Test enter to select focused node
      const selectResult = builder.handleKeyboardShortcut({
        key: 'Enter',
        preventDefault: jest.fn()
      });

      expect(selectResult.action).toBe('select_focused');
      expect(builder.getSelectedNodes()).toEqual([nodes[1].id]);
    });

    test('should provide screen reader announcements', async () => {
      const announcements: string[] = [];
      builder.onAccessibilityAnnouncement = (message: string) => {
        announcements.push(message);
      };

      const node = builder.addNode(WorkflowNodeType.START, 'Start Node', { x: 100, y: 100 });

      // Should announce node creation
      expect(announcements).toContain('Node "Start Node" created at position 100, 100');

      // Select node
      builder.selectNode(node.id);
      expect(announcements).toContain('Node "Start Node" selected');

      // Create connection
      const targetNode = builder.addNode(WorkflowNodeType.END, 'End Node', { x: 300, y: 100 });
      void builder.addConnection(node.id, 'output', targetNode.id, 'input');

      expect(announcements).toContain('Connection created from "Start Node" to "End Node"');

      // Delete node
      builder.removeNode(node.id);
      expect(announcements).toContain('Node "Start Node" deleted');
    });

    test('should provide visual indicators for states', async () => {
      const node = builder.addNode(
        WorkflowNodeType.AGENT_TASK, 
        'Task Node', 
        { x: 100, y: 100 },
        { task: 'Process data' }
      );

      // Test various visual states
      builder.setNodeState(node.id, 'processing');
      let nodeState = builder.getNodeState(node.id);
      expect(nodeState.visual.indicator).toBe('processing');
      expect(nodeState.visual.animated).toBe(true);

      builder.setNodeState(node.id, 'completed');
      nodeState = builder.getNodeState(node.id);
      expect(nodeState.visual.indicator).toBe('completed');
      expect(nodeState.visual.color).toBe('#4caf50');

      builder.setNodeState(node.id, 'error');
      nodeState = builder.getNodeState(node.id);
      expect(nodeState.visual.indicator).toBe('error');
      expect(nodeState.visual.color).toBe('#f44336');

      builder.setNodeState(node.id, 'warning');
      nodeState = builder.getNodeState(node.id);
      expect(nodeState.visual.indicator).toBe('warning');
      expect(nodeState.visual.color).toBe('#ff9800');
    });

    test('should provide tooltips and contextual help', async () => {
      const node = builder.addNode(
        WorkflowNodeType.AGENT_TASK,
        'Complex Task',
        { x: 100, y: 100 },
        { 
          task: 'Process complex data with multiple parameters',
          priority: 'high',
          timeout: 300000
        }
      );

      // Get tooltip content
      const tooltip = builder.getNodeTooltip(node.id);
      expect(tooltip.title).toBe('Complex Task');
      expect(tooltip.content).toContain('Process complex data');
      expect(tooltip.metadata).toContain('Priority: high');
      expect(tooltip.metadata).toContain('Timeout: 5 minutes');

      // Test connection tooltip
      const targetNode = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });
      const connection = builder.addConnection(node.id, 'output', targetNode.id, 'input');

      const connectionTooltip = builder.getConnectionTooltip(connection.id);
      expect(connectionTooltip.content).toContain('Complex Task → End');
      expect(connectionTooltip.metadata).toContain('Handle: output → input');
    });

    test('should support high contrast mode', async () => {
      // Enable high contrast mode
      builder.setAccessibilityMode('high-contrast', true);

      const node = builder.addNode(WorkflowNodeType.START, 'Start', { x: 100, y: 100 });
      const targetNode = builder.addNode(WorkflowNodeType.END, 'End', { x: 300, y: 100 });
      const connection = builder.addConnection(node.id, 'output', targetNode.id, 'input');

      // Check high contrast styles are applied
      const nodeStyle = builder.getNodeStyle(node.id);
      expect(nodeStyle.highContrast).toBe(true);
      expect(nodeStyle.borderWidth).toBeGreaterThan(1);
      expect(nodeStyle.contrastRatio).toBeGreaterThanOrEqual(4.5);

      const connectionStyle = builder.getConnectionStyle(connection.id);
      expect(connectionStyle.highContrast).toBe(true);
      expect(connectionStyle.strokeWidth).toBeGreaterThan(2);

      // Test selection visibility in high contrast
      builder.selectNode(node.id);
      const selectedNodeStyle = builder.getNodeStyle(node.id);
      expect(selectedNodeStyle.selected).toBe(true);
      expect(selectedNodeStyle.selectionHighlight.contrastRatio).toBeGreaterThanOrEqual(7);
    });
  });
});