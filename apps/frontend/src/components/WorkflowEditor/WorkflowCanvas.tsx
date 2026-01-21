import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Background, Controls, MiniMap, Panel, ReactFlow } from 'reactflow';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useRealTimeCollaboration } from '../../hooks/useRealTimeCollaboration';
import { useWorkflowHistory } from '../../hooks/useWorkflowHistory';
import { useWorkflowValidation } from '../../hooks/useWorkflowValidation';
import type { WorkflowState } from '../../types/workflow';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { ExecutionOverlay } from './ExecutionOverlay';
import { NodeInspector } from './NodeInspector';
import { NodeLibrary } from './NodeLibrary';
import { WorkflowAnalytics } from './WorkflowAnalytics';
import { WorkflowToolbar } from './WorkflowToolbar';
import { CUSTOM_EDGE_TYPES } from './edges';
import { CUSTOM_NODE_TYPES } from './nodes';

export const WorkflowCanvas: React.FC = () => {
  const dispatch = useDispatch();
  const { nodes, edges, selectedNodes } = useSelector((state: WorkflowState) => state.workflow);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Initialize hooks
  const { undo, redo, canUndo, canRedo } = useWorkflowHistory();
  const { saveWorkflow, lastSaved } = useAutoSave();

  // Use the updated validation hook
  const { validationErrors, errors } = useWorkflowValidation({
    nodes,
    edges,
    onValidate: (isValid) => {
      // Optional: handle validation state change
    },
  });

  const { collaborators, onUserAction } = useRealTimeCollaboration();

  // Inject error data into nodes
  const nodesWithErrors = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        error: errors[node.id], // Inject the error message if it exists
      },
    }));
  }, [nodes, errors]);

  // Node and edge event handlers
  const onNodesChange = useCallback(
    (changes) => {
      dispatch({ type: 'UPDATE_NODES', payload: changes });
      onUserAction('node_change', changes);
    },
    [dispatch, onUserAction]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      dispatch({ type: 'UPDATE_EDGES', payload: changes });
      onUserAction('edge_change', changes);
    },
    [dispatch, onUserAction]
  );

  const onConnect = useCallback(
    (connection) => {
      dispatch({ type: 'ADD_EDGE', payload: connection });
      onUserAction('connect', connection);
    },
    [dispatch, onUserAction]
  );

  return (
    <ErrorBoundary>
      <div className="workflow-canvas h-full w-full relative">
        <WorkflowToolbar
          onSave={saveWorkflow}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          lastSaved={lastSaved}
          validationErrors={validationErrors}
        />

        <div className="flex h-full">
          <NodeLibrary
            isPanelOpen={isPanelOpen}
            onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
          />

          <div className="flex-grow relative">
            <ReactFlow
              nodes={nodesWithErrors}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={CUSTOM_NODE_TYPES}
              edgeTypes={CUSTOM_EDGE_TYPES}
              proOptions={{
                hideAttribution: true,
                account: 'pro',
              }}
              fitView
              selectNodesOnDrag={false}
              snapToGrid={true}
              snapGrid={[15, 15]}
            >
              <ExecutionOverlay />
              <Controls showInteractive={true} />
              <Background variant="dots" gap={12} size={1} />
              <MiniMap
                nodeStrokeColor={(n) => {
                  if (n.type === 'input') return '#0041d0';
                  if (n.type === 'output') return '#ff0072';
                  return '#eee';
                }}
                nodeColor={(n) => {
                  if (n.type === 'input') return '#0041d0';
                  if (n.type === 'output') return '#ff0072';
                  return '#fff';
                }}
              />

              <Panel position="top-right">
                <WorkflowAnalytics nodes={nodes} edges={edges} />
              </Panel>

              {collaborators.map((user) => (
                <div
                  key={user.id}
                  className="collaborator-cursor"
                  style={{
                    left: user.position.x,
                    top: user.position.y,
                    backgroundColor: user.color,
                  }}
                >
                  {user.name}
                </div>
              ))}
            </ReactFlow>
          </div>

          {selectedNodes.length > 0 && (
            <NodeInspector node={selectedNodes[0]} onUpdate={onNodesChange} />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};
