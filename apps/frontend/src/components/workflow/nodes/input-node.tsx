import React, { memo, useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node.js';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

const InputNode: React.React.FC<NodeProps> = memo(({ id, data }) => {
  const [newInputKey, setNewInputKey] = useState('');
  const inputMapping = data.config?.inputMapping || {};
  
  // Add a new input
  const handleAddInput = () => {
    if (!newInputKey.trim()) return;
    
    const updatedMapping = {
      ...inputMapping,
      [newInputKey]: ''
    };
    
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          inputMapping: updatedMapping
        }
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
          inputMapping: updatedMapping
        }
      });
    }
  };
  
  // Create output handles for each input
  const outputHandles = Object.keys(inputMapping).map(key => ({
    id: key,
    label: key
  }));
  
  // Add a default output handle if no inputs are defined
  if (outputHandles.length === 0) {
    outputHandles.push({ id: 'default', label: 'Output' });
  }
  
  const renderContent = () => (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Workflow Inputs</Label>
        
        <div className="space-y-2 mt-2">
          {Object.keys(inputMapping).map(key => (
            <div key={key} className="flex items-center space-x-2">
              <div className="flex-grow text-xs font-medium">{key}</div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => handleRemoveInput(key)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="flex items-center space-x-2 mt-3">
          <Input
            className="h-7 text-xs flex-grow"
            placeholder="New input name"
            value={newInputKey}
            onChange={(e: any) => setNewInputKey(e.target.value)}
            onKeyDown={(e: any) => e.key === 'Enter' && handleAddInput()}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
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
        renderContent
      }}
      inputHandles={[]}
      outputHandles={outputHandles}
    />
  );
});

InputNode.displayName = 'InputNode';

export { InputNode };