// @ts-nocheck
import {
  Badge,
  GlassCard,
  PremiumButton,
  PremiumInput,
  PremiumSelect,
  PremiumTextarea,
  ToggleSwitch,
} from '@/components/ui';
import { AGENT_CATALOG } from '@/data/agentCatalog';
import { useToast } from '@/hooks/useToast';
import { agentService } from '@/services/AgentService';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
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
  Palette,
  Pencil,
  Rocket,
  Save,
  Settings2,
  Sparkles,
  User,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface AgentConfig {
  name: string;
  description: string;
  type: 'conversational' | 'task-automation' | 'data-analysis' | 'content-generation';
  backendTypeOverride: string;
  provider: string;
  model: string;
  fallbackProvider: string;
  fallbackModel: string;
  deployment: 'cloud' | 'local' | 'hybrid';
  capabilities: string[];
  skills: string[];
  tools: string[];
  systemPrompt: string;
  soulPrompt: string;
  avatarUrl: string;
  avatarEmoji: string;
  creator: string;
  communicationStyle: 'formal' | 'balanced' | 'casual';
  personalityTraits: string[];
  expertiseAreas: string[];
  about: string;
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
  version: string;
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
  const location = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [toolInput, setToolInput] = useState('');
  const [traitInput, setTraitInput] = useState('');
  const [expertiseInput, setExpertiseInput] = useState('');
  const [templateCategory, setTemplateCategory] = useState('All');
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const soulFileInputRef = useRef<HTMLInputElement | null>(null);

  const [config, setConfig] = useState<AgentConfig>({
    name: '',
    description: '',
    type: 'conversational',
    backendTypeOverride: '',
    provider: 'openai',
    model: 'gpt-4',
    fallbackProvider: 'anthropic',
    fallbackModel: 'claude-3-sonnet',
    deployment: 'cloud',
    capabilities: [],
    skills: [],
    tools: [],
    systemPrompt: '',
    soulPrompt: '',
    avatarUrl: '',
    avatarEmoji: '🤖',
    creator: '',
    communicationStyle: 'balanced',
    personalityTraits: [],
    expertiseAreas: [],
    about: '',
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
    version: '1.0.0',
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
    'Tool Execution',
    'Workflow Orchestration',
    'RAG Retrieval',
    'Multi-Agent Collaboration',
  ];

  const commonSkills = [
    'reasoning',
    'planning',
    'code-review',
    'prompt-engineering',
    'security-audit',
    'research',
  ];

  const commonTools = [
    'filesystem',
    'terminal',
    'webpilot',
    'github',
    'supabase',
    'notion',
    'linear',
    'slack',
  ];

  const templateCategories = useMemo(() => {
    return ['All', ...Array.from(new Set(AGENT_CATALOG.map((entry) => entry.category))).sort()];
  }, []);

  const filteredTemplates = useMemo(() => {
    const search = templateSearch.trim().toLowerCase();
    return AGENT_CATALOG.filter((entry) => {
      if (templateCategory !== 'All' && entry.category !== templateCategory) return false;
      if (!search) return true;
      const haystack = `${entry.name} ${entry.description} ${entry.tags.join(' ')}`.toLowerCase();
      return haystack.includes(search);
    }).slice(0, 150);
  }, [templateCategory, templateSearch]);

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

  const addUniqueListItem = (
    key: 'skills' | 'tools' | 'personalityTraits' | 'expertiseAreas',
    value: string
  ) => {
    const normalized = value.trim();
    if (!normalized) return;

    setConfig((prev) => {
      const existing = prev[key] || [];
      if (existing.includes(normalized)) return prev;
      return { ...prev, [key]: [...existing, normalized] };
    });
  };

  const removeListItem = (
    key: 'skills' | 'tools' | 'personalityTraits' | 'expertiseAreas',
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((entry: string) => entry !== value),
    }));
  };

  const inferTypeFromTemplate = (template: {
    name: string;
    description: string;
    tags: string[];
  }) => {
    const haystack =
      `${template.name} ${template.description} ${template.tags.join(' ')}`.toLowerCase();
    if (
      haystack.includes('analysis') ||
      haystack.includes('analytics') ||
      haystack.includes('research') ||
      haystack.includes('data')
    ) {
      return 'data-analysis' as const;
    }
    if (
      haystack.includes('automation') ||
      haystack.includes('manager') ||
      haystack.includes('pipeline') ||
      haystack.includes('setup') ||
      haystack.includes('workflow')
    ) {
      return 'task-automation' as const;
    }
    if (
      haystack.includes('writer') ||
      haystack.includes('content') ||
      haystack.includes('video') ||
      haystack.includes('podcast') ||
      haystack.includes('story')
    ) {
      return 'content-generation' as const;
    }
    return 'conversational' as const;
  };

  const applyTemplateFromCatalog = (templateId: string) => {
    if (!templateId) return;
    const template = AGENT_CATALOG.find((entry) => entry.id === templateId);
    if (!template) return;

    const templateType = inferTypeFromTemplate(template);
    const normalizedTags = template.tags.map((tag) => String(tag).trim()).filter(Boolean);
    const templatePrompt = [
      `You are ${template.name}.`,
      template.description,
      normalizedTags.length ? `Core specialties: ${normalizedTags.join(', ')}.` : '',
      'Follow TNF standards, use explicit verification loops, and keep outputs actionable.',
    ]
      .filter(Boolean)
      .join('\n');

    setConfig((prev) => ({
      ...prev,
      name: prev.name || template.name,
      description: prev.description || template.description,
      about: prev.about || template.description,
      type: templateType,
      tags: Array.from(new Set([...(prev.tags || []), ...normalizedTags])),
      skills: Array.from(new Set([...(prev.skills || []), ...normalizedTags])),
      expertiseAreas: Array.from(new Set([...(prev.expertiseAreas || []), ...normalizedTags])),
      systemPrompt: prev.systemPrompt || templatePrompt,
      soulPrompt:
        prev.soulPrompt ||
        `# SOUL\n- Archetype: ${template.name}\n- Category: ${template.category}\n- Mission: ${template.description}`,
    }));
  };

  const applySelectedTemplate = () => {
    applyTemplateFromCatalog(selectedTemplateId);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const templateId = params.get('templateId');
    if (!templateId) return;

    setSelectedTemplateId(templateId);
    applyTemplateFromCatalog(templateId);
  }, [location.search]);

  const mapAgentType = (type: AgentConfig['type']) => {
    switch (type) {
      case 'conversational':
        return 'CHAT';
      case 'task-automation':
        return 'TASK';
      case 'data-analysis':
        return 'ANALYSIS';
      case 'content-generation':
      default:
        return 'ASSISTANT';
    }
  };

  const normalizeCapability = (capability: string) =>
    capability.toUpperCase().replace(/[^A-Z0-9]+/g, '_');

  const exportSoulFile = async () => {
    const soul = config.soulPrompt?.trim();
    if (!soul) {
      toast({
        title: 'No SOUL Content',
        description: 'Add a SOUL prompt before exporting.',
        variant: 'warning',
      });
      return;
    }

    const slug = (config.name || 'agent')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const blob = new Blob([soul], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slug || 'agent'}-SOUL.md`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const importSoulFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setConfig((prev) => ({ ...prev, soulPrompt: text }));
      toast({
        title: 'SOUL Imported',
        description: `Loaded ${file.name}.`,
      });
    } catch {
      toast({
        title: 'Import Failed',
        description: 'Could not read the selected SOUL file.',
        variant: 'destructive',
      });
    } finally {
      if (soulFileInputRef.current) soulFileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const mergedTags = Array.from(
        new Set([...config.tags, ...config.skills, ...config.expertiseAreas])
      );
      const runtimeConfig = {
        llm: {
          primary: {
            provider: config.provider,
            model: config.model,
          },
          fallback: {
            provider: config.fallbackProvider,
            model: config.fallbackModel,
          },
          parameters: {
            temperature: config.temperature,
            maxTokens: config.maxTokens,
            topP: config.topP,
            frequencyPenalty: config.frequencyPenalty,
            presencePenalty: config.presencePenalty,
          },
        },
        deployment: config.deployment,
        tools: config.tools,
        skills: config.skills,
        prompts: {
          system: config.systemPrompt,
          soul: config.soulPrompt,
        },
        traits: {
          communicationStyle: config.communicationStyle,
          personalityTraits: config.personalityTraits,
          expertiseAreas: config.expertiseAreas,
        },
        visibility: {
          isPublic: config.isPublic,
          enableLogging: config.enableLogging,
          enableMetrics: config.enableMetrics,
        },
        limits: {
          rateLimitPerMinute: config.rateLimitPerMinute,
          timeoutSeconds: config.timeoutSeconds,
        },
      };

      const resolvedType = config.backendTypeOverride.trim()
        ? config.backendTypeOverride.trim().toUpperCase()
        : mapAgentType(config.type);

      const created = await agentService.createAgent({
        name: config.name,
        description: config.description,
        type: resolvedType,
        status: 'inactive',
        provider: config.provider,
        model: config.model,
        capabilities: config.capabilities.map(normalizeCapability),
        systemPrompt: config.systemPrompt,
        config: runtimeConfig,
        configuration: runtimeConfig,
        profile: {
          about: config.about || config.description,
          personality: config.personalityTraits.join(', '),
          avatar: config.avatarUrl || undefined,
          emoji: config.avatarEmoji || undefined,
          tags: mergedTags,
          creator: config.creator || undefined,
          version: config.version,
          lastUpdated: new Date().toISOString(),
        },
        metadata: {
          pfpUrl: config.avatarUrl || undefined,
          soulMd: config.soulPrompt || undefined,
          skills: config.skills,
          tools: config.tools,
          tags: mergedTags,
          communicationStyle: config.communicationStyle,
          personalityTraits: config.personalityTraits,
          expertiseAreas: config.expertiseAreas,
          createdBy: config.creator || 'user',
          deployment: config.deployment,
          version: config.version,
        },
      } as any);

      toast({
        title: 'Agent Created',
        description: `${config.name} is ready with full configuration metadata.`,
      });
      navigate(`/agents/${created.id}`);
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
        return Boolean(config.provider && config.model && config.deployment);
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
                      className={`relative p-4 rounded-md border-2 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-white/10 bg-black/20 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-3 rounded-md bg-gradient-to-br ${type.gradient} bg-opacity-20`}
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

            <motion.div variants={itemVariants}>
              <PremiumInput
                label="Backend Type Override (Optional)"
                value={config.backendTypeOverride}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfig({ ...config, backendTypeOverride: e.target.value })
                }
                placeholder="e.g. ORCHESTRATOR, CODE_REVIEWER, BROWSER_GEMINI"
                hint="Use this to target a specific TNF enum type directly."
              />
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="p-4 rounded-md border border-white/10 bg-black/20"
            >
              <h3 className="text-sm font-semibold text-white mb-3">TNF Agent Template Library</h3>
              <p className="text-sm text-gray-400 mb-4">
                Start from an existing TNF definition and auto-hydrate core fields.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <PremiumSelect
                  label="Template Category"
                  value={templateCategory}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setTemplateCategory(e.target.value)
                  }
                  options={templateCategories.map((category) => ({
                    value: category,
                    label: category,
                  }))}
                />
                <PremiumInput
                  label="Search Templates"
                  value={templateSearch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTemplateSearch(e.target.value)
                  }
                  placeholder="Search by name, description, or tags"
                />
              </div>

              <div className="mt-3">
                <PremiumSelect
                  label={`Template (${filteredTemplates.length} shown)`}
                  value={selectedTemplateId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setSelectedTemplateId(e.target.value)
                  }
                  options={filteredTemplates.map((template) => ({
                    value: template.id,
                    label: `${template.name} — ${template.category}`,
                  }))}
                />
              </div>

              <div className="mt-3 flex justify-end">
                <PremiumButton
                  type="button"
                  variant="glass"
                  size="sm"
                  disabled={!selectedTemplateId}
                  onClick={applySelectedTemplate}
                >
                  Apply Template
                </PremiumButton>
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
                      className={`p-4 rounded-md border-2 cursor-pointer transition-all duration-200 ${
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <PremiumSelect
                  label="Primary Provider"
                  value={config.provider}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setConfig({ ...config, provider: e.target.value })
                  }
                  options={[
                    { value: 'openai', label: 'OpenAI' },
                    { value: 'anthropic', label: 'Anthropic' },
                    { value: 'google', label: 'Google' },
                    { value: 'kilocode', label: 'KiloCode' },
                    { value: 'local', label: 'Local Runtime' },
                  ]}
                />
                <PremiumInput
                  label="Model ID"
                  value={config.model}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setConfig({ ...config, model: e.target.value })
                  }
                  placeholder="e.g. gpt-4o-mini, claude-3-5-sonnet"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                <PremiumSelect
                  label="Fallback Provider"
                  value={config.fallbackProvider}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setConfig({ ...config, fallbackProvider: e.target.value })
                  }
                  options={[
                    { value: 'anthropic', label: 'Anthropic' },
                    { value: 'openai', label: 'OpenAI' },
                    { value: 'google', label: 'Google' },
                    { value: 'local', label: 'Local Runtime' },
                  ]}
                />
                <PremiumInput
                  label="Fallback Model"
                  value={config.fallbackModel}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setConfig({ ...config, fallbackModel: e.target.value })
                  }
                  placeholder="e.g. claude-3-haiku"
                />
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
                      className={`p-4 rounded-md border-2 cursor-pointer transition-all text-center ${
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

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Sparkles className="w-4 h-4 inline mr-2" />
                `SOUL.md` Prompt
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                <PremiumButton
                  type="button"
                  variant="glass"
                  size="sm"
                  onClick={() => soulFileInputRef.current?.click()}
                >
                  Import `.md`
                </PremiumButton>
                <PremiumButton type="button" variant="glass" size="sm" onClick={exportSoulFile}>
                  Export `.md`
                </PremiumButton>
                <PremiumButton
                  type="button"
                  variant="glass"
                  size="sm"
                  onClick={async () => {
                    if (!config.soulPrompt?.trim()) return;
                    await navigator.clipboard.writeText(config.soulPrompt);
                    toast({ title: 'Copied', description: 'SOUL prompt copied to clipboard.' });
                  }}
                >
                  Copy
                </PremiumButton>
              </div>
              <PremiumTextarea
                value={config.soulPrompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setConfig({ ...config, soulPrompt: e.target.value })
                }
                placeholder="Optional: long-form soul/persona definition in markdown."
                rows={6}
              />
              <input
                ref={soulFileInputRef}
                type="file"
                accept=".md,text/markdown,text/plain"
                className="hidden"
                onChange={importSoulFile}
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
                      className={`flex items-center gap-2 p-3 rounded-md border cursor-pointer transition-all ${
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Brain className="w-4 h-4 inline mr-2" />
                Skills
              </label>
              <p className="text-sm text-gray-400 mb-3">
                Add reusable agent skills (e.g., `security-audit`, `prompt-engineering`).
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {config.skills.map((skill) => (
                  <Badge
                    key={skill}
                    className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-3 py-1"
                  >
                    {skill}
                    <button
                      onClick={() => removeListItem('skills', skill)}
                      className="ml-2 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {commonSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => addUniqueListItem('skills', skill)}
                    className="text-xs px-2 py-1 rounded border border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <PremiumInput
                  type="text"
                  value={skillInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSkillInput(e.target.value)
                  }
                  placeholder="Add custom skill"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addUniqueListItem('skills', skillInput);
                      setSkillInput('');
                    }
                  }}
                  className="flex-1"
                />
                <PremiumButton
                  type="button"
                  variant="glass"
                  size="sm"
                  onClick={() => {
                    addUniqueListItem('skills', skillInput);
                    setSkillInput('');
                  }}
                >
                  Add
                </PremiumButton>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Wrench className="w-4 h-4 inline mr-2" />
                Tool Access
              </label>
              <p className="text-sm text-gray-400 mb-3">
                Define allowed tools/MCP integrations for this agent.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {config.tools.map((tool) => (
                  <Badge
                    key={tool}
                    className="bg-amber-500/20 text-amber-300 border-amber-500/30 px-3 py-1"
                  >
                    {tool}
                    <button
                      onClick={() => removeListItem('tools', tool)}
                      className="ml-2 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {commonTools.map((tool) => (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => addUniqueListItem('tools', tool)}
                    className="text-xs px-2 py-1 rounded border border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                  >
                    + {tool}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <PremiumInput
                  type="text"
                  value={toolInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setToolInput(e.target.value)
                  }
                  placeholder="Add custom tool ID"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addUniqueListItem('tools', toolInput);
                      setToolInput('');
                    }
                  }}
                  className="flex-1"
                />
                <PremiumButton
                  type="button"
                  variant="glass"
                  size="sm"
                  onClick={() => {
                    addUniqueListItem('tools', toolInput);
                    setToolInput('');
                  }}
                >
                  Add
                </PremiumButton>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full h-2 bg-transparent/10 rounded-md appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
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
                  className="w-full h-2 bg-transparent/10 rounded-md appearance-none cursor-pointer accent-purple-500"
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

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PremiumInput
                label="Avatar URL (PFP)"
                value={config.avatarUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfig({ ...config, avatarUrl: e.target.value })
                }
                placeholder="https://..."
              />
              <PremiumInput
                label="Avatar Emoji"
                value={config.avatarEmoji}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfig({ ...config, avatarEmoji: e.target.value })
                }
                placeholder="🤖"
              />
              <PremiumInput
                label="Creator / Owner"
                value={config.creator}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfig({ ...config, creator: e.target.value })
                }
                placeholder="Name or team"
              />
              <PremiumSelect
                label="Communication Style"
                value={config.communicationStyle}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setConfig({
                    ...config,
                    communicationStyle: e.target.value as AgentConfig['communicationStyle'],
                  })
                }
                options={[
                  { value: 'formal', label: 'Formal' },
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'casual', label: 'Casual' },
                ]}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <PremiumTextarea
                label="About / Profile Summary"
                value={config.about}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setConfig({ ...config, about: e.target.value })
                }
                placeholder="Public-facing summary for this agent profile."
                rows={3}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Palette className="w-4 h-4 inline mr-2" />
                Personality Traits
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {config.personalityTraits.map((trait) => (
                  <Badge
                    key={trait}
                    className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30 px-3 py-1"
                  >
                    {trait}
                    <button
                      onClick={() => removeListItem('personalityTraits', trait)}
                      className="ml-2 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <PremiumInput
                  value={traitInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTraitInput(e.target.value)
                  }
                  placeholder="e.g. rigorous, curious, concise"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addUniqueListItem('personalityTraits', traitInput);
                      setTraitInput('');
                    }
                  }}
                />
                <PremiumButton
                  type="button"
                  variant="glass"
                  size="sm"
                  onClick={() => {
                    addUniqueListItem('personalityTraits', traitInput);
                    setTraitInput('');
                  }}
                >
                  Add
                </PremiumButton>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Settings2 className="w-4 h-4 inline mr-2" />
                Expertise Areas
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {config.expertiseAreas.map((area) => (
                  <Badge
                    key={area}
                    className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 px-3 py-1"
                  >
                    {area}
                    <button
                      onClick={() => removeListItem('expertiseAreas', area)}
                      className="ml-2 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <PremiumInput
                  value={expertiseInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setExpertiseInput(e.target.value)
                  }
                  placeholder="e.g. orchestration, RAG, frontend"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addUniqueListItem('expertiseAreas', expertiseInput);
                      setExpertiseInput('');
                    }
                  }}
                />
                <PremiumButton
                  type="button"
                  variant="glass"
                  size="sm"
                  onClick={() => {
                    addUniqueListItem('expertiseAreas', expertiseInput);
                    setExpertiseInput('');
                  }}
                >
                  Add
                </PremiumButton>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4 pt-4">
              <div className="flex items-center justify-between p-4 bg-black/20 rounded-md border border-white/10">
                <div>
                  <p className="font-medium text-white">Make this agent publicly available</p>
                  <p className="text-sm text-gray-400">Others can discover and use this agent</p>
                </div>
                <ToggleSwitch
                  checked={config.isPublic}
                  onChange={(checked: boolean) => setConfig({ ...config, isPublic: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-md border border-white/10">
                <div>
                  <p className="font-medium text-white">Enable conversation logging</p>
                  <p className="text-sm text-gray-400">Store conversation history for analysis</p>
                </div>
                <ToggleSwitch
                  checked={config.enableLogging}
                  onChange={(checked: boolean) => setConfig({ ...config, enableLogging: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-md border border-white/10">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-300 mb-3">Basic Information</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Name:</dt>
                        <dd className="text-white font-medium">{config.name || '-'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Type:</dt>
                        <dd className="text-white capitalize">{config.type.replace('-', ' ')}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Persisted Type:</dt>
                        <dd className="text-white">
                          {config.backendTypeOverride.trim()
                            ? config.backendTypeOverride.trim().toUpperCase()
                            : mapAgentType(config.type)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Model:</dt>
                        <dd className="text-white">{config.model}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Provider:</dt>
                        <dd className="text-white">{config.provider}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Deployment:</dt>
                        <dd className="text-white capitalize">{config.deployment}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-300 mb-3">Configuration</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Temperature:</dt>
                        <dd className="text-white">{config.temperature}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Max Tokens:</dt>
                        <dd className="text-white">{config.maxTokens}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Rate Limit:</dt>
                        <dd className="text-white">{config.rateLimitPerMinute}/min</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Public:</dt>
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

                {config.skills.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-300 mb-3">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {config.skills.map((skill: string) => (
                        <Badge
                          key={skill}
                          className="bg-blue-500/20 text-blue-300 border-blue-500/30"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {config.tools.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-300 mb-3">Tool Access</h4>
                    <div className="flex flex-wrap gap-2">
                      {config.tools.map((tool: string) => (
                        <Badge
                          key={tool}
                          className="bg-amber-500/20 text-amber-300 border-amber-500/30"
                        >
                          {tool}
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

                {(config.avatarUrl || config.avatarEmoji || config.about) && (
                  <div className="mt-4 space-y-2 text-sm">
                    <h4 className="font-medium text-gray-300">Profile</h4>
                    {config.avatarUrl && (
                      <div className="text-gray-300">
                        Avatar URL: <span className="text-white break-all">{config.avatarUrl}</span>
                      </div>
                    )}
                    {config.avatarEmoji && (
                      <div className="text-gray-300">
                        Avatar Emoji: <span className="text-white">{config.avatarEmoji}</span>
                      </div>
                    )}
                    {config.about && (
                      <div className="text-gray-300">
                        About: <span className="text-white">{config.about}</span>
                      </div>
                    )}
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

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-3 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <Link
              to="/agents"
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-transparent/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 flex items-center gap-2">
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
                            : 'bg-black/20 border-white/20 text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span
                      className={`text-sm font-medium whitespace-nowrap ${
                        isCurrent || isCompleted ? 'text-white' : 'text-muted-foreground'
                      }`}
                    >
                      {step.name}
                    </span>
                  </motion.div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 h-0.5 ${isCompleted ? 'bg-emerald-500' : 'bg-transparent/10'}`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </motion.div>

        {/* Step Content */}
        <GlassCard className="mb-8">
          <div className="p-4">
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
