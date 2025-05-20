import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node.js';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

const TransformNode: React.React.FC<NodeProps> = memo(({ id, data }) => {
  // Handle transform code change
  const handleTransformCodeChange = (code: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          transformCode: code
        }
      });
    }
  };
  
  // Handle transform type change
  const handleTransformTypeChange = (type: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          transformType: type
        }
      });
    }
  };
  
  const inputHandles = [
    { id: 'default', label: 'Input' }
  ];
  
  const outputHandles = [
    { id: 'default', label: 'Output' }
  ];
  
  const renderContent = () => (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor={`transform-type-${id}`} className="text-xs">Transform Type</Label>
        <select
          id={`transform-type-${id}`}
          className="w-full text-xs h-8 rounded-md border border-input"
          value={data.config?.transformType || 'javascript'}
          onChange={(e: any) => handleTransformTypeChange(e.target.value)}
        >
          <option value="javascript">JavaScript</option>
          <option value="json-path">JSONPath</option>
          <option value="template">Template</option>
        </select>
      </div>
      
      <div className="space-y-1">
        <Label htmlFor={`transform-code-${id}`} className="text-xs">Transform Code</Label>
        <Textarea
          id={`transform-code-${id}`}
          className="h-32 text-xs font-mono resize-none"
          placeholder={getPlaceholderByType(data.config?.transformType)}
          value={data.config?.transformCode || ''}
          onChange={(e: any) => handleTransformCodeChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {getHelpTextByType(data.config?.transformType)}
        </p>
      </div>
    </div>
  );
  
  return (
    <BaseNode
      id={id}
      data={{
        ...data,
        name: data.name || 'Transform',
        type: 'transform',
        renderContent
      }}
      inputHandles={inputHandles}
      outputHandles={outputHandles}
    />
  );
});

// Helper functions for transform node
function getPlaceholderByType(type: string = 'javascript'): string {
  switch (type) {
    case 'javascript':
      return '// Transform input data\nfunction transform(input) {\n  // Your code here\n  return input;\n}';
    case 'json-path':
      return '$.data.items[*].name';
    case 'template':
      return 'Hello {{name}}, welcome to {{company}}!';
    default:
      return '';
  }
}

function getHelpTextByType(type: string = 'javascript'): string {
  switch (type) {
    case 'javascript':
      return 'Write JavaScript code to transform the input data. The input is available as the "input" parameter.';
    case 'json-path':
      return 'Use JSONPath expressions to extract data from the input JSON object.';
    case 'template':
      return 'Use handlebars-style templates with {{variable}} syntax to create text from input data.';
    default:
      return '';
  }
}

TransformNode.displayName = 'TransformNode';

export { TransformNode };
