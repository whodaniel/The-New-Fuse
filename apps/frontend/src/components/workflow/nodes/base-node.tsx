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
      <Card className="w-64 shadow-lg bg-slate-800 border-white/20 text-white">
        <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between border-b border-white/10">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium text-white truncate">{data.name}</CardTitle>
            {data.type && <div className="text-xs text-gray-400 mt-0.5">Type: {data.type}</div>}
          </div>
          <div className="flex items-center space-x-1 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {data.onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={data.onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="p-3 pt-2 bg-slate-800/50">
            {/* Custom content for each node type will go here */}
            {data.renderContent && data.renderContent()}
          </CardContent>
        )}

        {/* Input handles */}
        {inputHandles.map((handle: any) => (
          <Handle
            key={`input-${handle.id}`}
            id={handle.id}
            type="target"
            position={Position.Left}
            className="w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900 hover:bg-blue-400 transition-colors"
            style={{
              left: -6,
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
            className="w-3 h-3 rounded-full bg-green-500 border-2 border-slate-900 hover:bg-green-400 transition-colors"
            style={{
              right: -6,
              top: `${((1 + outputHandles.indexOf(handle)) / (outputHandles.length + 1)) * 100}%`,
            }}
          />
        ))}
      </Card>
    );
  }
);

BaseNode.displayName = 'BaseNode';
