/**
 * Agent Configuration Step
 *
 * Step for configuring a new agent's basic settings
 */

import { Bot, Brain, Code, Cpu, MessageSquare, Wand2 } from 'lucide-react';
import React, { useState } from 'react';
import { WizardContext } from '../WizardSystem';

export interface AgentConfigurationProps {
  context: WizardContext;
  onDataChange: (data: Record<string, unknown>) => void;
  validationErrors?: string[];
}

const AGENT_TYPES = [
  {
    id: 'chat',
    label: 'Chat Agent',
    description: 'Conversational AI for customer support or team communication',
    icon: MessageSquare,
    capabilities: ['text-generation', 'conversation'],
  },
  {
    id: 'code',
    label: 'Code Agent',
    description: 'Assist with coding, debugging, and code review',
    icon: Code,
    capabilities: ['code-generation', 'code-review', 'debugging'],
  },
  {
    id: 'orchestrator',
    label: 'Orchestrator',
    description: 'Coordinate multiple agents for complex workflows',
    icon: Cpu,
    capabilities: ['orchestration', 'task-delegation'],
  },
  {
    id: 'analyzer',
    label: 'Analyzer',
    description: 'Analyze data, documents, and provide insights',
    icon: Brain,
    capabilities: ['analysis', 'summarization'],
  },
  {
    id: 'custom',
    label: 'Custom Agent',
    description: 'Build a custom agent with selected capabilities',
    icon: Wand2,
    capabilities: [],
  },
];

const PROVIDERS = [
  { id: 'openai', label: 'OpenAI', models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  {
    id: 'anthropic',
    label: 'Anthropic',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  },
  { id: 'litellm', label: 'LiteLLM (Multi-provider)', models: ['auto'] },
];

export const AgentConfiguration: React.FC<AgentConfigurationProps> = ({
  context,
  onDataChange,
  validationErrors = [],
}) => {
  const [agentName, setAgentName] = useState((context.data.agentName as string) || '');
  const [agentType, setAgentType] = useState((context.data.agentType as string) || '');
  const [provider, setProvider] = useState((context.data.provider as string) || 'openai');
  const [model, setModel] = useState((context.data.model as string) || '');
  const [description, setDescription] = useState((context.data.agentDescription as string) || '');

  const handleNameChange = (value: string) => {
    setAgentName(value);
    onDataChange({ agentName: value });
  };

  const handleTypeChange = (typeId: string) => {
    const selectedType = AGENT_TYPES.find((t) => t.id === typeId);
    setAgentType(typeId);
    onDataChange({
      agentType: typeId,
      initialCapabilities: selectedType?.capabilities || [],
    });
  };

  const handleProviderChange = (value: string) => {
    const selectedProvider = PROVIDERS.find((p) => p.id === value);
    setProvider(value);
    setModel(selectedProvider?.models[0] || '');
    onDataChange({
      provider: value,
      model: selectedProvider?.models[0] || '',
    });
  };

  const handleModelChange = (value: string) => {
    setModel(value);
    onDataChange({ model: value });
  };

  const selectedProvider = PROVIDERS.find((p) => p.id === provider);

  return (
    <div className="wizard-step-agent-config">
      <div className="step-header">
        <Bot className="w-8 h-8 text-primary" />
        <h2 className="step-title">Configure Your Agent</h2>
        <p className="step-description">Set up the basic configuration for your new AI agent</p>
      </div>

      {validationErrors.length > 0 && (
        <div
          className="my-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
          role="alert"
        >
          <p className="font-bold">Please fix the following issues:</p>
          <ul className="list-disc list-inside">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="config-form">
        <div className="form-group">
          <label htmlFor="agent-name" className="form-label">
            Agent Name *
          </label>
          <input
            id="agent-name"
            type="text"
            className={`form-input ${
              validationErrors.some((e) => e === 'Agent name is required') ? 'border-red-500' : ''
            }`}
            placeholder="Enter a unique name for your agent"
            value={agentName}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            aria-invalid={validationErrors.some((e) => e === 'Agent name is required')}
            aria-describedby="agent-name-error"
          />
          {validationErrors.some((e) => e === 'Agent name is required') && (
            <p id="agent-name-error" className="text-red-600 text-sm mt-1">
              Agent name is a required field.
            </p>
          )}
          <p className="form-hint">Choose a descriptive name that reflects the agent's purpose</p>
        </div>

        <div className="form-group">
          <label className="form-label">Agent Type *</label>
          <div
            className={`agent-type-grid ${
              validationErrors.some((e) => e === 'Agent type is required')
                ? 'border border-red-500 rounded-lg p-2'
                : ''
            }`}
          >
            {AGENT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = agentType === type.id;

              return (
                <div
                  key={type.id}
                  className={`agent-type-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleTypeChange(type.id)}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                >
                  <div className="type-icon">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="type-label">{type.label}</h3>
                  <p className="type-description">{type.description}</p>
                  {type.capabilities.length > 0 && (
                    <div className="type-capabilities">
                      {type.capabilities.slice(0, 2).map((cap) => (
                        <span key={cap} className="capability-tag">
                          {cap}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="provider" className="form-label">
              LLM Provider *
            </label>
            <select
              id="provider"
              className="form-select"
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="model" className="form-label">
              Model *
            </label>
            <select
              id="model"
              className="form-select"
              value={model}
              onChange={(e) => handleModelChange(e.target.value)}
            >
              {selectedProvider?.models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description (Optional)
          </label>
          <textarea
            id="description"
            className="form-textarea"
            placeholder="Describe what this agent will do..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => onDataChange({ agentDescription: description })}
          />
        </div>
      </div>

      <div className="step-tips">
        <h4>Tips</h4>
        <ul>
          <li>Choose a specific agent type to get pre-configured capabilities</li>
          <li>LiteLLM supports automatic routing to the best provider</li>
          <li>You can add more capabilities in the next step</li>
        </ul>
      </div>
    </div>
  );
};
