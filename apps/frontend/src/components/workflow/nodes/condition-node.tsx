// @ts-nocheck
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node';

const ConditionNode: React.FC<NodeProps> = memo(({ id, data }) => {
  // Handle condition change
  const handleConditionChange = (condition: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          condition,
        },
      });
    }
  };

  const inputHandles = [{ id: 'default', label: 'Input' }];

  const outputHandles = [
    { id: 'true', label: 'True' },
    { id: 'false', label: 'False' },
  ];

  const renderContent = () => (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`condition-${id}`} className="text-xs font-medium text-slate-200">
          Condition Expression
        </Label>
        <Textarea
          id={`condition-${id}`}
          className="h-24 text-xs resize-none bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 font-mono"
          placeholder="e.g. input.value > 10"
          value={data.config?.condition || ''}
          onChange={(e: any) => handleConditionChange(e.target.value)}
        />
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-700/30 p-2 rounded border border-slate-600/50">
          Enter a JavaScript expression that evaluates to true or false. The expression can
          reference input values from connected nodes.
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
        renderContent,
      }}
      inputHandles={inputHandles}
      outputHandles={outputHandles}
    />
  );
});

ConditionNode.displayName = 'ConditionNode';

export { ConditionNode };
