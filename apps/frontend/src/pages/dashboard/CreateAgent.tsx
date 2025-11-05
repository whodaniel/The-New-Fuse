import React, { useState } from 'react';
import { 
  ArrowLeft,
  Check,
  X,
  Info,
  Cpu,
  Cloud,
  User,
  Cog,
  BarChart,
  Pencil,
  Play,
  FileText,
  Code,
  Globe
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface AgentConfig {
  name: string;
  description: string;
  type: 'conversational' | 'task-automation' | 'data-analysis' | 'content-generation';
  model: string;
  deployment: 'cloud' | 'local' | 'hybrid';
  capabilities: string[];
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  tags: string[];
  isPublic: boolean;
  enableLogging: boolean;
  enableMetrics: boolean;
  rateLimitPerMinute: number;
  timeoutSeconds: number;
}

const CreateAgent: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState<AgentConfig>({
    name: '',
    description: '',
    type: 'conversational',
    model: 'gpt-4',
    deployment: 'cloud',
    capabilities: [],
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    tags: [],
    isPublic: false,
    enableLogging: true,
    enableMetrics: true,
    rateLimitPerMinute: 60,
    timeoutSeconds: 30
  });

  const steps = [
    { id: 1, name: 'Basic Info', icon: Info },
    { id: 2, name: 'Configuration', icon: Cog },
    { id: 3, name: 'Capabilities', icon: Cpu },
    { id: 4, name: 'Advanced', icon: Code },
    { id: 5, name: 'Review', icon: Check }
  ];

  const agentTypes = [
    {
      id: 'conversational',
      name: 'Conversational',
      description: 'Chat-based agents for customer support, Q&A, and general conversation',
      icon: User,
      color: 'blue'
    },
    {
      id: 'task-automation',
      name: 'Task Automation',
      description: 'Agents that automate workflows, processes, and repetitive tasks',
      icon: Cog,
      color: 'green'
    },
    {
      id: 'data-analysis',
      name: 'Data Analysis',
      description: 'Agents specialized in analyzing data, generating reports, and insights',
      icon: BarChart,
      color: 'purple'
    },
    {
      id: 'content-generation',
      name: 'Content Generation',
      description: 'Agents for creating content, writing, and creative tasks',
      icon: Pencil,
      color: 'orange'
    }
  ];

  const availableModels = [
    { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', description: 'Most capable model' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Fast and efficient' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Excellent reasoning' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', description: 'Balanced performance' },
    { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', description: 'Multimodal capabilities' }
  ];

  const availableCapabilities = [
    'Text Generation',
    'Code Generation',
    'Data Analysis',
    'Web Search',
    'File Processing',
    'Image Analysis',
    'API Integration',
    'Database Queries',
    'Email Sending',
    'Scheduling',
    'Translation',
    'Summarization'
  ];

  const handleCapabilityToggle = (capability: string) => {
    setConfig(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(capability)
        ? prev.capabilities.filter(c => c !== capability)
        : [...prev.capabilities, capability]
    }));
  };

  const handleTagAdd = (tag: string) => {
    if (tag && !config.tags.includes(tag)) {
      setConfig(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleTagRemove = (tag: string) => {
    setConfig(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/dashboard/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        const agent = await response.json();
        navigate(`/dashboard/agents/${agent.id}`);
      }
    } catch (error) {
      console.error('Failed to create agent:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="agentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Agent Name *
              </label>
              <input
                type="text"
                id="agentName"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="Enter a descriptive name for your agent"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="agentDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                id="agentDescription"
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                placeholder="Describe what this agent does and its purpose"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Agent Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agentTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      config.type === type.id
                        ? `border-${type.color}-500 bg-${type.color}-50 dark:bg-${type.color}-900/20`
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => setConfig({ ...config, type: type.id as any })}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 bg-${type.color}-100 dark:bg-${type.color}-900 rounded-lg`}>
                        <type.icon className={`w-6 h-6 text-${type.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {type.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {type.description}
                        </p>
                      </div>
                      {config.type === type.id && (
                        <Check className={`w-5 h-5 text-${type.color}-600`} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Language Model *
              </label>
              <div className="space-y-3">
                {availableModels.map((model) => (
                  <div
                    key={model.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      config.model === model.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => setConfig({ ...config, model: model.id })}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {model.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {model.provider} • {model.description}
                        </p>
                      </div>
                      {config.model === model.id && (
                        <CheckIcon className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Deployment Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    config.deployment === 'cloud'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setConfig({ ...config, deployment: 'cloud' })}
                >
                  <div className="text-center">
                    <CloudIcon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-medium text-gray-900 dark:text-white">Cloud</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Hosted and managed
                    </p>
                  </div>
                </div>
                
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    config.deployment === 'local'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setConfig({ ...config, deployment: 'local' })}
                >
                  <div className="text-center">
                    <CpuChipIcon className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <h3 className="font-medium text-gray-900 dark:text-white">Local</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Self-hosted
                    </p>
                  </div>
                </div>
                
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    config.deployment === 'hybrid'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setConfig({ ...config, deployment: 'hybrid' })}
                >
                  <div className="text-center">
                    <GlobeAltIcon className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <h3 className="font-medium text-gray-900 dark:text-white">Hybrid</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Mixed deployment
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                System Prompt
              </label>
              <textarea
                id="systemPrompt"
                value={config.systemPrompt}
                onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                placeholder="Define the agent's behavior, personality, and instructions..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Agent Capabilities
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select the capabilities your agent should have access to.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableCapabilities.map((capability) => (
                  <label
                    key={capability}
                    className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={config.capabilities.includes(capability)}
                      onChange={() => handleCapabilityToggle(capability)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {capability}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {config.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => handleTagRemove(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                      title="Remove tag"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                id="tags"
                placeholder="Add tags (press Enter)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTagAdd(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temperature: {config.temperature}
                </label>
                <input
                  type="range"
                  id="temperature"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Focused</span>
                  <span>Creative</span>
                </div>
              </div>

              <div>
                <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  id="maxTokens"
                  min="1"
                  max="8192"
                  value={config.maxTokens}
                  onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="topP" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Top P: {config.topP}
                </label>
                <input
                  type="range"
                  id="topP"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.topP}
                  onChange={(e) => setConfig({ ...config, topP: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="rateLimitPerMinute" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rate Limit (per minute)
                </label>
                <input
                  type="number"
                  id="rateLimitPerMinute"
                  min="1"
                  max="1000"
                  value={config.rateLimitPerMinute}
                  onChange={(e) => setConfig({ ...config, rateLimitPerMinute: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.isPublic}
                  onChange={(e) => setConfig({ ...config, isPublic: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Make this agent publicly available
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.enableLogging}
                  onChange={(e) => setConfig({ ...config, enableLogging: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Enable conversation logging
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.enableMetrics}
                  onChange={(e) => setConfig({ ...config, enableMetrics: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Enable performance metrics
                </span>
              </label>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Agent Summary
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Basic Information</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Name:</dt>
                      <dd className="text-gray-900 dark:text-white">{config.name}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Type:</dt>
                      <dd className="text-gray-900 dark:text-white capitalize">{config.type.replace('-', ' ')}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Model:</dt>
                      <dd className="text-gray-900 dark:text-white">{config.model}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Deployment:</dt>
                      <dd className="text-gray-900 dark:text-white capitalize">{config.deployment}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Configuration</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Temperature:</dt>
                      <dd className="text-gray-900 dark:text-white">{config.temperature}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Max Tokens:</dt>
                      <dd className="text-gray-900 dark:text-white">{config.maxTokens}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Rate Limit:</dt>
                      <dd className="text-gray-900 dark:text-white">{config.rateLimitPerMinute}/min</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">Public:</dt>
                      <dd className="text-gray-900 dark:text-white">{config.isPublic ? 'Yes' : 'No'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              {config.capabilities.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-900 mb-2">Capabilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {config.capabilities.map((capability) => (
                      <span
                        key={capability}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {config.tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {config.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return config.name.trim() && config.description.trim() && config.type;
      case 2:
        return config.model && config.deployment;
      case 3:
      case 4:
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              to="/dashboard/agents"
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Create New Agent
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Step {currentStep} of {steps.length}
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    currentStep > step.id
                      ? 'bg-green-500 border-green-500 text-white'
                      : currentStep === step.id
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500'
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    currentStep >= step.id
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {step.name}
                </span>
                {index < steps.length - 1 && (
                  <div className="w-8 h-px bg-gray-300 dark:bg-gray-600 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex space-x-3">
            {currentStep < steps.length ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!isStepValid()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Saving...
                  </>
                ) : (
                  'Save Agent'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAgent;