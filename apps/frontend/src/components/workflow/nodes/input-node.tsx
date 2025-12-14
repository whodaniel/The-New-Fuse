import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import React, { memo, useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node';

const InputNode: React.FC<NodeProps> = memo(({ id, data }) => {
  const [newInputKey, setNewInputKey] = useState('');
  const inputMapping = data.config?.inputMapping || {};

  // Add a new input
  const handleAddInput = () => {
    if (!newInputKey.trim()) return;

    const updatedMapping = {
      ...inputMapping,
      [newInputKey]: '',
    };

    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          inputMapping: updatedMapping,
        },
      });
    }

    setNewInputKey('');
  };

  // Remove an input
  const handleRemoveInput = (key: string) => {
    const updatedMapping = { ...inputMapping };
    delete updatedMapping[key];

    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          inputMapping: updatedMapping,
        },
      });
    }
  };

  // Create output handles for each input
  const outputHandles = Object.keys(inputMapping).map((key) => ({
    id: key,
    label: key,
  }));

  // Add a default output handle if no inputs are defined
  if (outputHandles.length === 0) {
    outputHandles.push({ id: 'default', label: 'Output' });
  }

  const renderContent = () => (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-200">Workflow Inputs</Label>

        <div className="space-y-2">
          {Object.keys(inputMapping).map((key) => (
            <div
              key={key}
              className="flex items-center space-x-2 bg-slate-700 rounded px-3 py-2 border border-slate-600"
            >
              <div className="flex-grow text-xs font-medium text-white">{key}</div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-300 hover:text-red-400 hover:bg-red-500/20"
                onClick={() => handleRemoveInput(key)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center space-x-2 mt-3">
          <Input
            className="h-9 text-xs flex-grow bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            placeholder="New input name"
            value={newInputKey}
            onChange={(e: any) => setNewInputKey(e.target.value)}
            onKeyDown={(e: any) => e.key === 'Enter' && handleAddInput()}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 border-slate-600 text-white hover:bg-slate-700 bg-slate-700/50"
            onClick={handleAddInput}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs font-medium">Add</span>
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
        name: data.name || 'Workflow Input',
        type: 'input',
        renderContent,
      }}
      inputHandles={[]}
      outputHandles={outputHandles}
    />
  );
});

InputNode.displayName = 'InputNode';

export { InputNode };
