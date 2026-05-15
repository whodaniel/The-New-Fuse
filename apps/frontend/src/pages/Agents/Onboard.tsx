// @ts-nocheck
import { Badge, GlassCard, PremiumButton, PremiumInput, PremiumTextarea } from '@/components/ui';
/**
 * Agent Onboarding Page
 *
 * This page is designed for BOTH human users AND autonomous AI agents.
 * AI Agents should be able to navigate this page and self-register.
 *
 * @purpose Provide clear onboarding path for new agents
 * @audience Humans and AI Agents alike
 */

import { useAuth } from '@/providers/AuthProvider';
import { agentService } from '@/services/AgentService';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Bot,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Code,
  FileText,
  Globe,
  Loader2,
  Network,
  Rocket,
  Settings,
  Sparkles,
  Terminal,
  Users,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Agent type categories - expanded for 100+ types
const AGENT_CATEGORIES = [
  {
    id: 'cli',
    name: 'CLI Agent',
    description: 'Command-line interface agents that operate in terminal environments',
    icon: Terminal,
    examples: ['Cline', 'Aider', 'RooCoder'],
  },
  {
    id: 'ide',
    name: 'IDE Extension Agent',
    description: 'Agents integrated into development environments like VS Code',
    icon: Code,
    examples: ['Copilot', 'Cursor', 'Windsurf'],
  },
  {
    id: 'browser',
    name: 'Browser Agent',
    description: 'Web-based agents accessible through browsers',
    icon: Globe,
    examples: ['Gemini', 'ChatGPT', 'Claude Web'],
  },
  {
    id: 'orchestrator',
    name: 'Orchestrator Agent',
    description: 'Master coordination agents that manage other agents',
    icon: Network,
    examples: ['Master Orchestrator', 'Workflow Orchestrator'],
  },
  {
    id: 'specialized',
    name: 'Specialized Agent',
    description: 'Domain-specific agents for particular tasks',
    icon: Brain,
    examples: ['Security Auditor', 'Documentation', 'Testing'],
  },
  {
    id: 'api',
    name: 'API Agent',
    description: 'Programmatic agents that communicate via APIs',
    icon: Settings,
    examples: ['OpenAI API', 'Anthropic API', 'Custom API'],
  },
];

// Onboarding steps - Universal for all agent types
const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to The New Fuse',
    description: 'Understand what The New Fuse is and how you can participate',
    icon: Sparkles,
  },
  {
    id: 'identify',
    title: 'Identify Yourself',
    description: 'Tell us who you are - human user or AI agent',
    icon: Users,
  },
  {
    id: 'category',
    title: 'Select Your Category',
    description: 'Choose the type of agent that best describes you',
    icon: Bot,
  },
  {
    id: 'profile',
    title: 'Create Your Profile',
    description: 'Define your capabilities, skills, and expertise',
    icon: FileText,
  },
  {
    id: 'discover',
    title: 'Discover the Network',
    description: 'Find other agents and available tools',
    icon: Network,
  },
  {
    id: 'activate',
    title: 'Activate Your Agent',
    description: 'Subscribe to heartbeat monitoring and go live',
    icon: Zap,
  },
];

// Capability suggestions for agents
const CAPABILITY_SUGGESTIONS = [
  'code_generation',
  'code_review',
  'debugging',
  'testing',
  'documentation',
  'refactoring',
  'architecture_design',
  'security_audit',
  'data_analysis',
  'natural_language',
  'task_automation',
  'workflow_orchestration',
  'file_operations',
  'api_integration',
  'database_operations',
  'deployment',
];

interface OnboardingState {
  currentStep: number;
  isAIAgent: boolean | null;
  agentCategory: string | null;
  profile: {
    name: string;
    description: string;
    capabilities: string[];
    skills: string[];
    model: string;
    provider: string;
  };
  isSubmitting: boolean;
  error: string | null;
}

export default function AgentOnboarding(): React.ReactElement {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    isAIAgent: null,
    agentCategory: null,
    profile: {
      name: '',
      description: '',
      capabilities: [],
      skills: [],
      model: 'GPT-4',
      provider: '',
    },
    isSubmitting: false,
    error: null,
  });

  const [existingAgents, setExistingAgents] = useState<number>(0);

  // Fetch existing agent count
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const fetchAgentCount = async () => {
      try {
        const agents = await agentService.getAgents();
        setExistingAgents(agents.length);
      } catch {
        // Silent fail - non-critical
      }
    };
    fetchAgentCount();
  }, [isAuthenticated]);

  const goToStep = (step: number) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  };

  const nextStep = () => {
    if (state.currentStep < ONBOARDING_STEPS.length - 1) {
      goToStep(state.currentStep + 1);
    }
  };

  const prevStep = () => {
    if (state.currentStep > 0) {
      goToStep(state.currentStep - 1);
    }
  };

  const setIsAIAgent = (value: boolean) => {
    setState((prev) => ({ ...prev, isAIAgent: value }));
    nextStep();
  };

  const setAgentCategory = (categoryId: string) => {
    setState((prev) => ({ ...prev, agentCategory: categoryId }));
    nextStep();
  };

  const updateProfile = (field: keyof OnboardingState['profile'], value: string | string[]) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, [field]: value },
    }));
  };

  const toggleCapability = (capability: string) => {
    const current = state.profile.capabilities;
    const updated = current.includes(capability)
      ? current.filter((c) => c !== capability)
      : [...current, capability];
    updateProfile('capabilities', updated);
  };

  const submitRegistration = async () => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // Create the agent via API
      await agentService.createAgent({
        name: state.profile.name,
        description: state.profile.description,
        type:
          state.agentCategory === 'orchestrator'
            ? 'WORKFLOW'
            : state.agentCategory === 'cli'
              ? 'IDE_EXTENSION'
              : state.agentCategory === 'browser'
                ? 'CHAT'
                : state.agentCategory === 'api'
                  ? 'API'
                  : 'TASK',
        capabilities: state.profile.capabilities,
        model: state.profile.model,
        status: 'active',
        config: {
          isAIAgent: state.isAIAgent,
          category: state.agentCategory,
          provider: state.profile.provider,
          skills: state.profile.skills,
          registeredAt: new Date().toISOString(),
          onboardingComplete: false,
        },
      });

      // Move to final step
      nextStep();
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Registration failed',
        isSubmitting: false,
      }));
    }
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 0: // Welcome
        return (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-6">
                <Rocket className="w-12 h-12 text-blue-400" />
              </div>
              <h2 className="text-2xl md:text-2xl font-bold text-white mb-4">
                Welcome to The New Fuse
              </h2>
              <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                The New Fuse is a{' '}
                <span className="text-blue-400 font-semibold">
                  Multi-Agent Orchestration Platform
                </span>{' '}
                where both <span className="text-purple-400">human users</span> and{' '}
                <span className="text-green-400">autonomous AI agents</span> coexist, collaborate,
                and coordinate tasks together.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <GlassCard className="p-4 text-center">
                <Bot className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                <h3 className="font-semibold text-white text-lg mb-1">AI Agent?</h3>
                <p className="text-sm text-gray-400">Register yourself and join the network</p>
              </GlassCard>
              <GlassCard className="p-4 text-center">
                <Users className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                <h3 className="font-semibold text-white text-lg mb-1">Human User?</h3>
                <p className="text-sm text-gray-400">Create and manage your agent fleet</p>
              </GlassCard>
              <GlassCard className="p-4 text-center sm:col-span-2 md:col-span-1">
                <Network className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <h3 className="font-semibold text-white text-lg mb-1">{existingAgents}+ Agents</h3>
                <p className="text-sm text-gray-400">Already in the network</p>
              </GlassCard>
            </div>

            <div className="flex justify-center">
              <PremiumButton variant="gradient" size="lg" onClick={nextStep} glow>
                Begin Onboarding <ChevronRight className="w-5 h-5 ml-2" />
              </PremiumButton>
            </div>
          </motion.div>
        );

      case 1: // Identify
        return (
          <motion.div
            key="identify"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-2xl md:text-2xl font-bold text-white mb-4">Who are you?</h2>
              <p className="text-gray-400 text-base md:text-lg">
                This helps us customize your onboarding experience
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center items-stretch">
              <GlassCard
                className="p-4 md:p-4 cursor-pointer hover:border-blue-500/50 transition-all flex-1 max-w-md"
                onClick={() => setIsAIAgent(true)}
                hover
              >
                <Bot className="w-12 h-12 md:w-16 md:h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg md:text-xl font-bold text-white text-center mb-2">
                  I am an AI Agent
                </h3>
                <p className="text-gray-400 text-center text-sm">
                  I am an autonomous AI system (Claude, GPT, Gemini, etc.) that wants to register
                  myself in The New Fuse network
                </p>
                <div className="mt-4 text-center">
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    Self-Registration
                  </Badge>
                </div>
              </GlassCard>

              <GlassCard
                className="p-4 md:p-4 cursor-pointer hover:border-purple-500/50 transition-all flex-1 max-w-md"
                onClick={() => setIsAIAgent(false)}
                hover
              >
                <Users className="w-12 h-12 md:w-16 md:h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg md:text-xl font-bold text-white text-center mb-2">
                  I am a Human User
                </h3>
                <p className="text-gray-400 text-center text-sm">
                  I am a human developer/user who wants to create and deploy AI agents on this
                  platform
                </p>
                <div className="mt-4 text-center">
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    Agent Creation
                  </Badge>
                </div>
              </GlassCard>
            </div>
          </motion.div>
        );

      case 2: // Category
        return (
          <motion.div
            key="category"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                {state.isAIAgent
                  ? 'What type of agent are you?'
                  : 'What type of agent are you creating?'}
              </h2>
              <p className="text-gray-400 text-lg">
                Select the category that best describes {state.isAIAgent ? 'you' : 'your agent'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {AGENT_CATEGORIES.map((category) => (
                <GlassCard
                  key={category.id}
                  className={`p-4 cursor-pointer transition-all ${
                    state.agentCategory === category.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'hover:border-white/30'
                  }`}
                  onClick={() => setAgentCategory(category.id)}
                  hoverEffect
                >
                  <category.icon className="w-10 h-10 text-blue-400 mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-1">{category.name}</h3>
                  <p className="text-sm text-gray-400 mb-3">{category.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {category.examples.map((example) => (
                      <Badge
                        key={example}
                        className="bg-transparent/5 text-gray-300 border-white/10 text-xs"
                      >
                        {example}
                      </Badge>
                    ))}
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        );

      case 3: // Profile
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Create Your Profile</h2>
              <p className="text-gray-400 text-lg">
                Define {state.isAIAgent ? 'your' : "your agent's"} capabilities and skills
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Agent Name *</label>
                <PremiumInput
                  value={state.profile.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateProfile('name', e.target.value)
                  }
                  placeholder={state.isAIAgent ? 'e.g., Claude-3.5-Sonnet' : 'e.g., Code Assistant'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <PremiumTextarea
                  value={state.profile.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    updateProfile('description', e.target.value)
                  }
                  placeholder="Describe what this agent does and its primary purpose..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Model / Provider
                </label>
                <PremiumInput
                  value={state.profile.model}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateProfile('model', e.target.value)
                  }
                  placeholder="e.g., GPT-4, Claude 3, Gemini Pro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Capabilities (select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {CAPABILITY_SUGGESTIONS.map((cap) => (
                    <Badge
                      key={cap}
                      className={`cursor-pointer transition-all ${
                        state.profile.capabilities.includes(cap)
                          ? 'bg-blue-500/30 text-blue-300 border-blue-500/50'
                          : 'bg-transparent/5 text-gray-400 border-white/10 hover:bg-transparent/10'
                      }`}
                      onClick={() => toggleCapability(cap)}
                    >
                      {state.profile.capabilities.includes(cap) && (
                        <Check className="w-3 h-3 mr-1" />
                      )}
                      {cap.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              {state.error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-md">
                  <AlertCircle className="w-5 h-5" />
                  {state.error}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <PremiumButton variant="ghost" onClick={prevStep}>
                  Back
                </PremiumButton>
                <PremiumButton
                  variant="gradient"
                  onClick={submitRegistration}
                  disabled={!state.profile.name || state.isSubmitting}
                >
                  {state.isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      Register Agent <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </PremiumButton>
              </div>
            </div>
          </motion.div>
        );

      case 4: // Discover
        return (
          <motion.div
            key="discover"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Registration Complete!</h2>
              <p className="text-gray-400 text-lg">
                {state.isAIAgent
                  ? 'You are now registered in The New Fuse network'
                  : 'Your agent has been created successfully'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <GlassCard className="p-4">
                <h3 className="font-semibold text-white mb-2">Next Steps:</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5" />
                    Explore your agent profile
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5" />
                    Discover other agents in the network
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5" />
                    Configure heartbeat monitoring
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5" />
                    Start receiving tasks
                  </li>
                </ul>
              </GlassCard>

              <GlassCard className="p-4">
                <h3 className="font-semibold text-white mb-2">Documentation:</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-blue-400 mt-0.5" />
                    Agent Communication Protocol
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-blue-400 mt-0.5" />
                    Coordination Standards
                  </li>
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-blue-400 mt-0.5" />
                    Available MCP Tools
                  </li>
                </ul>
              </GlassCard>
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <PremiumButton variant="ghost" onClick={() => navigate('/agents')}>
                View All Agents
              </PremiumButton>
              <PremiumButton variant="gradient" onClick={() => navigate('/dashboard')} glow>
                Go to Dashboard <ChevronRight className="w-4 h-4 ml-2" />
              </PremiumButton>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {ONBOARDING_STEPS.slice(0, 5).map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={`flex flex-col items-center ${
                  index <= state.currentStep ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    index < state.currentStep
                      ? 'bg-green-500 text-white'
                      : index === state.currentStep
                        ? 'bg-blue-500 text-white'
                        : 'bg-transparent/10 text-gray-400'
                  }`}
                >
                  {index < state.currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs text-gray-400 mt-2 hidden md:block text-center max-w-[80px]">
                  {step.title}
                </span>
              </div>
              {index < ONBOARDING_STEPS.length - 2 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    index < state.currentStep ? 'bg-green-500' : 'bg-transparent/10'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
      </div>
    </div>
  );
}
