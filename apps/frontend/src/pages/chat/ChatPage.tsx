import {
  chatApiService,
  type ChatAgent,
  type ConversationRule,
  type Message,
  type SynthesisJob,
} from '@/services/chatApi';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import {
  Copy,
  Lightbulb,
  Paperclip,
  Pause,
  Play,
  Send,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ChatMessageItem from './ChatMessageItem';

// Context for shared state
interface ChatContextType {
  agents: ChatAgent[];
  setAgents: React.Dispatch<React.SetStateAction<ChatAgent[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  rules: ConversationRule[];
  setRules: React.Dispatch<React.SetStateAction<ConversationRule[]>>;
  synthesisJobs: SynthesisJob[];
  setSynthesisJobs: React.Dispatch<React.SetStateAction<SynthesisJob[]>>;
  conversationGoal: string;
  setConversationGoal: React.Dispatch<React.SetStateAction<string>>;
  isGenerating: boolean;
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
  isAutomating: boolean;
  setIsAutomating: React.Dispatch<React.SetStateAction<boolean>>;
  isSynthesizing: boolean;
  setIsSynthesizing: React.Dispatch<React.SetStateAction<boolean>>;
  mode: 'manual' | 'auto';
  setMode: React.Dispatch<React.SetStateAction<'manual' | 'auto'>>;
  isPaused: boolean;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  isTtsEnabled: boolean;
  setIsTtsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  voices: VoiceOption[];
  speak: (text: string, voiceName?: string) => Promise<void>;
  callTextApi: (prompt: string, systemPrompt?: string) => Promise<string>;
  addMessage: (message: Omit<Message, 'id'>) => Promise<Message>;
  getAgentById: (id: string) => ChatAgent | undefined;
  currentChatId: string | null;
  setCurrentChatId: React.Dispatch<React.SetStateAction<string | null>>;
}

interface VoiceOption {
  name: string;
  lang: string;
  voice: SpeechSynthesisVoice;
}

const ChatContext = createContext<ChatContextType | null>(null);

const waitWithAnimationFrame = (ms: number) =>
  new Promise<void>((resolve) => {
    const start = performance.now();
    const step = (now: number) => {
      if (now - start >= ms) {
        resolve();
        return;
      }
      window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  });

const scheduleWithAnimationFrame = (ms: number, fn: () => void | Promise<void>) => {
  const start = performance.now();
  let frameId = 0;
  let canceled = false;

  const step = (now: number) => {
    if (canceled) return;
    if (now - start >= ms) {
      void fn();
      return;
    }
    frameId = window.requestAnimationFrame(step);
  };

  frameId = window.requestAnimationFrame(step);
  return () => {
    canceled = true;
    window.cancelAnimationFrame(frameId);
  };
};

// Enhanced Chat Provider Component
const EnhancedChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [agents, setAgents] = useState<ChatAgent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rules, setRules] = useState<ConversationRule[]>([]);
  const [synthesisJobs, setSynthesisJobs] = useState<SynthesisJob[]>([]);
  const [conversationGoal, setConversationGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutomating, setIsAutomating] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [isPaused, setIsPaused] = useState(true);
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Load voices for TTS
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis?.getVoices() || [];
      setVoices(
        availableVoices.map((v) => ({
          name: v.name,
          lang: v.lang,
          voice: v,
        }))
      );
    };

    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      const cancelScheduledLoad = scheduleWithAnimationFrame(100, loadVoices);
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
        cancelScheduledLoad();
      };
    }
  }, []);

  // Text-to-speech function
  const speak = useCallback(
    (text: string, voiceName?: string) => {
      return new Promise<void>((resolve) => {
        if (!isTtsEnabled || !text || typeof text !== 'string' || text.trim() === '') {
          resolve();
          return;
        }

        const allVoices = window.speechSynthesis?.getVoices() || [];
        if (allVoices.length === 0) {
          resolve();
          return;
        }

        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text.replace(/\*/g, ''));
        utterance.voice =
          allVoices.find((v) => v.name === voiceName) ||
          allVoices.find((v) => v.lang.startsWith('en') && v.default) ||
          allVoices[0];
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        void waitWithAnimationFrame(100).then(() => {
          try {
            window.speechSynthesis.speak(utterance);
          } catch (error) {
            console.warn('TTS failed:', error);
            resolve();
          }
        });
      });
    },
    [isTtsEnabled]
  );

  // API call functions using the backend service
  const callTextApi = useCallback(
    async (prompt: string, systemPrompt = 'You are a helpful assistant.') => {
      try {
        return await chatApiService.callTextApi(prompt, systemPrompt);
      } catch (error) {
        console.error('Text API error:', error);
        throw new Error('Text generation request failed. Check AI provider configuration.');
      }
    },
    []
  );

  const addMessage = useCallback(
    async (message: Omit<Message, 'id'>) => {
      try {
        // Add to local state immediately for real-time UI
        const newMessage = {
          ...message,
          id: Date.now().toString(),
        };
        setMessages((prev) => [...prev, newMessage]);

        // Sync with backend if we have a chat ID
        if (currentChatId) {
          await chatApiService.addMessage(currentChatId, message);
        }

        return newMessage;
      } catch (error) {
        console.error('Error adding message:', error);
        return {
          ...message,
          id: Date.now().toString(),
        };
      }
    },
    [currentChatId, setMessages]
  );

  const getAgentById = useCallback(
    (id: string) => {
      return agents.find((a) => a.id === id);
    },
    [agents]
  );

  const contextValue = {
    agents,
    setAgents,
    messages,
    setMessages,
    rules,
    setRules,
    synthesisJobs,
    setSynthesisJobs,
    conversationGoal,
    setConversationGoal,
    isGenerating,
    setIsGenerating,
    isAutomating,
    setIsAutomating,
    isSynthesizing,
    setIsSynthesizing,
    mode,
    setMode,
    isPaused,
    setIsPaused,
    isTtsEnabled,
    setIsTtsEnabled,
    voices,
    speak,
    callTextApi,
    addMessage,
    getAgentById,
    currentChatId,
    setCurrentChatId,
  };

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
};

function ChatPage() {
  const [newMessage, setNewMessage] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('general');
  const [loading, setLoading] = useState(true);
  const [senderId, setSenderId] = useState('You');
  const [recipientAgentId, setRecipientAgentId] = useState('');
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [newGoalInput, setNewGoalInput] = useState('');
  const [newRuleSource, setNewRuleSource] = useState('');
  const [newRuleTarget, setNewRuleTarget] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const context = useContext(ChatContext);
  if (!context) throw new Error('ChatPage must be wrapped in EnhancedChatProvider');

  const {
    agents,
    setAgents,
    messages,
    rules,
    setRules,
    synthesisJobs,
    conversationGoal,
    setConversationGoal,
    isGenerating,
    setIsGenerating,
    isSynthesizing,
    mode,
    setMode,
    isPaused,
    setIsPaused,
    isTtsEnabled,
    setIsTtsEnabled,
    voices,
    speak,
    callTextApi,
    addMessage,
    getAgentById,
  } = context;

  // Initialize default agents if none exist
  useEffect(() => {
    if (agents && agents.length === 0) {
      const defaultAgents: ChatAgent[] = [
        {
          id: 'general',
          name: 'General Assistant',
          avatar: '🤖',
          status: 'online',
          type: 'assistant',
          systemPrompt: 'You are a helpful general assistant.',
          model: 'GPT-4',
          voice: voices[0]?.name || '',
        },
        {
          id: 'codehelper',
          name: 'Code Helper',
          avatar: '👨‍💻',
          status: 'online',
          type: 'specialist',
          systemPrompt: 'You are a coding specialist who helps with programming questions.',
          model: 'GPT-4',
          voice: voices[0]?.name || '',
        },
        {
          id: 'dataanalyst',
          name: 'Data Analyst',
          avatar: '📊',
          status: 'online',
          type: 'specialist',
          systemPrompt: 'You are a data analysis expert.',
          model: 'Claude-3',
          voice: voices[0]?.name || '',
        },
        {
          id: 'support',
          name: 'Support Agent',
          avatar: '🛠️',
          status: 'busy',
          type: 'admin',
          systemPrompt: 'You provide technical support and help resolve issues.',
          model: 'GPT-3.5',
          voice: voices[0]?.name || '',
        },
      ];
      setAgents(defaultAgents);
    }
  }, [agents, setAgents, voices]);

  // Initialize with welcome messages if messages are empty
  useEffect(() => {
    if (messages && messages.length === 0) {
      const cancelWelcomeMessages = scheduleWithAnimationFrame(1000, async () => {
        addMessage({
          content: "Hello! I'm your General Assistant. How can I help you today?",
          sender: 'agent',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          agentId: 'general',
          agentName: 'General Assistant',
          agentAvatar: '🤖',
          type: 'text',
        });
        addMessage({
          content:
            'Welcome to The New Fuse Enhanced Chat! You can now interact with multiple AI agents simultaneously, set conversation goals, and use automation features.',
          sender: 'system',
          timestamp: new Date(Date.now() - 240000).toISOString(),
          type: 'text',
        });
        setLoading(false);
      });
      return () => cancelWelcomeMessages();
    } else if (messages) {
      setLoading(false);
    }
  }, [messages, addMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-response logic for multi-agent conversations
  useEffect(() => {
    if (mode !== 'auto' || isGenerating || !messages || messages.length === 0 || isPaused) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender === 'user' || lastMessage.sender === 'system' || !lastMessage.agentId) {
      return;
    }

    const nextRule = rules?.find((rule) => rule.sourceId === lastMessage.agentId);
    if (!nextRule?.targetId) return;

    const nextAgent = getAgentById(nextRule.targetId);
    if (!nextAgent) return;

    const cancelScheduledResponse = scheduleWithAnimationFrame(1500, async () => {
      try {
        setIsGenerating(true);
        const history = messages
          .slice(-10)
          .map((m) => `${m.sender}: ${m.content}`)
          .join('\n');
        const goalPrompt = conversationGoal
          ? `The current conversation goal is: "${conversationGoal}".`
          : '';
        const finalPrompt = `${goalPrompt}\n\nPrevious conversation:\n${history}\n\nYour turn, ${nextAgent.name}. What is your response? Keep it conversational and concise.`;

        const botText = await callTextApi(finalPrompt, nextAgent.systemPrompt);
        await addMessage({
          content: botText,
          sender: 'agent',
          timestamp: new Date().toISOString(),
          agentId: nextAgent.id,
          agentName: nextAgent.name,
          agentAvatar: nextAgent.avatar,
          type: 'text',
        });

        await speak(botText, nextAgent.voice);
      } catch (error) {
        console.error('Auto-response error:', error);
      } finally {
        setIsGenerating(false);
      }
    });

    return () => cancelScheduledResponse();
  }, [
    mode,
    messages,
    rules,
    isGenerating,
    isPaused,
    conversationGoal,
    getAgentById,
    callTextApi,
    addMessage,
    speak,
  ]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !recipientAgentId) return;

    const respondingAgent = getAgentById(recipientAgentId);
    if (!respondingAgent) return;

    const userMessage: Omit<Message, 'id'> = {
      content: newMessage,
      sender: 'user' as const,
      timestamp: new Date().toISOString(),
      type: 'text' as const,
    };
    setNewMessage('');

    try {
      await addMessage(userMessage);
      setIsGenerating(true);

      const history = [...messages, userMessage]
        .slice(-10)
        .map((m) => `${m.sender}: ${m.content}`)
        .join('\n');

      const goalPrompt = conversationGoal
        ? `The current conversation goal is: "${conversationGoal}".`
        : '';
      const finalPrompt = `${goalPrompt}\n\nPrevious conversation:\n${history}\n\nYour turn, ${respondingAgent.name}. What is your response?`;

      const botText = await callTextApi(finalPrompt, respondingAgent.systemPrompt);
      await addMessage({
        content: botText,
        sender: 'agent',
        timestamp: new Date().toISOString(),
        agentId: respondingAgent.id,
        agentName: respondingAgent.name,
        agentAvatar: respondingAgent.avatar,
        type: 'text',
      });

      await speak(botText, respondingAgent.voice);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddRule = () => {
    if (newRuleSource && newRuleTarget && newRuleSource !== newRuleTarget) {
      setRules((prev) => [
        ...prev,
        {
          id: `rule-${Date.now()}`,
          sourceId: newRuleSource,
          targetId: newRuleTarget,
          condition: 'after_response',
        },
      ]);
      setNewRuleSource('');
      setNewRuleTarget('');
    }
  };

  const getStatusBadge = (status: ChatAgent['status']) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500/12 text-emerald-200 border-emerald-500/25';
      case 'busy':
        return 'bg-amber-500/12 text-amber-200 border-amber-500/25';
      case 'offline':
        return 'bg-slate-500/12 text-slate-200 border-slate-500/25';
      default:
        return 'bg-slate-500/12 text-slate-200 border-slate-500/25';
    }
  };

  const getStatusIcon = (status: ChatAgent['status']) => {
    switch (status) {
      case 'online':
        return '🟢';
      case 'busy':
        return '🟡';
      case 'offline':
        return '⚫';
      default:
        return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="p-4 max-w-7xl mx-auto min-h-screen bg-background text-foreground">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[640px] bg-background text-foreground flex flex-col gap-4">
      <OpsPageHeader
        eyebrow="Collaboration"
        title="Chat Operations"
        subtitle="Coordinate human + agent conversations, goals, and response chains."
        meta={
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-slate-500/30 bg-slate-500/12 px-2 py-1 text-slate-200">
              {agents?.length || 0} agents
            </span>
            <span className="rounded-full border border-slate-500/30 bg-slate-500/12 px-2 py-1 text-slate-200">
              {rules?.length || 0} rules
            </span>
            <span className="rounded-full border border-slate-500/30 bg-slate-500/10 px-2 py-1 text-slate-200">
              mode: {mode}
            </span>
            <span className="rounded-full border border-slate-500/30 bg-slate-500/12 px-2 py-1 text-slate-200">
              tts: {isTtsEnabled ? 'on' : 'off'}
            </span>
          </div>
        }
        actions={
          <div className="flex flex-wrap gap-2 md:justify-end">
            <button
              onClick={() => setIsAgentModalOpen(true)}
              className="border border-slate-600/70 bg-slate-800/80 text-slate-100 px-3 py-2 rounded-md hover:bg-slate-700/80 transition-colors flex items-center shadow-none text-sm"
            >
              <Users size={14} className="mr-2" />
              Agents ({agents?.length || 0})
            </button>
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="border border-slate-600/70 bg-slate-800/80 text-slate-100 px-3 py-2 rounded-md hover:bg-slate-700/80 transition-colors flex items-center shadow-none text-sm"
            >
              <Lightbulb size={14} className="mr-2" />
              Set Goal
            </button>
            <button
              onClick={() => setIsRuleModalOpen(true)}
              className="border border-slate-600/70 bg-slate-800/80 text-slate-100 px-3 py-2 rounded-md hover:bg-slate-700/80 transition-colors flex items-center shadow-none text-sm"
            >
              <Copy size={14} className="mr-2" />
              Rules
            </button>
            <button
              className="border border-cyan-500/40 bg-cyan-600/80 text-white px-3 py-2 rounded-md hover:bg-cyan-600 transition-colors flex items-center shadow-none text-sm"
              disabled={isSynthesizing}
            >
              <Sparkles size={14} className="mr-2" />
              {isSynthesizing ? 'Synthesizing...' : 'Creative Synthesis'}
            </button>
          </div>
        }
      />

      <div className="flex-1 min-h-[520px] grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-4 overflow-hidden">
        {/* Agent Selection Sidebar */}
        <div className="flex flex-col gap-4 overflow-hidden h-full min-h-0">
          <div className="bg-card text-card-foreground rounded-xl border border-border shadow-none p-4 flex flex-col h-full overflow-hidden">
            <h2 className="text-lg font-semibold mb-4 flex-none">Available Agents</h2>
            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`w-full text-left p-3 rounded-md transition-all border ${
                    selectedAgent === agent.id
                      ? 'bg-accent text-accent-foreground border-primary'
                      : 'bg-card hover:bg-accent/50 border-border'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{agent.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{agent.name}</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full border ${getStatusBadge(agent.status)}`}
                        >
                          {getStatusIcon(agent.status)} {agent.status}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground border border-secondary">
                          {agent.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Conversation Controls */}
            <div className="mt-6 pt-4 border-t border-border space-y-4 flex-none">
              <h3 className="text-sm font-medium text-muted-foreground">Conversation Controls</h3>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mode:</span>
                <button
                  onClick={() => setMode(mode === 'manual' ? 'auto' : 'manual')}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${mode === 'auto' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                >
                  {mode === 'auto' ? 'Auto' : 'Manual'}
                </button>
              </div>

              {mode === 'auto' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto-responses:</span>
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="p-2 text-muted-foreground hover:text-foreground rounded-full"
                  >
                    {isPaused ? <Play size={16} /> : <Pause size={16} />}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm">Text-to-Speech:</span>
                <button
                  onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${isTtsEnabled ? 'bg-slate-700 text-slate-100' : 'bg-secondary text-secondary-foreground'}`}
                >
                  {isTtsEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="space-y-2">
                <Link
                  to="/agents"
                  className="block w-full text-left p-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded transition-colors"
                >
                  🤖 Manage All Agents
                </Link>
                <Link
                  to="/agents/new"
                  className="block w-full text-left p-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded transition-colors"
                >
                  ➕ Create New Agent
                </Link>
                <Link
                  to="/tasks/new"
                  className="block w-full text-left p-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded transition-colors"
                >
                  📋 Create Task
                </Link>
                <button
                  onClick={() => setIsGalleryOpen(true)}
                  className="block w-full text-left p-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded transition-colors"
                >
                  🎬 Synthesis Gallery
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="h-full overflow-hidden min-h-0">
          <div className="bg-card text-card-foreground rounded-xl border border-border shadow-none flex flex-col h-full overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {agents.find((a) => a.id === selectedAgent)?.avatar}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {agents.find((a) => a.id === selectedAgent)?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>{agents.find((a) => a.id === selectedAgent)?.type}</span>
                      <span>•</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs border ${getStatusBadge(agents.find((a) => a.id === selectedAgent)?.status || 'offline')}`}
                      >
                        {agents.find((a) => a.id === selectedAgent)?.status}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-muted-foreground hover:text-foreground rounded transition-colors">
                    <Paperclip size={20} />
                  </button>
                  <button className="p-2 text-muted-foreground hover:text-foreground rounded transition-colors">
                    <Settings size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <ChatMessageItem key={message.id} message={message} />
              ))}

              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-secondary text-secondary-foreground max-w-xs lg:max-w-md px-4 py-2 rounded-md shadow-none">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">🤖</span>
                      <span className="text-xs font-medium opacity-75">Agent thinking...</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-50"></div>
                      <div
                        className="w-2 h-2 bg-current rounded-full animate-bounce opacity-50"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-current rounded-full animate-bounce opacity-50"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Enhanced Message Input */}
            <div className="p-4 border-t border-border bg-card flex-none">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1 flex items-center gap-2">
                  <label className="text-sm font-medium text-foreground whitespace-nowrap">
                    From:
                  </label>
                  <select
                    value={senderId}
                    onChange={(e) => setSenderId(e.target.value)}
                    className="flex-1 p-2 border rounded-md bg-secondary text-secondary-foreground border-input text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    <option value="You">You</option>
                    {agents?.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 flex items-center gap-2">
                  <label className="text-sm font-medium text-foreground whitespace-nowrap">
                    To:
                  </label>
                  <select
                    value={recipientAgentId}
                    onChange={(e) => setRecipientAgentId(e.target.value)}
                    className="flex-1 p-2 border rounded-md bg-secondary text-secondary-foreground border-input text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    <option value="">Select Agent</option>
                    {agents?.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-2 items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isGenerating ? 'Thinking...' : 'Type a message...'}
                  className="flex-1 px-4 py-2 border border-input bg-secondary text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                  disabled={isGenerating || !agents || agents.length === 0}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={
                    !newMessage.trim() ||
                    isGenerating ||
                    !agents ||
                    agents.length === 0 ||
                    !recipientAgentId
                  }
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Send size={18} />
                  <span className="sr-only">Send</span>
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Press Enter to send</span>
                <span>{newMessage.length}/500</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ AGENT MODAL ═══════════ */}
      {isAgentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsAgentModalOpen(false)}>
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Users size={20} /> Active Agents</h2>
              <button onClick={() => setIsAgentModalOpen(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto max-h-[60vh]">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30">
                  <span className="text-2xl">{agent.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{agent.name}</div>
                    <div className="text-xs text-muted-foreground">{agent.model} · {agent.type}</div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusBadge(agent.status)}`}>
                    {getStatusIcon(agent.status)} {agent.status}
                  </span>
                </div>
              ))}
              {agents.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No agents configured.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ GOAL MODAL ═══════════ */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsGoalModalOpen(false)}>
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Lightbulb size={20} /> Conversation Goal</h2>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              {conversationGoal && (
                <div className="p-3 rounded-lg border border-slate-500/25 bg-slate-500/12">
                  <p className="text-sm font-medium text-foreground">Current Goal:</p>
                  <p className="text-sm text-muted-foreground mt-1">{conversationGoal}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Set New Goal</label>
                <textarea
                  value={newGoalInput}
                  onChange={(e) => setNewGoalInput(e.target.value)}
                  placeholder="e.g. Brainstorm marketing ideas for the Q2 launch..."
                  className="w-full p-3 border border-input bg-secondary text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setConversationGoal(newGoalInput.trim()); setNewGoalInput(''); setIsGoalModalOpen(false); }}
                  disabled={!newGoalInput.trim()}
                  className="flex-1 bg-slate-800 text-slate-100 border border-slate-600 px-4 py-2 rounded-md hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Set Goal
                </button>
                {conversationGoal && (
                  <button
                    onClick={() => { setConversationGoal(''); setIsGoalModalOpen(false); }}
                    className="px-4 py-2 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ RULES MODAL ═══════════ */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsRuleModalOpen(false)}>
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Copy size={20} /> Conversation Rules</h2>
              <button onClick={() => setIsRuleModalOpen(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto max-h-[50vh]">
              <p className="text-sm text-muted-foreground">Rules define how agents chain responses in Auto mode. When Agent A finishes, Agent B responds next.</p>
              {rules.map((rule, idx) => {
                const source = getAgentById(rule.sourceId);
                const target = getAgentById(rule.targetId);
                return (
                  <div key={rule.id || idx} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-secondary/30">
                    <span className="text-lg">{source?.avatar || '❓'}</span>
                    <span className="text-sm font-medium text-foreground">{source?.name || rule.sourceId}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-lg">{target?.avatar || '❓'}</span>
                    <span className="text-sm font-medium text-foreground">{target?.name || rule.targetId}</span>
                    <button
                      onClick={() => setRules((prev) => prev.filter((r) => r !== rule))}
                      className="ml-auto text-rose-300 hover:text-rose-200 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
              {rules.length === 0 && <p className="text-muted-foreground text-sm text-center py-2">No rules defined yet.</p>}
            </div>
            <div className="p-5 border-t border-border space-y-3">
              <p className="text-sm font-medium text-foreground">Add Rule</p>
              <div className="flex gap-2 items-center">
                <select value={newRuleSource} onChange={(e) => setNewRuleSource(e.target.value)} className="flex-1 p-2 border rounded-md bg-secondary text-secondary-foreground border-input text-sm">
                  <option value="">Source Agent</option>
                  {agents.map((a) => <option key={a.id} value={a.id}>{a.avatar} {a.name}</option>)}
                </select>
                <span className="text-muted-foreground font-bold">→</span>
                <select value={newRuleTarget} onChange={(e) => setNewRuleTarget(e.target.value)} className="flex-1 p-2 border rounded-md bg-secondary text-secondary-foreground border-input text-sm">
                  <option value="">Target Agent</option>
                  {agents.map((a) => <option key={a.id} value={a.id}>{a.avatar} {a.name}</option>)}
                </select>
                <button onClick={handleAddRule} disabled={!newRuleSource || !newRuleTarget || newRuleSource === newRuleTarget} className="bg-slate-800 text-slate-100 border border-slate-600 px-3 py-2 rounded-md hover:bg-slate-700 transition-colors disabled:opacity-50 text-sm font-medium">
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ SYNTHESIS GALLERY MODAL ═══════════ */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsGalleryOpen(false)}>
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Sparkles size={20} /> Synthesis Gallery</h2>
              <button onClick={() => setIsGalleryOpen(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[65vh]">
              {synthesisJobs.length > 0 ? (
                <div className="space-y-4">
                  {synthesisJobs.map((job) => (
                    <div key={job.id} className="p-4 rounded-lg border border-border bg-secondary/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{job.type || 'Synthesis'}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          job.status === 'completed' ? 'bg-emerald-500/12 text-emerald-200 border border-emerald-500/25' :
                          job.status === 'running' ? 'bg-cyan-500/12 text-cyan-200 border border-cyan-500/25' :
                          'bg-slate-500/12 text-slate-200 border border-slate-500/25'
                        }`}>{job.status}</span>
                      </div>
                      {job.result && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.result}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles size={48} className="mx-auto text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground">No synthesis jobs yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">Use Creative Synthesis to generate insights from conversations.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap the main component with the enhanced provider
const WrappedChatPage = () => (
  <EnhancedChatProvider>
    <ChatPage />
  </EnhancedChatProvider>
);

export default WrappedChatPage;
