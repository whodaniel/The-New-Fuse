// @ts-nocheck
import { Label, Tooltip } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { PremiumButton as Button } from '@/components/ui/premium/PremiumButton';
import { PremiumInput as Input } from '@/components/ui/premium/PremiumInput';
import { Check, HelpCircle, Plus, Settings2, X } from 'lucide-react';
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

const InputNode: React.FC<NodeProps> = memo((props) => {
  const { data } = props;
  const [newInputName, setNewInputName] = useState('');
  const [newInputType, setNewInputType] = useState<InputType>('text');
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    <div className="space-y-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold text-slate-100">Workflow Inputs</Label>
          <Tooltip label="Define the input parameters that users will provide when running this workflow">
            <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-300 cursor-help" />
          </Tooltip>
        </div>
        <Tooltip
          label={
            showAdvanced
              ? 'Switch to simple mode (hide type selection and validation options)'
              : 'Switch to advanced mode (show type selection and validation options)'
          }
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Settings2 className="h-3.5 w-3.5 mr-1.5" />
            {showAdvanced ? 'Simple Mode' : 'Advanced Mode'}
          </Button>
        </Tooltip>
      </div>

      {/* Existing inputs list */}
      <div className="space-y-2">
        {Object.keys(inputMapping).length === 0 ? (
          <div className="text-center py-8 px-4 border-2 border-dashed border-slate-600/50 rounded-md bg-slate-800/30">
            <div className="flex flex-col items-center gap-2">
              <div className="text-slate-400 text-sm font-medium">No inputs defined yet</div>
              <div className="text-xs text-slate-400 max-w-[200px]">
                Add your first input below to get started
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
            {Object.entries(inputMapping).map(([key, input]) => (
              <div
                key={key}
                className="bg-slate-700/50 rounded-md px-3 py-2.5 border border-slate-600/50 hover:border-slate-500 hover:bg-slate-700/70 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Tooltip label={`Type: ${input.type}`}>
                        <div
                          className={`${getTypeBadgeColor(input.type)} text-white text-xs font-bold px-2 py-0.5 rounded-md flex items-center justify-center shadow-none`}
                          style={{ minWidth: '28px' }}
                        >
                          {getTypeIcon(input.type)}
                        </div>
                      </Tooltip>
                      <span className="text-sm font-semibold text-white truncate">{key}</span>
                      {input.required && (
                        <Tooltip label="This field is required">
                          <span className="text-red-400 text-xs font-bold">*</span>
                        </Tooltip>
                      )}
                    </div>

                    {showAdvanced && (
                      <div className="mt-2.5 space-y-2 pl-9">
                        <div>
                          <Label className="text-xs text-slate-300 mb-1 block">Input Type</Label>
                          <Select
                            value={input.type}
                            onValueChange={(value: string) =>
                              handleUpdateInputType(key, value as InputType)
                            }
                          >
                            <SelectTrigger className="h-8 text-xs bg-slate-800 border-slate-600 text-white hover:bg-slate-750 transition-colors">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-600">
                              <SelectItem
                                value="text"
                                className="text-xs text-white hover:bg-slate-700 cursor-pointer"
                              >
                                📝 Text
                              </SelectItem>
                              <SelectItem
                                value="number"
                                className="text-xs text-white hover:bg-slate-700 cursor-pointer"
                              >
                                🔢 Number
                              </SelectItem>
                              <SelectItem
                                value="boolean"
                                className="text-xs text-white hover:bg-slate-700 cursor-pointer"
                              >
                                ✓ Boolean (Yes/No)
                              </SelectItem>
                              <SelectItem
                                value="select"
                                className="text-xs text-white hover:bg-slate-700 cursor-pointer"
                              >
                                ▼ Select (Dropdown)
                              </SelectItem>
                              <SelectItem
                                value="textarea"
                                className="text-xs text-white hover:bg-slate-700 cursor-pointer"
                              >
                                📄 Textarea (Multi-line)
                              </SelectItem>
                              <SelectItem
                                value="date"
                                className="text-xs text-white hover:bg-slate-700 cursor-pointer"
                              >
                                📅 Date
                              </SelectItem>
                              <SelectItem
                                value="json"
                                className="text-xs text-white hover:bg-slate-700 cursor-pointer"
                              >
                                {'{ }'} JSON Object
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2 text-xs w-full justify-start transition-all ${
                            input.required
                              ? 'text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800'
                          }`}
                          onClick={() => handleToggleRequired(key)}
                        >
                          <Check
                            className={`h-3.5 w-3.5 mr-2 transition-opacity ${
                              input.required ? 'opacity-100' : 'opacity-30'
                            }`}
                          />
                          {input.required ? 'Required Field' : 'Optional Field'}
                        </Button>
                      </div>
                    )}
                  </div>

                  <Tooltip label="Remove this input">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-all"
                      onClick={() => handleRemoveInput(key)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new input form */}
      <div className="space-y-3 pt-3 border-t border-slate-600/50">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium text-slate-200">Add New Input</Label>
          <Tooltip label="Create a new input field that users will fill in when running this workflow">
            <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-300 cursor-help" />
          </Tooltip>
        </div>

        <div className="space-y-2.5">
          <div>
            <Label className="text-xs text-slate-300 mb-1.5 block">
              Input Name <span className="text-red-400">*</span>
            </Label>
            <Input
              className="h-9 text-sm bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="e.g., username, email, age, description..."
              value={newInputName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewInputName(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                e.key === 'Enter' && newInputName.trim() && handleAddInput()
              }
            />
            {newInputName.length > 0 && newInputName.length < 2 && (
              <p className="text-xs text-amber-400 mt-1">Name should be at least 2 characters</p>
            )}
          </div>

          <div>
            <Label className="text-xs text-slate-300 mb-1.5 block">Input Type</Label>
            <Select
              value={newInputType}
              onValueChange={(value: string) => setNewInputType(value as InputType)}
            >
              <SelectTrigger className="h-9 text-sm bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700 transition-colors">
                <SelectValue placeholder="Select input type..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem
                  value="text"
                  className="text-sm text-white hover:bg-slate-700 cursor-pointer"
                >
                  📝 Text — Single-line text input
                </SelectItem>
                <SelectItem
                  value="number"
                  className="text-sm text-white hover:bg-slate-700 cursor-pointer"
                >
                  🔢 Number — Numeric values only
                </SelectItem>
                <SelectItem
                  value="boolean"
                  className="text-sm text-white hover:bg-slate-700 cursor-pointer"
                >
                  ✓ Boolean — True/False or Yes/No
                </SelectItem>
                <SelectItem
                  value="select"
                  className="text-sm text-white hover:bg-slate-700 cursor-pointer"
                >
                  ▼ Select — Dropdown with predefined options
                </SelectItem>
                <SelectItem
                  value="textarea"
                  className="text-sm text-white hover:bg-slate-700 cursor-pointer"
                >
                  📄 Textarea — Multi-line text input
                </SelectItem>
                <SelectItem
                  value="date"
                  className="text-sm text-white hover:bg-slate-700 cursor-pointer"
                >
                  📅 Date — Date picker
                </SelectItem>
                <SelectItem
                  value="json"
                  className="text-sm text-white hover:bg-slate-700 cursor-pointer"
                >
                  {'{ }'} JSON — Structured data object
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="default"
            size="sm"
            className="h-9 w-full bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddInput}
            disabled={!newInputName.trim() || newInputName.length < 2}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Input Field
          </Button>
          {!newInputName.trim() && (
            <p className="text-xs text-slate-400 text-center">Enter a name to add an input</p>
          )}
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.7);
        }
      `}</style>
    </div>
  );

  return (
    <BaseNode
      {...props}
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
