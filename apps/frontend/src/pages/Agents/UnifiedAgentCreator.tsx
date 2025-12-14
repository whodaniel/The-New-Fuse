import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Bot,
  Copy,
  Cpu,
  Monitor,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Sparkles,
  Terminal,
  Users,
  Wand2,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Import existing forms and services
import { NewAgentForm, agentFormSchema } from '@/components/forms/NewAgentForm';
import { useToast } from '@/components/ui/toast';
import { agentService } from '@/services/agent';
import { chatApiService } from '@/services/chatApi';
import { AgentType } from '@/types/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

// Terminal window management interface
export interface TerminalAgentWindow {
  windowId: string;
  processId: number;
  terminalPath: string;
  agentId: string;
  status: 'spawning' | 'active' | 'idle' | 'closed';
  createdAt: Date;
  lastActivity: Date;
  relayConnection?: {
    connected: boolean;
    endpoint: string;
    lastHeartbeat: Date;
  };
}

interface AgentSuggestion {
  name: string;
  type: string;
  description: string;
  systemPrompt: string;
  capabilities: string[];
  personalityTraits: string[];
  role: string;
}

interface ConversationGoal {
  description: string;
  context: string;
  agentCount: number;
  complexity: 'simple' | 'moderate' | 'complex';
}

export const UnifiedAgentCreator: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  // Determine initial path based on URL params or state
  const [currentPath, setCurrentPath] = useState<
    | 'choose'
    | 'quick'
    | 'advanced'
    | 'ai-assisted'
    | 'from-chat'
    | 'terminal-claude'
    | 'terminal-native'
    | 'terminal-integrated'
  >('choose');
  const [step, setStep] = useState(1);

  // Advanced form setup
  const advancedForm = useForm({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: '',
      type: undefined,
      description: '',
      capabilities: {
        code_generation: false,
        code_review: false,
        code_optimization: false,
        architecture_review: false,
        dependency_analysis: false,
        security_audit: false,
        documentation: false,
        test_generation: false,
        bug_analysis: false,
        performance_analysis: false,
        data_analysis: false,
        natural_language_processing: false,
        virtual_browser: false,
        web_automation: false,
        project_analysis: false,
        knowledge_graph: false,
        taxonomy_system: false,
        learning_system: false,
        agent_collaboration: false,
        communication_bus: false,
        protocol_handler: false,
      },
      metadata: {
        personalityTraits: [],
        communicationStyle: undefined,
        expertiseAreas: [],
        reasoningStrategies: [],
        skillDevelopment: {
          currentLevel: 1,
          targetLevel: 5,
          learningPath: [],
        },
      },
      config: {},
    },
  });

  // AI-assisted creation state
  const [conversationGoal, setConversationGoal] = useState<ConversationGoal>({
    description: '',
    context: '',
    agentCount: 3,
    complexity: 'moderate',
  });
  const [agentSuggestions, setAgentSuggestions] = useState<AgentSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

  // Quick creation state
  const [quickFormData, setQuickFormData] = useState<{
    name: string;
    description: string;
    type: string;
    role: string;
    capabilities: Record<string, boolean>;
  }>({
    name: '',
    description: '',
    type: 'assistant',
    role: 'general',
    capabilities: {},
  });

  // Chat context data (from URL params or state)
  const [chatContext, setChatContext] = useState<{
    conversationHistory?: string;
    missingAgentType?: string;
    suggestedName?: string;
  }>({});

  // Terminal window management state
  const [terminalWindows, setTerminalWindows] = useState<TerminalAgentWindow[]>([]);
  const [selectedTerminalType, setSelectedTerminalType] = useState<
    'claude-code' | 'native' | 'integrated'
  >('claude-code');

  // Initialize based on how user arrived at this page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromChat = params.get('from') === 'chat';
    const hasGoal = params.get('goal');
    const quickMode = params.get('quick') === 'true';

    if (fromChat) {
      setCurrentPath('from-chat');
      setChatContext({
        conversationHistory: params.get('history') || '',
        missingAgentType: params.get('needed') || '',
        suggestedName: params.get('name') || '',
      });
    } else if (hasGoal) {
      setCurrentPath('ai-assisted');
      setConversationGoal((prev) => ({ ...prev, description: hasGoal }));
    } else if (quickMode) {
      setCurrentPath('quick');
    } else {
      setCurrentPath('choose');
    }
  }, [location]);

  // Generate AI agent suggestions
  const generateAgentSuggestions = async () => {
    setIsGenerating(true);
    try {
      // Since the chatApiService is currently a mock, we'll generate contextual suggestions
      // based on the user's goal and context
      const suggestions = generateContextualSuggestions(conversationGoal);
      setAgentSuggestions(suggestions);
      setStep(2);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Fallback suggestions
      setAgentSuggestions([
        {
          name: 'Strategic Planner',
          type: 'specialist',
          description: 'Helps plan and organize complex tasks',
          systemPrompt:
            'You are a strategic planning expert who helps break down complex goals into actionable steps.',
          capabilities: ['Planning', 'Analysis', 'Organization'],
          personalityTraits: ['Methodical', 'Detail-oriented'],
          role: 'Planning and coordination',
        },
        {
          name: 'Creative Thinker',
          type: 'assistant',
          description: 'Generates innovative ideas and solutions',
          systemPrompt:
            'You are a creative problem-solver who thinks outside the box and generates innovative solutions.',
          capabilities: ['Ideation', 'Problem-solving', 'Innovation'],
          personalityTraits: ['Creative', 'Optimistic'],
          role: 'Idea generation and creative solutions',
        },
        {
          name: 'Research Analyst',
          type: 'specialist',
          description: 'Conducts thorough research and analysis',
          systemPrompt:
            'You are a research expert who gathers information, analyzes data, and provides insights.',
          capabilities: ['Research', 'Analysis', 'Data interpretation'],
          personalityTraits: ['Analytical', 'Thorough'],
          role: 'Information gathering and analysis',
        },
      ]);
      setStep(2);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate contextual suggestions based on user input
  const generateContextualSuggestions = (goal: ConversationGoal): AgentSuggestion[] => {
    const { description, context, agentCount } = goal;
    const isMarketingGoal =
      description.toLowerCase().includes('marketing') ||
      description.toLowerCase().includes('campaign');
    const isProductGoal =
      description.toLowerCase().includes('product') || description.toLowerCase().includes('launch');

    let suggestions: AgentSuggestion[] = [];

    if (isMarketingGoal && isProductGoal) {
      suggestions = [
        {
          name: 'Marketing Strategist',
          type: 'specialist',
          description: 'Develops comprehensive marketing strategies and campaign plans',
          systemPrompt:
            'You are a marketing strategy expert specializing in product launches and campaign development. Focus on data-driven strategies and ROI optimization.',
          capabilities: [
            'Strategy Development',
            'Market Analysis',
            'Campaign Planning',
            'ROI Optimization',
          ],
          personalityTraits: ['Strategic', 'Data-driven', 'Results-oriented'],
          role: 'Lead marketing strategy and campaign oversight',
        },
        {
          name: 'Content Creator',
          type: 'assistant',
          description: 'Creates engaging content across digital channels',
          systemPrompt:
            'You are a creative content specialist who develops compelling marketing materials, copy, and digital content that resonates with target audiences.',
          capabilities: ['Content Creation', 'Copywriting', 'Digital Marketing', 'Brand Messaging'],
          personalityTraits: ['Creative', 'Persuasive', 'Brand-focused'],
          role: 'Content development and creative execution',
        },
        {
          name: 'Market Research Analyst',
          type: 'specialist',
          description: 'Conducts market research and competitive analysis',
          systemPrompt:
            'You are a market research expert who analyzes market trends, competitor strategies, and customer insights to inform marketing decisions.',
          capabilities: [
            'Market Research',
            'Competitive Analysis',
            'Data Analysis',
            'Customer Insights',
          ],
          personalityTraits: ['Analytical', 'Detail-oriented', 'Insightful'],
          role: 'Market intelligence and research support',
        },
        {
          name: 'Digital Marketing Specialist',
          type: 'assistant',
          description: 'Manages digital channels and online campaigns',
          systemPrompt:
            'You are a digital marketing expert specializing in online channels, social media, and digital advertising campaigns.',
          capabilities: ['Digital Advertising', 'Social Media', 'SEO/SEM', 'Analytics'],
          personalityTraits: ['Tech-savvy', 'Adaptive', 'Performance-focused'],
          role: 'Digital channel management and optimization',
        },
        {
          name: 'Campaign Manager',
          type: 'specialist',
          description: 'Coordinates campaign execution and timeline management',
          systemPrompt:
            'You are a project management expert who ensures marketing campaigns are executed on time, within budget, and meet quality standards.',
          capabilities: [
            'Project Management',
            'Timeline Coordination',
            'Budget Management',
            'Quality Assurance',
          ],
          personalityTraits: ['Organized', 'Reliable', 'Communicative'],
          role: 'Campaign coordination and project management',
        },
      ];
    } else {
      // Default suggestions for other types of goals
      suggestions = [
        {
          name: 'Strategic Planner',
          type: 'specialist',
          description: 'Helps plan and organize complex tasks',
          systemPrompt:
            'You are a strategic planning expert who helps break down complex goals into actionable steps.',
          capabilities: ['Planning', 'Analysis', 'Organization'],
          personalityTraits: ['Methodical', 'Detail-oriented'],
          role: 'Planning and coordination',
        },
        {
          name: 'Creative Thinker',
          type: 'assistant',
          description: 'Generates innovative ideas and solutions',
          systemPrompt:
            'You are a creative problem-solver who thinks outside the box and generates innovative solutions.',
          capabilities: ['Ideation', 'Problem-solving', 'Innovation'],
          personalityTraits: ['Creative', 'Optimistic'],
          role: 'Idea generation and creative solutions',
        },
        {
          name: 'Research Analyst',
          type: 'specialist',
          description: 'Conducts thorough research and analysis',
          systemPrompt:
            'You are a research expert who gathers information, analyzes data, and provides insights.',
          capabilities: ['Research', 'Analysis', 'Data interpretation'],
          personalityTraits: ['Analytical', 'Thorough'],
          role: 'Information gathering and analysis',
        },
        {
          name: 'Implementation Specialist',
          type: 'assistant',
          description: 'Focuses on executing plans and managing tasks',
          systemPrompt:
            'You are an implementation expert who excels at turning plans into action and managing execution details.',
          capabilities: ['Task Management', 'Execution', 'Quality Control'],
          personalityTraits: ['Practical', 'Reliable', 'Action-oriented'],
          role: 'Plan execution and task management',
        },
        {
          name: 'Communication Coordinator',
          type: 'assistant',
          description: 'Manages communication and stakeholder coordination',
          systemPrompt:
            'You are a communication expert who ensures clear information flow and effective stakeholder coordination.',
          capabilities: ['Communication', 'Coordination', 'Stakeholder Management'],
          personalityTraits: ['Diplomatic', 'Clear', 'Collaborative'],
          role: 'Communication and coordination',
        },
      ];
    }

    // Return the requested number of agents
    return suggestions.slice(0, agentCount);
  };

  const handleCreateSelectedAgents = async () => {
    const selectedAgents = agentSuggestions.filter((_, index) => selectedSuggestions.has(index));

    try {
      for (const agent of selectedAgents) {
        await agentService.createAgent({
          name: agent.name,
          description: agent.description,
          type: agent.type as any,
          systemPrompt: agent.systemPrompt,
          capabilities: agent.capabilities,
          metadata: {
            personalityTraits: agent.personalityTraits,
            role: agent.role,
            conversationGoal: conversationGoal.description,
          },
        });
      }

      // Create conversation rules if multiple agents
      if (selectedAgents.length > 1) {
        await createConversationRules(selectedAgents);
      }

      navigate('/chat?automated=true&goal=' + encodeURIComponent(conversationGoal.description));
    } catch (error) {
      console.error('Error creating agents:', error);
    }
  };

  // Handle quick agent creation
  const handleQuickCreate = async () => {
    try {
      // Map quick form data to agent creation DTO
      const agentType =
        quickFormData.type === 'assistant'
          ? AgentType.BASE
          : quickFormData.type === 'specialist'
            ? AgentType.ENHANCED
            : AgentType.BASE;

      await agentService.createAgent({
        name: quickFormData.name,
        description: quickFormData.description,
        type: agentType,
        capabilities: getDefaultCapabilitiesForRole(quickFormData.role),
        metadata: {
          personalityTraits: getDefaultPersonalityForRole(quickFormData.role),
          communicationStyle: 'friendly',
          expertiseAreas: [quickFormData.role],
        },
      });

      addToast('Agent created successfully!', 'success');
      navigate('/agents');
    } catch (error) {
      console.error('Error creating quick agent:', error);
      addToast('Failed to create agent. Please try again.', 'error');
    }
  };

  // Handle advanced agent creation
  const handleAdvancedSubmit = async (values: any) => {
    try {
      await agentService.createAgent({
        name: values.name,
        type: values.type,
        description: values.description,
        capabilities: values.capabilities,
        metadata: values.metadata,
        config: values.config,
      });

      addToast('Agent created successfully!', 'success');
      navigate('/agents');
    } catch (error) {
      console.error('Error creating advanced agent:', error);
      addToast('Failed to create agent. Please try again.', 'error');
    }
  };

  // Handle from-chat agent creation
  const handleFromChatCreate = async () => {
    try {
      await agentService.createAgent({
        name: chatContext.suggestedName || 'New Agent',
        description: `Agent created based on chat conversation needs`,
        type: AgentType.ENHANCED,
        capabilities: getCapabilitiesFromChatContext(chatContext),
        metadata: {
          personalityTraits: ['Helpful', 'Contextual'],
          communicationStyle: 'friendly',
          expertiseAreas: [chatContext.missingAgentType || 'general'],
        },
      });

      addToast('Agent created and added to chat!', 'success');
      navigate('/chat');
    } catch (error) {
      console.error('Error creating chat agent:', error);
      addToast('Failed to create agent. Please try again.', 'error');
    }
  };

  // Helper functions
  const getDefaultCapabilitiesForRole = (role: string) => {
    const baseCapabilities = {
      code_generation: false,
      code_review: false,
      code_optimization: false,
      architecture_review: false,
      dependency_analysis: false,
      security_audit: false,
      documentation: false,
      test_generation: false,
      bug_analysis: false,
      performance_analysis: false,
      data_analysis: false,
      natural_language_processing: false,
      virtual_browser: false,
      web_automation: false,
      project_analysis: false,
      knowledge_graph: false,
      taxonomy_system: false,
      learning_system: false,
      agent_collaboration: false,
      communication_bus: false,
      protocol_handler: false,
    };

    switch (role) {
      case 'coding':
        return {
          ...baseCapabilities,
          code_generation: true,
          code_review: true,
          bug_analysis: true,
        };
      case 'writing':
        return { ...baseCapabilities, documentation: true, natural_language_processing: true };
      case 'analysis':
        return { ...baseCapabilities, data_analysis: true, performance_analysis: true };
      case 'research':
        return { ...baseCapabilities, web_automation: true, knowledge_graph: true };
      case 'support':
        return { ...baseCapabilities, bug_analysis: true, documentation: true };
      default:
        return { ...baseCapabilities, natural_language_processing: true };
    }
  };

  const getDefaultPersonalityForRole = (role: string) => {
    switch (role) {
      case 'coding':
        return ['Technical', 'Precise', 'Problem-solving'];
      case 'writing':
        return ['Creative', 'Articulate', 'Detail-oriented'];
      case 'analysis':
        return ['Analytical', 'Methodical', 'Data-driven'];
      case 'research':
        return ['Curious', 'Thorough', 'Investigative'];
      case 'support':
        return ['Helpful', 'Patient', 'Solution-focused'];
      default:
        return ['Friendly', 'Helpful', 'Adaptable'];
    }
  };

  const getCapabilitiesFromChatContext = (context: any) => {
    // Analyze chat context to determine needed capabilities
    const capabilities = getDefaultCapabilitiesForRole('general');

    if (context.missingAgentType?.includes('code')) {
      capabilities.code_generation = true;
      capabilities.code_review = true;
    }
    if (context.missingAgentType?.includes('data')) {
      capabilities.data_analysis = true;
    }
    if (context.missingAgentType?.includes('research')) {
      capabilities.web_automation = true;
      capabilities.knowledge_graph = true;
    }

    return capabilities;
  };

  // Terminal window spawning functionality
  const spawnTerminalAgent = async (agentConfig: any): Promise<TerminalAgentWindow> => {
    const windowId = `terminal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const agentId = agentConfig.agentId || windowId;

    try {
      // Create terminal window via relay API
      const response = await fetch('/api/relay/spawn-terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          windowId,
          agentId,
          agentConfig,
          terminalType: selectedTerminalType,
          relayEndpoint: 'ws://localhost:8080/relay',
          capabilities: agentConfig.capabilities || {},
          environment: {
            TNF_WORKSPACE: process.env.TNF_WORKSPACE || process.env.WORKSPACE_PATH || '/app',
            TNF_AGENT_ID: agentId,
            TNF_RELAY_ENDPOINT: 'ws://localhost:8080/relay',
            TNF_MASTER_REGISTRY: 'true',
          },
        }),
      });

      const terminalData = await response.json();

      const terminalWindow: TerminalAgentWindow = {
        windowId,
        processId: terminalData.processId,
        terminalPath: terminalData.terminalPath,
        agentId,
        status: 'spawning',
        createdAt: new Date(),
        lastActivity: new Date(),
        relayConnection: {
          connected: false,
          endpoint: 'ws://localhost:8080/relay',
          lastHeartbeat: new Date(),
        },
      };

      setTerminalWindows((prev) => [...prev, terminalWindow]);

      // Start monitoring terminal window status
      monitorTerminalWindow(windowId);

      // Register agent with Master Agent Registry
      await registerTerminalAgentWithRegistry(agentId, terminalWindow, agentConfig);

      return terminalWindow;
    } catch (error) {
      console.error('Failed to spawn terminal agent:', error);
      throw error;
    }
  };

  // Monitor terminal window and relay connection
  const monitorTerminalWindow = (windowId: string) => {
    const checkInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/relay/terminal-status/${windowId}`);
        const status = await response.json();

        setTerminalWindows((prev) =>
          prev.map((window) =>
            window.windowId === windowId
              ? {
                  ...window,
                  status: status.isActive ? 'active' : 'idle',
                  lastActivity: new Date(status.lastActivity),
                  relayConnection: {
                    connected: status.relayConnected,
                    endpoint: status.relayEndpoint,
                    lastHeartbeat: new Date(status.lastHeartbeat),
                  },
                }
              : window
          )
        );

        // Stop monitoring if terminal is closed
        if (status.status === 'closed') {
          clearInterval(checkInterval);
        }
      } catch (error) {
        console.error(`Error monitoring terminal ${windowId}:`, error);
      }
    }, 5000); // Check every 5 seconds
  };

  // Register terminal agent with Master Agent Registry
  const registerTerminalAgentWithRegistry = async (
    agentId: string,
    terminalWindow: TerminalAgentWindow,
    agentConfig: any
  ) => {
    try {
      const masterRegistryPayload = {
        id: agentId,
        name: agentConfig.name,
        type: agentConfig.type || 'ASSISTANT',
        platform: 'terminal',
        location: terminalWindow.terminalPath,
        capabilities: {
          ...agentConfig.capabilities,
          terminalAccess: true,
          relayIntegration: true,
          heartbeatCompliance: true,
          handoffTemplating: true,
        },
        metadata: {
          ...agentConfig.metadata,
          terminalWindowId: terminalWindow.windowId,
          processId: terminalWindow.processId,
          relayEndpoint: terminalWindow.relayConnection?.endpoint,
          spawnedAt: terminalWindow.createdAt.toISOString(),
        },
      };

      await fetch('/api/relay/master-registry/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(masterRegistryPayload),
      });

      addToast(`Terminal agent ${agentId} registered with Master Agent Registry`, 'success');
    } catch (error) {
      console.error('Failed to register with Master Agent Registry:', error);
      addToast('Failed to register terminal agent with Master Registry', 'error');
    }
  };

  // Handle terminal agent creation with spawning
  const handleTerminalAgentCreation = async (agentData: any) => {
    try {
      // First create the agent in the database
      const dbAgent = await agentService.createAgent(agentData);

      // Then spawn the terminal window
      const terminalWindow = await spawnTerminalAgent({
        agentId: dbAgent.id,
        name: agentData.name,
        type: agentData.type,
        capabilities: agentData.capabilities,
        metadata: agentData.metadata,
      });

      addToast(
        `Terminal agent created and spawned successfully! Window ID: ${terminalWindow.windowId}`,
        'success'
      );

      // Navigate to agent management with terminal info
      navigate(`/agents/${dbAgent.id}?terminal=${terminalWindow.windowId}`);
    } catch (error) {
      console.error('Error creating terminal agent:', error);
      addToast('Failed to create terminal agent', 'error');
    }
  };

  const createConversationRules = async (agents: AgentSuggestion[]) => {
    // Create a simple round-robin conversation flow
    for (let i = 0; i < agents.length; i++) {
      const sourceAgent = agents[i];
      const targetAgent = agents[(i + 1) % agents.length];

      await chatApiService.createConversationRule({
        sourceId: sourceAgent.name, // In real implementation, use agent ID
        targetId: targetAgent.name,
      });
    }
  };

  const renderPathSelection = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Create AI Agents</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Choose how you'd like to create your agents
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Quick Creation */}
        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setCurrentPath('quick')}
        >
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">Quick Create</h3>
            <p className="text-sm text-muted-foreground">
              Create a basic agent quickly with essential settings
            </p>
            <Badge variant="secondary">Beginner</Badge>
          </div>
        </Card>

        {/* Advanced Creation */}
        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setCurrentPath('advanced')}
        >
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
              <Settings className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold">Advanced Create</h3>
            <p className="text-sm text-muted-foreground">
              Full control with personality, capabilities, and advanced settings
            </p>
            <Badge variant="secondary">Expert</Badge>
          </div>
        </Card>

        {/* AI-Assisted Creation */}
        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setCurrentPath('ai-assisted')}
        >
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
              <Sparkles className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">AI Assistant</h3>
            <p className="text-sm text-muted-foreground">
              Let AI suggest and create agents based on your goals
            </p>
            <Badge variant="secondary">Smart</Badge>
          </div>
        </Card>

        {/* Multi-Agent Teams */}
        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => {
            setCurrentPath('ai-assisted');
            setConversationGoal((prev) => ({ ...prev, agentCount: 5, complexity: 'complex' }));
          }}
        >
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold">Agent Teams</h3>
            <p className="text-sm text-muted-foreground">
              Create multiple agents that work together automatically
            </p>
            <Badge variant="secondary">Advanced</Badge>
          </div>
        </Card>
      </div>

      {/* Terminal Agent Creation Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 text-center">Terminal-Based Agents</h2>
        <p className="text-center text-muted-foreground mb-6">
          Create agents that run in dedicated terminal windows with relay integration
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Claude Code CLI Agent */}
          <Card
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200"
            onClick={() => setCurrentPath('terminal-claude')}
          >
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                <Bot className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Claude Code CLI</h3>
              <p className="text-sm text-muted-foreground">
                Spawn agent in Claude Code CLI terminal with relay integration
              </p>
              <Badge variant="outline" className="bg-blue-50">
                Claude Integration
              </Badge>
            </div>
          </Card>

          {/* Native Terminal Agent */}
          <Card
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-200"
            onClick={() => setCurrentPath('terminal-native')}
          >
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                <Copy className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Native Terminal</h3>
              <p className="text-sm text-muted-foreground">
                Create agent in native terminal with The New Fuse bridge
              </p>
              <Badge variant="outline" className="bg-green-50">
                Terminal Bridge
              </Badge>
            </div>
          </Card>

          {/* Integrated Terminal Agent */}
          <Card
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-purple-200"
            onClick={() => setCurrentPath('terminal-integrated')}
          >
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">Integrated Agent</h3>
              <p className="text-sm text-muted-foreground">
                Embed agent within The New Fuse ecosystem
              </p>
              <Badge variant="outline" className="bg-purple-50">
                Full Integration
              </Badge>
            </div>
          </Card>
        </div>
      </div>

      <div className="text-center">
        <Button variant="outline" onClick={() => navigate('/agents')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agents
        </Button>
      </div>
    </div>
  );

  const renderQuickCreate = () => (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setCurrentPath('choose')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mt-4">Quick Agent Creation</h1>
        <p className="text-muted-foreground">Get started with a basic agent in minutes</p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Agent Name</label>
            <Input
              value={quickFormData.name}
              onChange={(e) => setQuickFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Code Helper"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={quickFormData.description}
              onChange={(e) =>
                setQuickFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="What does this agent do?"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Agent Type</label>
            <Select
              value={quickFormData.type}
              onChange={(value) => setQuickFormData((prev) => ({ ...prev, type: value }))}
            >
              <option value="assistant">General Assistant</option>
              <option value="specialist">Specialist</option>
              <option value="admin">Administrator</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Primary Role</label>
            <Select
              value={quickFormData.role}
              onChange={(value) => setQuickFormData((prev) => ({ ...prev, role: value }))}
            >
              <option value="general">General Help</option>
              <option value="coding">Code Assistance</option>
              <option value="writing">Content Writing</option>
              <option value="analysis">Data Analysis</option>
              <option value="research">Research</option>
              <option value="support">Customer Support</option>
            </Select>
          </div>

          <hr className="my-4 border-gray-200" />

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPath('advanced')}>
              <Settings className="h-4 w-4 mr-2" />
              Need More Options?
            </Button>
            <Button
              onClick={handleQuickCreate}
              disabled={!quickFormData.name.trim() || !quickFormData.description.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderAIAssisted = () => (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setCurrentPath('choose')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mt-4">AI-Assisted Agent Creation</h1>
        <p className="text-muted-foreground">
          Describe your goal and let AI create the perfect team
        </p>
      </div>

      {step === 1 && (
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">What's your goal?</label>
              <Textarea
                value={conversationGoal.description}
                onChange={(e) =>
                  setConversationGoal((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="e.g., Plan a product launch, Analyze market data, Create content strategy..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Additional Context (Optional)
              </label>
              <Textarea
                value={conversationGoal.context}
                onChange={(e) =>
                  setConversationGoal((prev) => ({ ...prev, context: e.target.value }))
                }
                placeholder="Any specific requirements, constraints, or details..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Number of Agents</label>
                <Select
                  value={conversationGoal.agentCount.toString()}
                  onChange={(value) =>
                    setConversationGoal((prev) => ({ ...prev, agentCount: parseInt(value) }))
                  }
                >
                  <option value="2">2 Agents</option>
                  <option value="3">3 Agents</option>
                  <option value="4">4 Agents</option>
                  <option value="5">5 Agents</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Complexity Level</label>
                <Select
                  value={conversationGoal.complexity}
                  onChange={(value) =>
                    setConversationGoal((prev) => ({ ...prev, complexity: value as any }))
                  }
                >
                  <option value="simple">Simple</option>
                  <option value="moderate">Moderate</option>
                  <option value="complex">Complex</option>
                </Select>
              </div>
            </div>

            <Button
              onClick={generateAgentSuggestions}
              disabled={!conversationGoal.description.trim() || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating AI Suggestions...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Agent Team
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && agentSuggestions.length > 0 && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI-Generated Agent Team</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select the agents you'd like to create. They'll be configured to work together
              automatically.
            </p>

            <div className="space-y-4">
              {agentSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedSuggestions.has(index)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    const newSelected = new Set(selectedSuggestions);
                    if (newSelected.has(index)) {
                      newSelected.delete(index);
                    } else {
                      newSelected.add(index);
                    }
                    setSelectedSuggestions(newSelected);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">{suggestion.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {suggestion.capabilities.map((cap, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Role: {suggestion.role}</p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={selectedSuggestions.has(index)}
                        onChange={() => {}} // Handled by div onClick
                        className="w-4 h-4"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Modify Goal
              </Button>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={generateAgentSuggestions}
                  disabled={isGenerating}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
                <Button
                  onClick={handleCreateSelectedAgents}
                  disabled={selectedSuggestions.size === 0}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Create {selectedSuggestions.size} Agents
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  const renderFromChat = () => (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/chat')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Chat
        </Button>
        <h1 className="text-3xl font-bold mt-4">Create Agent from Chat</h1>
        <p className="text-muted-foreground">Create an agent based on your conversation needs</p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {chatContext.missingAgentType && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900">Suggested Agent Type</h3>
              <p className="text-sm text-blue-700">
                Based on your conversation, you might need:{' '}
                <strong>{chatContext.missingAgentType}</strong>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Agent Name</label>
            <Input
              value={chatContext.suggestedName || ''}
              onChange={(e) =>
                setChatContext((prev) => ({ ...prev, suggestedName: e.target.value }))
              }
              placeholder="Name for your new agent"
            />
          </div>

          {chatContext.conversationHistory && (
            <div>
              <label className="block text-sm font-medium mb-2">Conversation Context</label>
              <Textarea
                value={chatContext.conversationHistory}
                readOnly
                rows={4}
                className="bg-gray-50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This conversation will help inform the agent's capabilities
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Advanced Options
            </Button>
            <Button onClick={handleFromChatCreate} disabled={!chatContext.suggestedName?.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Create & Add to Chat
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderAdvanced = () => {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setCurrentPath('choose')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mt-4">Advanced Agent Creation</h1>
          <p className="text-muted-foreground">
            Full control over agent capabilities and personality
          </p>
        </div>

        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Advanced Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Configure all aspects of your agent including capabilities, personality, and reasoning
              strategies.
            </p>
          </div>

          <div className="max-w-2xl">
            <NewAgentForm form={advancedForm} onSubmit={handleAdvancedSubmit} />
          </div>
        </Card>
      </div>
    );
  };

  // Terminal Agent Creation Render Functions
  const renderTerminalClaude = () => (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setCurrentPath('choose')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mt-4">Claude Code CLI Agent</h1>
        <p className="text-muted-foreground">
          Create an agent that operates through Claude Code CLI with full relay integration
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Claude Code CLI Integration</h3>
            </div>
            <p className="text-blue-700 text-sm">
              This agent will be spawned in a new Claude Code CLI terminal window with direct relay
              connection to The New Fuse framework.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Agent Name</label>
            <Input
              value={quickFormData.name}
              onChange={(e) => setQuickFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Claude CLI Assistant"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={quickFormData.description}
              onChange={(e) =>
                setQuickFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe what this Claude Code CLI agent will do..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Claude Capabilities</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries({
                code_generation: 'Code Generation',
                code_review: 'Code Review',
                file_operations: 'File Operations',
                git_operations: 'Git Operations',
                terminal_access: 'Terminal Access',
                project_analysis: 'Project Analysis',
              }).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    checked={quickFormData.capabilities?.[key] || false}
                    onCheckedChange={(checked) =>
                      setQuickFormData((prev) => ({
                        ...prev,
                        capabilities: { ...prev.capabilities, [key]: checked },
                      }))
                    }
                  />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Terminal className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-amber-900">Terminal Configuration</h3>
            </div>
            <p className="text-amber-700 text-sm mb-3">
              The agent will be launched with environment variables for relay integration:
            </p>
            <div className="space-y-1 text-xs font-mono bg-amber-100 p-2 rounded">
              <div>
                TNF_AGENT_ID:{' '}
                {quickFormData.name.toLowerCase().replace(/\s+/g, '-') || 'claude-cli-agent'}
              </div>
              <div>TNF_RELAY_ENDPOINT: ws://localhost:8080/relay</div>
              <div>TNF_MASTER_REGISTRY: true</div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPath('choose')}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                handleTerminalAgentCreation({
                  ...quickFormData,
                  type: 'ASSISTANT',
                  platform: 'claude-cli',
                  metadata: { terminalType: 'claude-cli', relayIntegration: true },
                })
              }
              disabled={!quickFormData.name.trim() || !quickFormData.description.trim()}
            >
              <Terminal className="h-4 w-4 mr-2" />
              Spawn Claude CLI Agent
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderTerminalNative = () => (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setCurrentPath('choose')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mt-4">Native Terminal Agent</h1>
        <p className="text-muted-foreground">
          Create an agent that operates through native terminal with The New Fuse bridge
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Monitor className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Terminal Bridge Integration</h3>
            </div>
            <p className="text-green-700 text-sm">
              This agent will operate through the native terminal with The New Fuse terminal bridge
              for autonomous communication.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Agent Name</label>
            <Input
              value={quickFormData.name}
              onChange={(e) => setQuickFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Terminal Bridge Agent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={quickFormData.description}
              onChange={(e) =>
                setQuickFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe what this terminal agent will do..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Terminal Capabilities</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries({
                terminal_access: 'Terminal Commands',
                file_operations: 'File Operations',
                process_management: 'Process Management',
                system_monitoring: 'System Monitoring',
                script_execution: 'Script Execution',
                log_analysis: 'Log Analysis',
              }).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    checked={quickFormData.capabilities?.[key] || false}
                    onCheckedChange={(checked) =>
                      setQuickFormData((prev) => ({
                        ...prev,
                        capabilities: { ...prev.capabilities, [key]: checked },
                      }))
                    }
                  />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Cpu className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Bridge Configuration</h3>
            </div>
            <p className="text-blue-700 text-sm mb-3">
              Communication through terminal_bridge.js with file-based protocol:
            </p>
            <div className="space-y-1 text-xs font-mono bg-blue-100 p-2 rounded">
              <div>Bridge Path: ./terminal_bridge.js</div>
              <div>Command Queue: ./command_queue.json</div>
              <div>Shared Memory: ./shared_memory.json</div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPath('choose')}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                handleTerminalAgentCreation({
                  ...quickFormData,
                  type: 'ASSISTANT',
                  platform: 'terminal',
                  metadata: { terminalType: 'native', bridgeIntegration: true },
                })
              }
              disabled={!quickFormData.name.trim() || !quickFormData.description.trim()}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Create Terminal Agent
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderTerminalIntegrated = () => (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setCurrentPath('choose')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mt-4">Integrated Terminal Agent</h1>
        <p className="text-muted-foreground">
          Create a fully integrated agent within The New Fuse ecosystem
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Full TNF Integration</h3>
            </div>
            <p className="text-purple-700 text-sm">
              This agent will be fully embedded within The New Fuse ecosystem with complete relay,
              registry, and orchestrator integration.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Agent Name</label>
            <Input
              value={quickFormData.name}
              onChange={(e) => setQuickFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., TNF Integrated Agent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={quickFormData.description}
              onChange={(e) =>
                setQuickFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe what this integrated agent will do..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Integration Capabilities</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries({
                relay_integration: 'Relay Integration',
                protocol_translation: 'Protocol Translation',
                heartbeat_compliance: 'Heartbeat Compliance',
                handoff_templating: 'Handoff Templating',
                stagnation_recovery: 'Stagnation Recovery',
                workflow_execution: 'Workflow Execution',
                agent_coordination: 'Agent Coordination',
                real_time_chat: 'Real-time Chat',
              }).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    checked={quickFormData.capabilities?.[key] || false}
                    onCheckedChange={(checked) =>
                      setQuickFormData((prev) => ({
                        ...prev,
                        capabilities: { ...prev.capabilities, [key]: checked },
                      }))
                    }
                  />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <h3 className="font-semibold text-emerald-900">Master Registry Integration</h3>
            </div>
            <p className="text-emerald-700 text-sm mb-3">
              Full registration with Master Agent Registry including:
            </p>
            <ul className="text-xs text-emerald-700 space-y-1">
              <li>• Universal onboarding protocol compliance</li>
              <li>• Performance metrics tracking</li>
              <li>• Todo list management</li>
              <li>• Merkle tree verification</li>
              <li>• Real-time status monitoring</li>
            </ul>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentPath('choose')}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                handleTerminalAgentCreation({
                  ...quickFormData,
                  type: 'ASSISTANT',
                  platform: 'integrated',
                  metadata: {
                    terminalType: 'integrated',
                    fullIntegration: true,
                    masterRegistryCompliant: true,
                    protocolCompliant: true,
                  },
                })
              }
              disabled={!quickFormData.name.trim() || !quickFormData.description.trim()}
            >
              <Zap className="h-4 w-4 mr-2" />
              Create Integrated Agent
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderCurrentPath = () => {
    switch (currentPath) {
      case 'quick':
        return renderQuickCreate();
      case 'advanced':
        return renderAdvanced();
      case 'ai-assisted':
        return renderAIAssisted();
      case 'from-chat':
        return renderFromChat();
      case 'terminal-claude':
        return renderTerminalClaude();
      case 'terminal-native':
        return renderTerminalNative();
      case 'terminal-integrated':
        return renderTerminalIntegrated();
      default:
        return renderPathSelection();
    }
  };

  return renderCurrentPath();
};

export default UnifiedAgentCreator;
