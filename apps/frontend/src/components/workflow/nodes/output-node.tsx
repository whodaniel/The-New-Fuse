// @ts-nocheck
import { Label } from '@/components/ui';
import { PremiumButton as Button } from '@/components/ui/premium/PremiumButton';
import { PremiumInput as Input } from '@/components/ui/premium/PremiumInput';
import { Plus, X } from 'lucide-react';
import React, { memo, useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node';

const OutputNode: React.FC<NodeProps> = memo(({ id, data }) => {
  const [newOutputKey, setNewOutputKey] = useState('');
  const outputMapping = data.config?.outputMapping || {};

  // Add a new output
  const handleAddOutput = () => {
    if (!newOutputKey.trim()) return;

    const updatedMapping = {
      ...outputMapping,
      [newOutputKey]: '',
    };

    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          outputMapping: updatedMapping,
        },
      });
    }

    setNewOutputKey('');
  };

  // Remove an output
  const handleRemoveOutput = (key: string) => {
    const updatedMapping = { ...outputMapping };
    delete updatedMapping[key];

    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          outputMapping: updatedMapping,
        },
      });
    }
  };

  // Create input handles for each output
  const inputHandles = Object.keys(outputMapping).map((key) => ({
    id: key,
    label: key,
  }));

  // Add a default input handle if no outputs are defined
  if (inputHandles.length === 0) {
    inputHandles.push({ id: 'default', label: 'Input' });
  }

  const renderContent = () => (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs font-medium text-slate-200">Workflow Outputs</Label>

        {Object.keys(outputMapping).length === 0 ? (
          <div className="text-xs text-slate-300 leading-relaxed bg-slate-700/30 p-3 rounded border border-slate-600/50 mt-2">
            No outputs defined. Add outputs to expose workflow results.
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            {Object.keys(outputMapping).map((key) => (
              <div
                key={key}
                className="flex items-center space-x-2 bg-slate-700/50 p-2 rounded border border-slate-600"
              >
                <div className="flex-grow text-xs font-medium text-white">{key}</div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-slate-300 hover:text-white hover:bg-slate-600"
                  onClick={() => handleRemoveOutput(key)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-2 mt-3">
          <Input
            className="h-9 text-xs flex-grow bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            placeholder="New output name"
            value={newOutputKey}
            onChange={(e: any) => setNewOutputKey(e.target.value)}
            onKeyDown={(e: any) => e.key === 'Enter' && handleAddOutput()}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 border-slate-600 text-white hover:bg-slate-700 bg-slate-700/50"
            onClick={handleAddOutput}
          >
            <Plus className="h-3 w-3 mr-1" />
            <span className="text-xs">Add</span>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <BaseNode
      id={id}
      data={{
        ...data,
        name: data.name || 'Workflow Output',
        type: 'output',
        renderContent,
      }}
      inputHandles={inputHandles}
      outputHandles={[]}
    />
  );
});

OutputNode.displayName = 'OutputNode';

export { OutputNode };
