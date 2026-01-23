import {
  Activity,
  Bot,
  Brain,
  Hash,
  MessageSquare,
  Play,
  Plus,
  Rocket,
  Search,
  Send,
  Settings,
  Shield,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { GlassCard } from './ui/premium/GlassCard';
import { PremiumButton } from './ui/premium/PremiumButton';
import { useApi } from '../hooks/useApi';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  agentId?: string;
  type: 'user' | 'agent' | 'system';
}

interface ChatAgent {
  id: string;
  name: string;
  status: 'online' | 'busy' | 'offline';
  role: string;
  description: string;
}

export const MultiAgentChat: React.FC = () => {
  const { api, agentService } = useApi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeAgents, setActiveAgents] = useState<ChatAgent[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAgents();
    setMessages(MOCK_HISTORY);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchAgents = async () => {
    try {
      const res = await agentService.getAgents();
      if (Array.isArray(res)) {
        setActiveAgents(res.map(a => ({
            id: a.id,
            name: a.name,
            status: 'online',
            role: a.type,
            description: a.description
        })));
      } else {
        setActiveAgents(MOCK_AGENTS);
      }
    } catch (e) {
      setActiveAgents(MOCK_AGENTS);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'Commander',
      text: inputValue,
      timestamp: new Date().toISOString(),
      type: 'user'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Call real inter-agent broker
    try {
      const response = await api.post('/orchestration/chat', { 
        message: inputValue,
        swarmId: 'default-swarm'
      });
      
      if (response.success) {
        // Handle stream or response
      } else {
        // Fallback demo response
        setTimeout(() => {
            const agent = activeAgents[Math.floor(Math.random() * activeAgents.length)];
            const agentMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: agent.name,
                text: `Acknowledged. Processing "${inputValue}" through the collective reasoning engine. I recommend we leverage the ${agent.role} protocols.`,
                timestamp: new Date().toISOString(),
                agentId: agent.id,
                type: 'agent'
            };
            setMessages(prev => [...prev, agentMsg]);
            setIsTyping(false);
        }, 1500);
      }
    } catch (e) {
        setIsTyping(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 p-4 animate-in fade-in duration-1000">
      {/* Left Sidebar: Swarm Identity */}
      <div className="hidden lg:flex flex-col w-80 gap-6 overflow-y-auto">
        <GlassCard className="p-6 border-blue-500/20">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2 mb-4">
                <Users className="w-6 h-6 text-blue-400" />
                Swarm Collective
            </h2>
            <div className="space-y-3">
                {activeAgents.map(agent => (
                    <div key={agent.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all cursor-pointer group">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600/20 to-indigo-600/20 flex items-center justify-center border border-white/10">
                                <Bot className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
                                agent.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate">{agent.name}</div>
                            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{agent.role}</div>
                        </div>
                    </div>
                ))}
            </div>
            <PremiumButton variant="outline" className="w-full mt-6 h-10 border-indigo-500/30 text-indigo-400">
                <Plus className="w-4 h-4 mr-2" /> Recruit Agent
            </PremiumButton>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-indigo-600/5 to-transparent flex-1">
            <h3 className="text-lg font-bold text-white mb-4">Orchestration Parameters</h3>
            <div className="space-y-4">
                <ParamSlider label="Collective Temperature" value={0.7} />
                <ParamSlider label="Reasoning Depth" value={0.9} />
                <ParamSlider label="Diversity Bias" value={0.4} />
            </div>
            <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2 font-bold uppercase">
                    <span>Protocol Mode</span>
                    <Sparkles className="w-3 h-3 text-amber-400" />
                </div>
                <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-[10px] text-gray-400 leading-relaxed italic">
                    "Agents are operating in Consensus Mode. All responses require cross-verification through the Relay Broker."
                </div>
            </div>
        </GlassCard>
      </div>

      {/* Main Area: Coordination Arena */}
      <div className="flex-1 flex flex-col min-w-0 gap-4">
        <GlassCard className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="font-bold text-white tracking-wide uppercase text-sm">Collective Coordination Arena</h2>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 text-gray-500 hover:text-white transition-colors"><Search className="w-4 h-4" /></button>
                    <button className="p-2 text-gray-500 hover:text-white transition-colors"><Settings className="w-4 h-4" /></button>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[80%] flex gap-4 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border ${
                                msg.type === 'user' ? 'bg-blue-600 text-white border-blue-400' : 'bg-white/5 text-blue-400 border-white/10'
                            }`}>
                                {msg.type === 'user' ? <Users className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                            </div>
                            <div className={`space-y-1 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                                <div className="flex items-center gap-2 mb-1 justify-inherit">
                                    <span className="text-xs font-black uppercase text-gray-500 tracking-tighter">{msg.sender}</span>
                                    <span className="text-[10px] text-gray-700 font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-2xl ${
                                    msg.type === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-gray-200 border border-white/10 rounded-tl-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full flex gap-1 items-center">
                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" />
                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Arena */}
            <div className="p-6 border-t border-white/10 bg-black/20">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000" />
                    <div className="relative flex items-center bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden px-4 py-2">
                        <textarea 
                            rows={1}
                            placeholder="Distribute command to the collective..." 
                            className="flex-1 bg-transparent text-white border-none focus:ring-0 placeholder-gray-500 text-sm resize-none py-2"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                        <div className="flex items-center gap-2 ml-4">
                            <button className="p-2 text-gray-500 hover:text-white transition-colors" title="Attach Context">
                                <Zap className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={handleSend}
                                disabled={!inputValue.trim()}
                                className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl transition-all"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </GlassCard>
      </div>
    </div>
  );
};

const ParamSlider: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <span>{label}</span>
            <span className="text-white">{value}</span>
        </div>
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-blue-600 rounded-full" style={{width: `${value * 100}%`}} />
        </div>
    </div>
);

const MOCK_AGENTS: ChatAgent[] = [
    { id: '1', name: 'Synthesizer-01', status: 'online', role: 'Logical Reasoning', description: 'Decomposes complex problems into sub-tasks.' },
    { id: '2', name: 'Creative-Node', status: 'busy', role: 'Divergent Thinking', description: 'Explores alternative solutions and edge cases.' },
    { id: '3', name: 'Validator-Z', status: 'online', role: 'Critique & Audit', description: 'Ensures factual accuracy and policy compliance.' },
];

const MOCK_HISTORY: Message[] = [
    { id: 'h1', sender: 'system', text: 'Swarm active. Relay initialization complete.', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'system' },
    { id: 'h2', sender: 'Synthesizer-01', text: 'Hello Commander. The collective is synchronized and awaiting distribution of directives.', timestamp: new Date(Date.now() - 3500000).toISOString(), type: 'agent' },
];

export default MultiAgentChat;
