import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node';

const TransformNode: React.FC<NodeProps> = memo(({ id, data }) => {
  // Handle transform code change
  const handleTransformCodeChange = (code: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          transformCode: code,
        },
      });
    }
  };

  // Handle transform type change
  const handleTransformTypeChange = (type: string) => {
    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          transformType: type,
        },
      });
    }
  };

  const inputHandles = [{ id: 'default', label: 'Input' }];

  const outputHandles = [{ id: 'default', label: 'Output' }];

  const renderContent = () => (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`transform-type-${id}`} className="text-xs font-medium text-slate-200">
          Transform Type
        </Label>
        <Select
          value={data.config?.transformType || 'javascript'}
          onValueChange={handleTransformTypeChange}
        >
          <SelectTrigger
            id={`transform-type-${id}`}
            className="h-9 text-xs bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <SelectValue placeholder="Select transform type" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem
              value="javascript"
              className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
            >
              ⚡ JavaScript
            </SelectItem>
            <SelectItem
              value="json-path"
              className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
            >
              🔍 JSONPath
            </SelectItem>
            <SelectItem
              value="template"
              className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
            >
              📝 Template
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`transform-code-${id}`} className="text-xs font-medium text-slate-200">
          Transform Code
        </Label>
        <Textarea
          id={`transform-code-${id}`}
          className="h-32 text-xs font-mono resize-none bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
          placeholder={getPlaceholderByType(data.config?.transformType)}
          value={data.config?.transformCode || ''}
          onChange={(e: any) => handleTransformCodeChange(e.target.value)}
        />
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-700/30 p-2 rounded border border-slate-600/50">
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
        renderContent,
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
