import { Button } from '@/components/ui';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { X } from 'lucide-react';
import React from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from 'reactflow';

export const WorkflowEdge = React.memo<EdgeProps>(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
  }) => {
    const {
      actions: { removeEdge },
      isReadOnly,
    } = useWorkflow();
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const isConditional = data?.type === 'conditional';
    const edgeColor = isConditional ? '#f59e0b' : '#64748b';

    return (
      <>
        <BaseEdge
          path={edgePath}
          markerEnd={markerEnd}
          style={{
            ...style,
            stroke: edgeColor,
            strokeWidth: 2,
            animation: data?.animated ? 'flowAnimation 1s infinite' : undefined,
          }}
        />

        {data?.label && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                fontSize: 12,
                pointerEvents: 'all',
              }}
              className="nodrag nopan"
            >
              <div
                className={`px-2 py-1 rounded-md ${
                  isConditional ? 'bg-amber-100' : 'bg-slate-100'
                }`}
              >
                {data.label}
              </div>
            </div>
          </EdgeLabelRenderer>
        )}

        {!isReadOnly && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: 'all',
              }}
              className="nodrag nopan"
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
                onClick={() => removeEdge(id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  }
);

WorkflowEdge.displayName = 'WorkflowEdge';
