import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, Plus, Settings2, X } from 'lucide-react';
import React, { memo, useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node';

export type InputType = 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'date' | 'json';

export interface WorkflowInput {
  name: string;
  type: InputType;
  defaultValue?: any;
  options?: string[]; // For select type
  required?: boolean;
}

const InputNode: React.FC<NodeProps> = memo(({ id, data }) => {
  const [newInputName, setNewInputName] = useState('');
  const [newInputType, setNewInputType] = useState<InputType>('text');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingInput, setEditingInput] = useState<string | null>(null);

  const inputMapping: Record<string, WorkflowInput> = data.config?.inputMapping || {};

  // Add a new input
  const handleAddInput = () => {
    if (!newInputName.trim()) return;

    const updatedMapping = {
      ...inputMapping,
      [newInputName]: {
        name: newInputName,
        type: newInputType,
        defaultValue: getDefaultValueForType(newInputType),
        required: false,
      },
    };

    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          inputMapping: updatedMapping,
        },
      });
    }

    setNewInputName('');
    setNewInputType('text');
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

  // Update input type
  const handleUpdateInputType = (key: string, type: InputType) => {
    const updatedMapping = {
      ...inputMapping,
      [key]: {
        ...inputMapping[key],
        type,
        defaultValue: getDefaultValueForType(type),
      },
    };

    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          inputMapping: updatedMapping,
        },
      });
    }
  };

  // Toggle required
  const handleToggleRequired = (key: string) => {
    const updatedMapping = {
      ...inputMapping,
      [key]: {
        ...inputMapping[key],
        required: !inputMapping[key].required,
      },
    };

    if (data.onUpdate) {
      data.onUpdate({
        config: {
          ...data.config,
          inputMapping: updatedMapping,
        },
      });
    }
  };

  function getDefaultValueForType(type: InputType): any {
    switch (type) {
      case 'text':
      case 'textarea':
        return '';
      case 'number':
        return 0;
      case 'boolean':
        return false;
      case 'select':
        return '';
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'json':
        return '{}';
      default:
        return '';
    }
  }

  function getTypeIcon(type: InputType): string {
    switch (type) {
      case 'text':
        return 'T';
      case 'number':
        return '#';
      case 'boolean':
        return '✓';
      case 'select':
        return '▼';
      case 'textarea':
        return '≡';
      case 'date':
        return '📅';
      case 'json':
        return '{}';
      default:
        return '?';
    }
  }

  function getTypeBadgeColor(type: InputType): string {
    switch (type) {
      case 'text':
        return 'bg-blue-600';
      case 'number':
        return 'bg-purple-600';
      case 'boolean':
        return 'bg-green-600';
      case 'select':
        return 'bg-orange-600';
      case 'textarea':
        return 'bg-cyan-600';
      case 'date':
        return 'bg-pink-600';
      case 'json':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
    }
  }

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
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-slate-200">Workflow Inputs</Label>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-700"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Settings2 className="h-3 w-3 mr-1" />
            {showAdvanced ? 'Simple' : 'Advanced'}
          </Button>
        </div>

        {/* Existing inputs */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {Object.keys(inputMapping).length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-600 rounded">
              No inputs defined yet
            </div>
          ) : (
            Object.entries(inputMapping).map(([key, input]) => (
              <div
                key={key}
                className="bg-slate-700 rounded-lg px-3 py-2.5 border border-slate-600 hover:border-slate-500 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`${getTypeBadgeColor(input.type)} text-white text-xs font-bold px-1.5 py-0.5 rounded flex items-center justify-center`}
                        style={{ minWidth: '24px' }}
                        title={input.type}
                      >
                        {getTypeIcon(input.type)}
                      </div>
                      <span className="text-sm font-semibold text-white truncate">{key}</span>
                      {input.required && <span className="text-red-400 text-xs font-bold">*</span>}
                    </div>

                    {showAdvanced && (
                      <div className="mt-2 space-y-1.5 pl-8">
                        <Select
                          value={input.type}
                          onValueChange={(value) => handleUpdateInputType(key, value as InputType)}
                        >
                          <SelectTrigger className="h-7 text-xs bg-slate-800 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            <SelectItem
                              value="text"
                              className="text-xs text-white hover:bg-slate-700"
                            >
                              Text
                            </SelectItem>
                            <SelectItem
                              value="number"
                              className="text-xs text-white hover:bg-slate-700"
                            >
                              Number
                            </SelectItem>
                            <SelectItem
                              value="boolean"
                              className="text-xs text-white hover:bg-slate-700"
                            >
                              Boolean
                            </SelectItem>
                            <SelectItem
                              value="select"
                              className="text-xs text-white hover:bg-slate-700"
                            >
                              Select
                            </SelectItem>
                            <SelectItem
                              value="textarea"
                              className="text-xs text-white hover:bg-slate-700"
                            >
                              Textarea
                            </SelectItem>
                            <SelectItem
                              value="date"
                              className="text-xs text-white hover:bg-slate-700"
                            >
                              Date
                            </SelectItem>
                            <SelectItem
                              value="json"
                              className="text-xs text-white hover:bg-slate-700"
                            >
                              JSON
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2 text-xs w-full justify-start ${
                            input.required
                              ? 'text-red-400 hover:text-red-300'
                              : 'text-slate-300 hover:text-white'
                          } hover:bg-slate-800`}
                          onClick={() => handleToggleRequired(key)}
                        >
                          <Check
                            className={`h-3 w-3 mr-1 ${input.required ? 'opacity-100' : 'opacity-30'}`}
                          />
                          Required
                        </Button>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0 text-slate-300 hover:text-red-400 hover:bg-red-500/20"
                    onClick={() => handleRemoveInput(key)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add new input form */}
        <div className="space-y-2 pt-2 border-t border-slate-600">
          <Label className="text-xs font-medium text-slate-200">Add New Input</Label>

          <div className="space-y-2">
            <Input
              className="h-9 text-xs bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              placeholder="Input name (e.g., 'username', 'age')"
              value={newInputName}
              onChange={(e: any) => setNewInputName(e.target.value)}
              onKeyDown={(e: any) => e.key === 'Enter' && handleAddInput()}
            />

            <Select
              value={newInputType}
              onValueChange={(value) => setNewInputType(value as InputType)}
            >
              <SelectTrigger className="h-9 text-xs bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="text" className="text-xs text-white hover:bg-slate-700">
                  📝 Text
                </SelectItem>
                <SelectItem value="number" className="text-xs text-white hover:bg-slate-700">
                  🔢 Number
                </SelectItem>
                <SelectItem value="boolean" className="text-xs text-white hover:bg-slate-700">
                  ✓ Boolean (Yes/No)
                </SelectItem>
                <SelectItem value="select" className="text-xs text-white hover:bg-slate-700">
                  ▼ Select (Dropdown)
                </SelectItem>
                <SelectItem value="textarea" className="text-xs text-white hover:bg-slate-700">
                  📄 Textarea (Multi-line)
                </SelectItem>
                <SelectItem value="date" className="text-xs text-white hover:bg-slate-700">
                  📅 Date
                </SelectItem>
                <SelectItem value="json" className="text-xs text-white hover:bg-slate-700">
                  {'{}'} JSON Object
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="default"
              size="sm"
              className="h-9 w-full bg-blue-600 hover:bg-blue-500 text-white font-medium"
              onClick={handleAddInput}
              disabled={!newInputName.trim()}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Input
            </Button>
          </div>
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
