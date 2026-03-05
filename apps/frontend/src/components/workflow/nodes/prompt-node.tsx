// @ts-nocheck
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import React, { memo, useEffect, useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  template: string;
}

const PromptNode: React.FC<NodeProps> = memo(({ id, data }) => {
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [variables, setVariables] = useState<string[]>([]);

  // Load prompt templates
  useEffect(() => {
    loadPromptTemplates();
  }, []);

  // Extract variables from prompt template
  useEffect(() => {
    const template = selectedTemplate?.template || customPrompt;
    if (template) {
      const variableMatches = template.match(/\{\{(\w+)\}\}/g);
      const extractedVars = variableMatches
        ? variableMatches.map((match) => match.replace(/\{\{|\}\}/g, ''))
        : [];
      setVariables([...new Set(extractedVars)]);
    } else {
      setVariables([]);
    }
  }, [selectedTemplate, customPrompt]);

  const loadPromptTemplates = async () => {
    try {
      // Try to load from electron API first
      if (window.electronAPI) {
        const templates = await window.electronAPI.getPromptTemplates();
        setPromptTemplates(templates || getDefaultTemplates());
      } else {
        // Browser mode - use default templates
        setPromptTemplates(getDefaultTemplates());
      }
    } catch (error) {
      console.error('Failed to load prompt templates:', error);
      setPromptTemplates(getDefaultTemplates());
    }
  };

  const getDefaultTemplates = (): PromptTemplate[] => [
    {
      id: 'agent_task',
      name: 'Agent Task Assignment',
      description: 'Template for assigning tasks to AI agents',
      category: 'agent',
      tags: ['task', 'assignment', 'agent'],
      template:
        'You are an AI agent with the following capabilities: {{capabilities}}. Please complete this task: {{task}}. Context: {{context}}',
    },
    {
      id: 'code_review',
      name: 'Code Review Request',
      description: 'Template for requesting code reviews',
      category: 'development',
      tags: ['code', 'review', 'development'],
      template:
        'Please review the following {{language}} code and provide feedback on:\n1. Code quality\n2. Best practices\n3. Potential issues\n4. Suggestions for improvement\n\nCode:\n```{{language}}\n{{code}}\n```',
    },
    {
      id: 'error_analysis',
      name: 'Error Analysis',
      description: 'Template for analyzing errors and bugs',
      category: 'debugging',
      tags: ['error', 'analysis', 'debugging'],
      template:
        'Analyze the following error and provide:\n1. Root cause analysis\n2. Potential solutions\n3. Prevention strategies\n\nError: {{error}}\nContext: {{context}}\nStack trace: {{stackTrace}}',
    },
    {
      id: 'custom',
      name: 'Custom Prompt',
      description: 'Write your own custom prompt',
      category: 'custom',
      tags: ['custom'],
      template: '',
    },
  ];

  const handleTemplateChange = (templateId: string) => {
    const template = promptTemplates.find((t) => t.id === templateId);
    setSelectedTemplate(template || null);

    if (template?.id === 'custom') {
      setCustomPrompt(data.config?.customPrompt || '');
    } else {
      setCustomPrompt('');
    }

    if (data.onUpdate) {
      data.onUpdate({
        name: template?.name || 'Prompt',
        config: {
          ...data.config,
          templateId,
          template: template?.template || '',
          customPrompt: template?.id === 'custom' ? data.config?.customPrompt || '' : '',
        },
      });
    }
  };

  const handleCustomPromptChange = (value: string) => {
    setCustomPrompt(value);

    if (data.onUpdate) {
      data.onUpdate({
        name: 'Custom Prompt',
        config: {
          ...data.config,
          customPrompt: value,
          template: value,
        },
      });
    }
  };

  // Initialize selected template from data
  useEffect(() => {
    if (data.config?.templateId && promptTemplates.length > 0) {
      const template = promptTemplates.find((t) => t.id === data.config.templateId);
      if (template) {
        setSelectedTemplate(template);
        if (template.id === 'custom') {
          setCustomPrompt(data.config?.customPrompt || '');
        }
      }
    }
  }, [data.config, promptTemplates]);

  const inputHandles = [
    { id: 'trigger', label: 'Trigger' },
    ...variables.map((variable) => ({
      id: `var_${variable}`,
      label: variable,
    })),
  ];

  const outputHandles = [
    { id: 'prompt', label: 'Generated Prompt' },
    { id: 'error', label: 'Error' },
  ];

  const renderContent = () => (
    <div className="space-y-3">
      <div>
        <Label htmlFor={`template-${id}`} className="text-xs font-medium text-slate-200">
          Template
        </Label>
        <Select value={data.config?.templateId || ''} onValueChange={handleTemplateChange}>
          <SelectTrigger
            id={`template-${id}`}
            className="h-9 text-xs mt-1.5 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            {promptTemplates.map((template) => (
              <SelectItem
                key={template.id}
                value={template.id}
                className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
              >
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTemplate && selectedTemplate.id !== 'custom' && (
        <div className="text-xs">
          <Label className="text-xs font-medium text-slate-200">Description</Label>
          <p className="text-slate-300 mt-1 leading-relaxed">{selectedTemplate.description}</p>

          {selectedTemplate.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedTemplate.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs bg-slate-700 text-slate-200 border-slate-600"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTemplate?.id === 'custom' && (
        <div>
          <Label htmlFor={`custom-prompt-${id}`} className="text-xs font-medium text-slate-200">
            Custom Prompt
          </Label>
          <Textarea
            id={`custom-prompt-${id}`}
            value={customPrompt}
            onChange={(e) => handleCustomPromptChange(e.target.value)}
            placeholder="Enter your custom prompt here..."
            className="text-xs mt-1.5 min-h-[100px] bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 font-mono resize-none"
          />
        </div>
      )}

      {variables.length > 0 && (
        <div>
          <Label className="text-xs font-medium text-slate-200">Variables</Label>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {variables.map((variable) => (
              <Badge
                key={variable}
                variant="outline"
                className="text-xs bg-slate-700/50 text-blue-300 border-blue-500/50 font-mono"
              >
                {`{{${variable}}}`}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <BaseNode
      id={id}
      data={{
        ...data,
        name: selectedTemplate?.name || data.name || 'Prompt',
        type: 'prompt',
        renderContent,
      }}
      inputHandles={inputHandles}
      outputHandles={outputHandles}
    />
  );
});

PromptNode.displayName = 'PromptNode';

export { PromptNode };
