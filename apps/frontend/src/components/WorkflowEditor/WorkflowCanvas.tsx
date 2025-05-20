import React, { useCallback, useState, useEffect } from 'react';
import { ReactFlow, Controls, Background, MiniMap, Panel } from 'reactflow';
import { useSelector, useDispatch } from 'react-redux';
import { NodeLibrary } from './NodeLibrary.js';
import { ExecutionOverlay } from './ExecutionOverlay.js';
import { WorkflowToolbar } from './WorkflowToolbar.js';
import { NodeInspector } from './NodeInspector.js';
import { ErrorBoundary } from '../shared/ErrorBoundary.js';
import { useWorkflowHistory } from '../../hooks/useWorkflowHistory.js';
import { useAutoSave } from '../../hooks/useAutoSave.js';
import { useWorkflowValidation } from '../../hooks/useWorkflowValidation.js';
import { useRealTimeCollaboration } from '../../hooks/useRealTimeCollaboration.js';
import { WorkflowAnalytics } from './WorkflowAnalytics.js';
import { CUSTOM_NODE_TYPES } from './nodes.js';
import { CUSTOM_EDGE_TYPES } from './edges.js';
import type { WorkflowState } from '../../types/workflow.js';

export const WorkflowCanvas: React.FC = () => {
  const dispatch = useDispatch();
  const { nodes, edges, selectedNodes } = useSelector((state: WorkflowState) => state.workflow);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Initialize hooks
  const { undo, redo, canUndo, canRedo } = useWorkflowHistory();
  const { saveWorkflow, lastSaved } = useAutoSave();
  const { validationErrors, validateWorkflow } = useWorkflowValidation();
  const { collaborators, onUserAction } = useRealTimeCollaboration();

  // Node and edge event handlers
  const onNodesChange = useCallback((changes) => {
    dispatch({ type: 'UPDATE_NODES', payload: changes });
    onUserAction('node_change', changes);
  }, [dispatch, onUserAction]);

  const onEdgesChange = useCallback((changes) => {
    dispatch({ type: 'UPDATE_EDGES', payload: changes });
    onUserAction('edge_change', changes);
  }, [dispatch, onUserAction]);

  const onConnect = useCallback((connection) => {
    dispatch({ type: 'ADD_EDGE', payload: connection });
    onUserAction('connect', connection);
  }, [dispatch, onUserAction]);

  // Validate workflow on changes
  useEffect(() => {
    validateWorkflow({ nodes, edges });
  }, [nodes, edges, validateWorkflow]);

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
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={CUSTOM_NODE_TYPES}
              edgeTypes={CUSTOM_EDGE_TYPES}
              proOptions={{ 
                hideAttribution: true,
                account: 'pro' 
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

              {collaborators.map(user => (
                <div 
                  key={user.id}
                  className="collaborator-cursor"
                  style={{ 
                    left: user.position.x,
                    top: user.position.y,
                    backgroundColor: user.color 
                  }}
                >
                  {user.name}
                </div>
              ))}
            </ReactFlow>
          </div>

          {selectedNodes.length > 0 && (
            <NodeInspector 
              node={selectedNodes[0]}
              onUpdate={onNodesChange}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};
