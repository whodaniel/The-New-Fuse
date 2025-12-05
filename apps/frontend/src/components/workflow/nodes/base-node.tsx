import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import React, { memo, useState } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';

export interface BaseNodeProps extends NodeProps {
  data: {
    name: string;
    type: string;
    config: Record<string, any>;
    onUpdate?: (data: any) => void;
    onDelete?: () => void;
  };
  inputHandles?: Array<{ id: string; label: string }>;
  outputHandles?: Array<{ id: string; label: string }>;
}

export const BaseNode: React.FC<BaseNodeProps> = memo(
  ({
    id: _id,
    data,
    inputHandles = [{ id: 'default', label: 'Input' }],
    outputHandles = [{ id: 'default', label: 'Output' }],
  }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <Card className="w-64 shadow-md">
        <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">{data.name}</CardTitle>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {data.onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={data.onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="p-3 pt-0">
            {/* Custom content for each node type will go here */}
            {data.type && (
              <div className="text-xs text-muted-foreground mb-2">Type: {data.type}</div>
            )}
          </CardContent>
        )}

        {/* Input handles */}
        {inputHandles.map((handle: any) => (
          <Handle
            key={`input-${handle.id}`}
            id={handle.id}
            type="target"
            position={Position.Left}
            className="w-2 h-2 rounded-full bg-primary border-2 border-background"
            style={{
              left: -3,
              top: `${((1 + inputHandles.indexOf(handle)) / (inputHandles.length + 1)) * 100}%`,
            }}
          />
        ))}

        {/* Output handles */}
        {outputHandles.map((handle: any) => (
          <Handle
            key={`output-${handle.id}`}
            id={handle.id}
            type="source"
            position={Position.Right}
            className="w-2 h-2 rounded-full bg-primary border-2 border-background"
            style={{
              right: -3,
              top: `${((1 + outputHandles.indexOf(handle)) / (outputHandles.length + 1)) * 100}%`,
            }}
          />
        ))}
      </Card>
    );
  }
);

BaseNode.displayName = 'BaseNode';
