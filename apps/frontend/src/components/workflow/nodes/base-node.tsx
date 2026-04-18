import { Button, Card, CardContent, CardHeader, CardTitle, Tooltip } from '@/components/ui';
import { AlertCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import React, { memo, useState } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';

export interface BaseNodeProps extends NodeProps {
  data: {
    name: string;
    type: string;
    config: Record<string, any>;
    onUpdate?: (data: any) => void;
    onDelete?: () => void;
    renderContent?: () => React.ReactNode;
    error?: string;
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
    // Default to collapsed for a cleaner canvas - user can expand as needed
    const [expanded, setExpanded] = useState(false);
    const hasError = !!data.error;

    return (
      <div className="relative" style={{ minWidth: '160px', maxWidth: '200px' }}>
        {/* Port labels - Input (left) */}
        {inputHandles.map((handle: any, index: number) => (
          <div
            key={`input-label-${handle.id}`}
            className="absolute pointer-events-none z-10"
            style={{
              left: '-8px',
              top: `${((1 + index) / (inputHandles.length + 1)) * 100}%`,
              transform: 'translate(-100%, -50%)',
            }}
          >
            <div className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded shadow-none whitespace-nowrap border border-blue-400">
              {handle.label}
            </div>
          </div>
        ))}

        {/* Port labels - Output (right) */}
        {outputHandles.map((handle: any, index: number) => (
          <div
            key={`output-label-${handle.id}`}
            className="absolute pointer-events-none z-10"
            style={{
              right: '-8px',
              top: `${((1 + index) / (outputHandles.length + 1)) * 100}%`,
              transform: 'translate(100%, -50%)',
            }}
          >
            <div className="bg-green-600 text-white text-xs font-medium px-2 py-1 rounded shadow-none whitespace-nowrap border border-green-400">
              {handle.label}
            </div>
          </div>
        ))}

        <div
          className={`node-container ${hasError ? 'ring-2 ring-red-500 rounded-md shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''}`}
        >
          <Card
            className={`w-full shadow-none bg-slate-800 text-white ${hasError ? 'border-red-500' : 'border-slate-600'}`}
          >
            <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between bg-linear-to-r from-slate-800 to-slate-750 border-b border-slate-600 relative">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold text-white truncate mb-1">
                    {data.name}
                  </CardTitle>
                  {hasError && (
                    <Tooltip
                      label={data.error || ''}
                      placement="top"
                      className="bg-red-900 border-red-700 text-white"
                    >
                      <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />
                    </Tooltip>
                  )}
                </div>
                {data.type && (
                  <div className="text-xs text-slate-200 font-medium">Type: {data.type}</div>
                )}
              </div>
              <div className="flex items-center space-x-1 ml-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-200 hover:text-white hover:bg-slate-700/70"
                  onClick={() => setExpanded(!expanded)}
                  aria-label={expanded ? 'Collapse node content' : 'Expand node content'}
                >
                  {expanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {data.onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-900/40"
                    onClick={data.onDelete}
                    aria-label="Delete node"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>

            {expanded && (
              <CardContent className="p-4 pt-3 bg-slate-850 border-t border-slate-700/50">
                {/* Custom content for each node type will go here */}
                {data.renderContent && data.renderContent()}
              </CardContent>
            )}

            {/* Input handles */}
            {inputHandles.map((handle: any, index: number) => (
              <Handle
                key={`input-${handle.id}`}
                id={handle.id}
                type="target"
                position={Position.Left}
                className="w-4 h-4 rounded-full bg-blue-500 border-3 border-white hover:bg-blue-400 hover:scale-125 transition-all shadow-none cursor-crosshair"
                style={{
                  left: -8,
                  top: `${((1 + index) / (inputHandles.length + 1)) * 100}%`,
                  borderWidth: '3px',
                }}
              />
            ))}

            {/* Output handles */}
            {outputHandles.map((handle: any, index: number) => (
              <Handle
                key={`output-${handle.id}`}
                id={handle.id}
                type="source"
                position={Position.Right}
                className="w-4 h-4 rounded-full bg-green-500 border-3 border-white hover:bg-green-400 hover:scale-125 transition-all shadow-none cursor-crosshair"
                style={{
                  right: -8,
                  top: `${((1 + index) / (outputHandles.length + 1)) * 100}%`,
                  borderWidth: '3px',
                }}
              />
            ))}
          </Card>
        </div>
      </div>
    );
  }
);

BaseNode.displayName = 'BaseNode';
