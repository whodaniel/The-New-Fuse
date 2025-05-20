import React, { memo, useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node.js';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

const OutputNode: React.React.FC<NodeProps> = memo(({ id, data }) => {
  const [newOutputKey, setNewOutputKey] = useState('');
  const outputMapping = data.config?.outputMapping || {};
  
  // Add a new output
  const handleAddOutput = () => {
    if (!newOutputKey.trim()) return;
    
    const updatedMapping = {
      ...outputMapping,
      [newOutputKey]: ''
    };
    
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          outputMapping: updatedMapping
        }
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
          outputMapping: updatedMapping
        }
      });
    }
  };
  
  // Create input handles for each output
  const inputHandles = Object.keys(outputMapping).map(key => ({
    id: key,
    label: key
  }));
  
  // Add a default input handle if no outputs are defined
  if (inputHandles.length === 0) {
    inputHandles.push({ id: 'default', label: 'Input' });
  }
  
  const renderContent = () => (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Workflow Outputs</Label>
        
        <div className="space-y-2 mt-2">
          {Object.keys(outputMapping).map(key => (
            <div key={key} className="flex items-center space-x-2">
              <div className="flex-grow text-xs font-medium">{key}</div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => handleRemoveOutput(key)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="flex items-center space-x-2 mt-3">
          <Input
            className="h-7 text-xs flex-grow"
            placeholder="New output name"
            value={newOutputKey}
            onChange={(e: any) => setNewOutputKey(e.target.value)}
            onKeyDown={(e: any) => e.key === 'Enter' && handleAddOutput()}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
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
        renderContent
      }}
      inputHandles={inputHandles}
      outputHandles={[]}
    />
  );
});

OutputNode.displayName = 'OutputNode';

export { OutputNode };