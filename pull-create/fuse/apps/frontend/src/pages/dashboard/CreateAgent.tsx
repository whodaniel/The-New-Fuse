// @ts-nocheck
import { Badge } from '@/components/ui/badge';
import {
  GlassCard,
  PremiumButton,
  PremiumInput,
  PremiumTextarea,
  ToggleSwitch,
} from '@/components/ui/premium';
import { useToast } from '@/hooks/useToast';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  Cloud,
  Code,
  Cog,
  Cpu,
  FileText,
  Globe,
  Info,
  Loader2,
  MessageSquare,
  Pencil,
  Rocket,
  Save,
  Sparkles,
  User,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
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

interface Step {
  id: number;
  name: string;
  icon: React.ElementType;
}

interface AgentType {
  id: 'conversational' | 'task-automation' | 'data-analysis' | 'content-generation';
  name: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
}

interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

const CreateAgent: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

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
    timeoutSeconds: 30,
  });

  const steps: Step[] = [
    { id: 1, name: 'Basic Info', icon: Info },
    { id: 2, name: 'Configuration', icon: Cog },
    { id: 3, name: 'Capabilities', icon: Cpu },
    { id: 4, name: 'Advanced', icon: Code },
    { id: 5, name: 'Review', icon: Check },
  ];

  const agentTypes: AgentType[] = [
    {
      id: 'conversational',
      name: 'Conversational',
      description: 'Chat-based agents for customer support, Q&A, and general conversation',
      icon: MessageSquare,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'task-automation',
      name: 'Task Automation',
      description: 'Agents that automate workflows, processes, and repetitive tasks',
      icon: Cog,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      id: 'data-analysis',
      name: 'Data Analysis',
      description: 'Agents specialized in analyzing data, generating reports, and insights',
      icon: BarChart3,
      gradient: 'from-purple-500 to-violet-500',
    },
    {
      id: 'content-generation',
      name: 'Content Generation',
      description: 'Agents for creating content, writing, and creative tasks',
      icon: Pencil,
      gradient: 'from-orange-500 to-amber-500',
    },
  ];

  const availableModels: Model[] = [
    { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', description: 'Most capable model' },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'OpenAI',
      description: 'Fast and efficient',
    },
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      provider: 'Anthropic',
      description: 'Excellent reasoning',
    },
    {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      provider: 'Anthropic',
      description: 'Balanced performance',
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'Google',
      description: 'Multimodal capabilities',
    },
  ];

  const availableCapabilities: string[] = [
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
    'Summarization',
  ];

  const handleCapabilityToggle = (capability: string) => {
    setConfig((prev) => ({
      ...prev,
      capabilities: prev.capabilities.includes(capability)
        ? prev.capabilities.filter((c: string) => c !== capability)
        : [...prev.capabilities, capability],
    }));
  };

  const handleTagAdd = () => {
    const tag = tagInput.trim();
    if (tag && !config.tags.includes(tag)) {
      setConfig((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tag: string) => {
    setConfig((prev) => ({
      ...prev,
      tags: prev.tags.filter((t: string) => t !== tag),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      };

      const createResponse = await fetch('/api/agents', {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include',
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          type: config.type,
          capabilities: config.capabilities,
          systemPrompt: config.systemPrompt,
          configuration: {
            model: config.model,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
            topP: config.topP,
            frequencyPenalty: config.frequencyPenalty,
            presencePenalty: config.presencePenalty,
            isPublic: config.isPublic,
            enableLogging: config.enableLogging,
            enableMetrics: config.enableMetrics,
            rateLimitPerMinute: config.rateLimitPerMinute,
            timeoutSeconds: config.timeoutSeconds,
            tags: config.tags,
          },
        }),
      });

      if (createResponse.ok) {
        const agent = await createResponse.json();
        const deployResponse = await fetch(`/api/agents/${agent.id}/deploy`, {
          method: 'POST',
          headers: authHeaders,
          credentials: 'include',
          body: JSON.stringify({ target: config.deployment }),
        });

        if (!deployResponse.ok) {
          throw new Error('Agent was created but deployment failed');
        }

        toast({
          title: 'Agent Deployed!',
          description: `${config.name} is live via ${config.deployment} orchestration.`,
        });
        navigate(`/dashboard/agents/${agent.id}`);
      } else {
        const errorPayload = await createResponse.text();
        throw new Error(errorPayload || 'Failed to create agent');
      }
    } catch (error) {
      console.error('Failed to create agent:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to deploy agent. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 1:
        return Boolean(config.name.trim() && config.description.trim() && config.type);
      case 2:
        return Boolean(config.model && config.deployment);
      case 3:
      case 4:
      case 5:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Bot className="w-4 h-4 inline mr-2" />
                Agent Name *
              </label>
              <PremiumInput
                type="text"
                value={config.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfig({ ...config, name: e.target.value })
                }
                placeholder="Enter a descriptive name for your agent"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Description *
              </label>
              <PremiumTextarea
                value={config.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setConfig({ ...config, description: e.target.value })
                }
                placeholder="Describe what this agent does and its purpose"
                rows={3}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                <Sparkles className="w-4 h-4 inline mr-2" />
                Agent Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agentTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = config.type === type.id;
                  return (
                    <motion.div
                      key={type.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setConfig({ ...config, type: type.id })}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-white/10 bg-black/20 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-3 rounded-xl bg-gradient-to-br ${type.gradient} bg-opacity-20`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-white">{type.name}</h3>
                          <p className="text-sm text-gray-400 mt-1">{type.description}</p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                <Cpu className="w-4 h-4 inline mr-2" />
                Language Model *
              </label>
              <div className="space-y-3">
                {availableModels.map((model) => {
                  const isSelected = config.model === model.id;
                  return (
                    <motion.div
                      key={model.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setConfig({ ...config, model: model.id })}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-white/10 bg-black/20 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-white">{model.name}</h3>
                          <p className="text-sm text-gray-400">
                            {model.provider} • {model.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                <Globe className="w-4 h-4 inline mr-2" />
                Deployment Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'cloud', icon: Cloud, label: 'Cloud', desc: 'Hosted and managed' },
                  { id: 'local', icon: Cpu, label: 'Local', desc: 'Self-hosted' },
                  { id: 'hybrid', icon: Globe, label: 'Hybrid', desc: 'Mixed deployment' },
                ].map(({ id, icon: Icon, label, desc }) => {
                  const isSelected = config.deployment === id;
                  return (
                    <motion.div
                      key={id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        setConfig({ ...config, deployment: id as 'cloud' | 'local' | 'hybrid' })
                      }
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-white/10 bg-black/20 hover:border-white/20'
                      }`}
                    >
                      <Icon className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                      <h3 className="font-medium text-white">{label}</h3>
                      <p className="text-sm text-gray-400 mt-1">{desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                System Prompt
              </label>
              <PremiumTextarea
                value={config.systemPrompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setConfig({ ...config, systemPrompt: e.target.value })
                }
                placeholder="Define the agent's behavior, personality, and instructions..."
                rows={4}
              />
            </motion.div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Zap className="w-4 h-4 inline mr-2" />
                Agent Capabilities
              </label>
              <p className="text-sm text-gray-400 mb-4">
                Select the capabilities your agent should have access to.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableCapabilities.map((capability) => {
                  const isSelected = config.capabilities.includes(capability);
                  return (
                    <motion.label
                      key={capability}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-white/10 bg-black/20 hover:border-white/20 text-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCapabilityToggle(capability)}
                        className="sr-only"
                      />
                      {isSelected ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <div className="w-4 h-4 rounded border border-white/20" />
                      )}
                      <span className="text-sm">{capability}</span>
                    </motion.label>
                  );
                })}
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {config.tags.map((tag: string) => (
                  <Badge
                    key={tag}
                    className="bg-purple-500/20 text-purple-400 border-purple-500/30 px-3 py-1"
                  >
                    {tag}
                    <button onClick={() => handleTagRemove(tag)} className="ml-2 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <PremiumInput
                  type="text"
                  value={tagInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                  placeholder="Add tags (press Enter)"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTagAdd();
                    }
                  }}
                  className="flex-1"
                />
                <PremiumButton variant="glass" size="sm" onClick={handleTagAdd}>
                  Add
                </PremiumButton>
              </div>
            </motion.div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Temperature: <span className="text-purple-400">{config.temperature}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setConfig({ ...config, temperature: parseFloat(e.target.value) })
                  }
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Focused</span>
                  <span>Creative</span>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Tokens</label>
                <PremiumInput
                  type="number"
                  min={1}
                  max={8192}
                  value={config.maxTokens}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setConfig({ ...config, maxTokens: parseInt(e.target.value) || 2048 })
                  }
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Top P: <span className="text-purple-400">{config.topP}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.topP}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setConfig({ ...config, topP: parseFloat(e.target.value) })
                  }
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rate Limit (per minute)
                </label>
                <PremiumInput
                  type="number"
                  min={1}
                  max={1000}
                  value={config.rateLimitPerMinute}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setConfig({ ...config, rateLimitPerMinute: parseInt(e.target.value) || 60 })
                  }
                />
              </motion.div>
            </div>

            <motion.div variants={itemVariants} className="space-y-4 pt-4">
              <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                <div>
                  <p className="font-medium text-white">Make this agent publicly available</p>
                  <p className="text-sm text-gray-400">Others can discover and use this agent</p>
                </div>
                <ToggleSwitch
                  checked={config.isPublic}
                  onChange={(checked: boolean) => setConfig({ ...config, isPublic: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                <div>
                  <p className="font-medium text-white">Enable conversation logging</p>
                  <p className="text-sm text-gray-400">Store conversation history for analysis</p>
                </div>
                <ToggleSwitch
                  checked={config.enableLogging}
                  onChange={(checked: boolean) => setConfig({ ...config, enableLogging: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                <div>
                  <p className="font-medium text-white">Enable performance metrics</p>
                  <p className="text-sm text-gray-400">Track response times and usage stats</p>
                </div>
                <ToggleSwitch
                  checked={config.enableMetrics}
                  onChange={(checked: boolean) => setConfig({ ...config, enableMetrics: checked })}
                />
              </div>
            </motion.div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <GlassCard gradient="purple">
              <div className="p-4">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-purple-400" />
                  Agent Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-300 mb-3">Basic Information</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Name:</dt>
                        <dd className="text-white font-medium">{config.name || '-'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Type:</dt>
                        <dd className="text-white capitalize">{config.type.replace('-', ' ')}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Model:</dt>
                        <dd className="text-white">{config.model}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Deployment:</dt>
                        <dd className="text-white capitalize">{config.deployment}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-300 mb-3">Configuration</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Temperature:</dt>
                        <dd className="text-white">{config.temperature}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Max Tokens:</dt>
                        <dd className="text-white">{config.maxTokens}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Rate Limit:</dt>
                        <dd className="text-white">{config.rateLimitPerMinute}/min</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Public:</dt>
                        <dd className="text-white">{config.isPublic ? 'Yes' : 'No'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {config.capabilities.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-300 mb-3">Capabilities</h4>
                    <div className="flex flex-wrap gap-2">
                      {config.capabilities.map((capability: string) => (
                        <Badge
                          key={capability}
                          className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        >
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {config.tags.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-300 mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {config.tags.map((tag: string) => (
                        <Badge
                          key={tag}
                          className="bg-purple-500/20 text-purple-400 border-purple-500/30"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <Link
              to="/dashboard/agents"
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 flex items-center gap-2">
                <Bot className="w-8 h-8 text-purple-400" />
                Create New Agent
              </h1>
              <p className="text-gray-400">
                Step {currentStep} of {steps.length}
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <React.Fragment key={step.id}>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : isCurrent
                            ? 'bg-purple-500 border-purple-500 text-white'
                            : 'bg-black/20 border-white/20 text-gray-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span
                      className={`text-sm font-medium whitespace-nowrap ${
                        isCurrent || isCompleted ? 'text-white' : 'text-gray-500'
                      }`}
                    >
                      {step.name}
                    </span>
                  </motion.div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 h-0.5 ${isCompleted ? 'bg-emerald-500' : 'bg-white/10'}`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </motion.div>

        {/* Step Content */}
        <GlassCard className="mb-8">
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </GlassCard>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <PremiumButton
            variant="ghost"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            icon={ArrowLeft}
          >
            Previous
          </PremiumButton>

          <div className="flex gap-3">
            {currentStep < steps.length ? (
              <PremiumButton
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!isStepValid()}
                icon={ArrowRight}
                iconPosition="right"
              >
                Next
              </PremiumButton>
            ) : (
              <PremiumButton
                variant="gradient"
                glow
                onClick={handleSave}
                disabled={saving}
                icon={saving ? Loader2 : Save}
                className={saving ? 'animate-pulse' : ''}
              >
                {saving ? 'Deploying...' : 'Deploy Agent'}
              </PremiumButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAgent;
