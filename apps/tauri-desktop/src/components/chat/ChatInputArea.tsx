import { Layers, Send, Sparkles, SlidersHorizontal } from 'lucide-react';
import React, { useRef, useState } from 'react';
import type { OrchestrationMode } from '../../stores/chatStore';

interface ChatInputAreaProps {
  onSend: (text: string) => void;
  disabled: boolean;
  isLoading: boolean;
  mode: OrchestrationMode;
  onModeChange: (mode: OrchestrationMode) => void;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
  selectedAgentCount: number;
}

const PROMPT_PRESETS = [
  {
    title: 'Code Audit & Review',
    prompt: 'Please review the following code for performance bottlenecks, security flaws, and idiomatic best practices:',
  },
  {
    title: 'System Architecture Breakdown',
    prompt: 'Analyze the system architecture requirements for a high-concurrency real-time agent orchestration layer:',
  },
  {
    title: 'Multi-Perspective Analysis',
    prompt: 'Provide a multi-agent debate and comprehensive consensus on the trade-offs of microservices vs monolith:',
  },
  {
    title: 'Bug & Crash Diagnostic',
    prompt: 'Investigate the potential root cause and mitigation steps for the following runtime error stacktrace:',
  },
];

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  onSend,
  disabled,
  isLoading,
  mode,
  onModeChange,
  temperature,
  onTemperatureChange,
  selectedAgentCount,
}) => {
  const [input, setInput] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!input.trim() || disabled || isLoading) return;
    onSend(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const applyPreset = (prompt: string) => {
    setInput(prompt + '\n\n');
    setShowPresets(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="p-4 border-t border-slate-800 bg-slate-950/80 backdrop-blur-md relative">
      {/* Settings Bar */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2">
          {/* Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400 ml-1.5" />
            <select
              value={mode}
              onChange={(e) => onModeChange(e.target.value as OrchestrationMode)}
              className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="broadcast">Parallel Broadcast</option>
              <option value="direct">Direct Agent Chat</option>
              <option value="round-robin">Sequential Round-Robin</option>
              <option value="consensus">Consensus Debating</option>
            </select>
          </div>

          {/* Prompt Presets Button */}
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Presets</span>
          </button>
        </div>

        {/* Temperature Quick Trigger */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Temp: {temperature}</span>
        </button>
      </div>

      {/* Preset Popup Drawer */}
      {showPresets && (
        <div className="absolute bottom-full left-4 mb-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-2xl z-30 space-y-1.5 animate-in fade-in slide-in-from-bottom-2">
          <div className="text-[11px] font-bold uppercase text-slate-400 px-2 py-1">Prompt Presets</div>
          {PROMPT_PRESETS.map((p) => (
            <button
              key={p.title}
              onClick={() => applyPreset(p.prompt)}
              className="w-full text-left p-2 rounded-xl hover:bg-slate-800 text-xs text-slate-200 font-medium transition-colors"
            >
              <div>{p.title}</div>
              <div className="text-[10px] text-slate-400 truncate">{p.prompt}</div>
            </button>
          ))}
        </div>
      )}

      {/* Settings Popup Drawer */}
      {showSettings && (
        <div className="absolute bottom-full right-4 mb-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl z-30 space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="text-[11px] font-bold uppercase text-slate-400">Generation Temperature</div>
          <div className="flex justify-between text-xs text-slate-300">
            <span>Deterministic</span>
            <span className="font-bold text-indigo-400">{temperature}</span>
            <span>Creative</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={temperature}
            onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      )}

      {/* Main Textarea Container */}
      <div className="relative flex items-end gap-2 bg-slate-900 border border-slate-800 focus-within:border-indigo-500/80 rounded-2xl p-2.5 transition-all shadow-inner">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedAgentCount > 0
              ? `Send command to ${selectedAgentCount} agent(s) [${mode.toUpperCase()}]...`
              : 'Select one or more agents from the left panel to begin'
          }
          disabled={disabled || selectedAgentCount === 0}
          className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none resize-none py-1 px-2 max-h-44 scrollbar-thin"
        />

        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled || selectedAgentCount === 0 || isLoading}
          className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 shadow-md shadow-indigo-600/20"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="flex justify-between items-center mt-2 px-1 text-[10px] text-slate-500 font-mono">
        <span>Shift + Enter for new line</span>
        <span>Mode: <strong className="text-indigo-400 capitalize">{mode}</strong></span>
      </div>
    </div>
  );
};

export default ChatInputArea;
