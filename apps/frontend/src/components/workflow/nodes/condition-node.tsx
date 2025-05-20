import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node.js';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const ConditionNode: React.React.FC<NodeProps> = memo(({ id, data }) => {
  // Handle condition change
  const handleConditionChange = (condition: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          condition
        }
      });
    }
  };
  
  const inputHandles = [
    { id: 'default', label: 'Input' }
  ];
  
  const outputHandles = [
    { id: 'true', label: 'True' },
    { id: 'false', label: 'False' }
  ];
  
  const renderContent = () => (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor={`condition-${id}`} className="text-xs">Condition Expression</Label>
        <Textarea
          id={`condition-${id}`}
          className="h-20 text-xs resize-none"
          placeholder="e.g. input.value > 10"
          value={data.config?.condition || ''}
          onChange={(e: any) => handleConditionChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Enter a JavaScript expression that evaluates to true or false.
          The expression can reference input values from connected nodes.
        </p>
      </div>
    </div>
  );
  
  return (
    <BaseNode
      id={id}
      data={{
        ...data,
        name: data.name || 'Condition',
        type: 'condition',
        renderContent
      }}
      inputHandles={inputHandles}
      outputHandles={outputHandles}
    />
  );
});

ConditionNode.displayName = 'ConditionNode';

export { ConditionNode };