// @ts-nocheck
import { Badge, Button, Card } from '@/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { MoreHorizontal, Play, Settings, Trash2 } from 'lucide-react';
import React, { useCallback } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';

export type WorkflowNodeData = {
  label: string;
  type: 'agent' | 'tool' | 'condition';
  status?: 'idle' | 'running' | 'completed' | 'error';
};

export const WorkflowNode = React.memo<NodeProps<WorkflowNodeData>>(({ id, data, selected }) => {
  const {
    actions: { removeNode, updateNode, executeNode },
    isReadOnly,
  } = useWorkflow();

  const handleExecute = useCallback(() => {
    executeNode(id);
  }, [executeNode, id]);

  const handleRemove = useCallback(() => {
    removeNode(id);
  }, [removeNode, id]);

  const handleConfig = useCallback(() => {
    // TODO: Open config modal
  }, []);

  const getNodeStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: '10px',
      borderRadius: '8px',
      minWidth: '150px',
    };

    const typeStyles: Record<string, React.CSSProperties> = {
      agent: {
        backgroundColor: '#818cf8',
        borderColor: '#6366f1',
      },
      tool: {
        backgroundColor: '#34d399',
        borderColor: '#10b981',
      },
      condition: {
        backgroundColor: '#fbbf24',
        borderColor: '#f59e0b',
      },
    };

    const statusStyles: Record<string, React.CSSProperties> = {
      idle: { opacity: 0.8 },
      running: { animation: 'pulse 2s infinite' },
      completed: { opacity: 1 },
      error: { borderColor: '#ef4444' },
    };

    return {
      ...baseStyle,
      ...typeStyles[data.type],
      ...(data.status ? statusStyles[data.status] : {}),
      ...(selected ? { boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)' } : {}),
    };
  };

  return (
    <Card className="relative" style={getNodeStyle()}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />

      <div className="flex items-center justify-between p-2">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-white">{data.label}</span>
          {data.status && (
            <Badge
              variant={
                data.status === 'completed'
                  ? 'success'
                  : data.status === 'error'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {data.status}
            </Badge>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isReadOnly}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExecute}>
              <Play className="mr-2 h-4 w-4" />
              Execute
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleConfig}>
              <Settings className="mr-2 h-4 w-4" />
              Configure
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleRemove} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
    </Card>
  );
});

WorkflowNode.displayName = 'WorkflowNode';
