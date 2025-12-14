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
      <div className="space-y-1">
        <Label className="text-xs text-gray-300">Workflow Inputs</Label>

        <div className="space-y-2 mt-2">
          {Object.keys(inputMapping).map((key) => (
            <div
              key={key}
              className="flex items-center space-x-2 bg-slate-700/50 rounded px-2 py-1"
            >
              <div className="flex-grow text-xs font-medium text-white">{key}</div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                onClick={() => handleRemoveInput(key)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center space-x-2 mt-3">
          <Input
            className="h-7 text-xs flex-grow bg-slate-700/50 border-white/10 text-white placeholder:text-gray-500"
            placeholder="New input name"
            value={newInputKey}
            onChange={(e: any) => setNewInputKey(e.target.value)}
            onKeyDown={(e: any) => e.key === 'Enter' && handleAddInput()}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 border-white/20 text-white hover:bg-white/10"
            onClick={handleAddInput}
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
