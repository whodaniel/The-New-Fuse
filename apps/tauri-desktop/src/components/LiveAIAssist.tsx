import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTnfApi } from '../hooks/useTnfApi';
import './LiveAIAssist.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AIConfig {
  model: string;
  provider: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  voiceMode: 'off' | 'push-to-talk' | 'continuous';
}

const DEFAULT_SYSTEM_PROMPT = `You are the TNF Live AI Assistant — a helpful AI integrated into The New Fuse desktop application.

Your role:
- Answer questions about TNF, the codebase, architecture, and development workflows
- Assist with coding tasks, debugging, and planning
- Be concise, technical, and precise
- Proactively identify issues and offer solutions

Current context:
- Project: The New Fuse (TNF) monorepo
- Environment: Tauri desktop application
- You have access to the codebase via tools when needed`;

const MODEL_OPTIONS = [
  { id: 'auto', name: 'Auto (Best Available)', provider: 'system' },
  { id: 'nemotron-3-ultra', name: 'Nemotron 3 Ultra (NVIDIA)', provider: 'nvidia' },
  { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'meta' },
  { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', provider: 'meta' },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'mistral' },
  { id: 'codellama-34b', name: 'CodeLlama 34B', provider: 'meta' },
  { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'deepseek' },
];

const VOICE_MODES: { value: 'off' | 'push-to-talk' | 'continuous'; label: string; icon: string }[] =
  [
    { value: 'off', label: 'Voice Off', icon: '🔇' },
    { value: 'push-to-talk', label: 'Push to Talk', icon: '🎤' },
    { value: 'continuous', label: 'Continuous', icon: '🎙️' },
  ];

const RELAY_URL = import.meta.env.VITE_AI_RELAY_URL || 'http://127.0.0.1:43120';
const RELAY_EVENTS_URL = `${RELAY_URL}/v1/events/stream`;
const RELAY_CHAT_URL = `${RELAY_URL}/v1/chat/completions`;

export const LiveAIAssist: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [relayStatus, setRelayStatus] = useState<'unknown' | 'up' | 'down'>('unknown');
  const [config, setConfig] = useState<AIConfig>({
    model: 'auto',
    provider: 'system',
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    temperature: 0.7,
    maxTokens: 2048,
    voiceMode: 'off',
  });
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAISpeaking, setIsAISpeaking] = useState(false);

  const { queryAgent, isLoading } = useTnfApi();

  const eventSourceRef = useRef<EventSource | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech synthesis
  const speak = useCallback(async (text: string) => {
    setIsAISpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsAISpeaking(false);
    utterance.onerror = () => setIsAISpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  // Handle assistant response (from relay or TNF API)
  const handleAssistantText = useCallback(
    (text: string) => {
      const msg: Message = {
        role: 'assistant',
        content: text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, msg]);
      setIsTyping(false);
      if (config.voiceMode !== 'off') {
        setTimeout(() => {
          void speak(text);
        }, 100);
      }
    },
    [config.voiceMode, speak]
  );

  // Initialize relay connection
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const es = new EventSource(RELAY_EVENTS_URL);
    eventSourceRef.current = es;

    const onReady = () => setRelayStatus('up');
    const onAssistantMessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.content) {
          setRelayStatus('up');
          handleAssistantText(payload.content);
        }
      } catch {
        // Ignore malformed payloads
      }
    };
    const onError = () => setRelayStatus('down');

    es.addEventListener('ready', onReady as EventListener);
    es.addEventListener('assistant_message', onAssistantMessage as EventListener);
    es.onerror = onError;

    return () => {
      es.removeEventListener('ready', onReady as EventListener);
      es.removeEventListener('assistant_message', onAssistantMessage as EventListener);
      es.close();
      eventSourceRef.current = null;
    };
  }, [isOpen, handleAssistantText]);

  // Send message to AI relay
  const sendToRelay = useCallback(
    async (text: string) => {
      const chatMessages = [
        { role: 'system', content: config.systemPrompt },
        ...messages.slice(-10).map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        { role: 'user', content: text },
      ];

      try {
        const res = await fetch(RELAY_CHAT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.model === 'auto' ? undefined : config.model,
            messages: chatMessages,
            temperature: config.temperature,
            max_tokens: config.maxTokens,
            stream: false,
          }),
          signal: AbortSignal.timeout(60000),
        });

        if (!res.ok) {
          throw new Error(`Relay error ${res.status}`);
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        handleAssistantText(content);
        setRelayStatus('up');
      } catch {
        setRelayStatus('down');
        // Fallback to TNF API
        try {
          const response = await queryAgent({
            messages: [...messages, { role: 'user', content: text }],
            agent: 'tnf-agent',
          });
          handleAssistantText(response);
        } catch {
          handleAssistantText(
            'Sorry, I encountered an error. The AI relay is offline and the TNF API failed. Please check your connection.'
          );
        }
      }
    },
    [config, messages, queryAgent, handleAssistantText]
  );

  // Handle form submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = message.trim();
      if (!text || isTyping) {
        return;
      }

      const userMessage: Message = { role: 'user', content: text, timestamp: Date.now() };
      setMessages((prev) => [...prev, userMessage]);
      setMessage('');
      setIsTyping(true);

      await sendToRelay(text);
    },
    [message, isTyping, sendToRelay]
  );

  // Voice recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setVoiceEnabled(false);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // eslint-disable-next-line no-restricted-globals
      window.alert('Speech recognition not supported in this browser');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = config.voiceMode === 'continuous';
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcriptText = result[0].transcript;
      setTranscript(transcriptText);
      if (result.isFinal && transcriptText.trim()) {
        if (config.voiceMode === 'push-to-talk') {
          setVoiceEnabled(false);
          stopListening();
        }
        setMessage(transcriptText.trim());
        void handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      }
    };
    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        setIsListening(false);
        setVoiceEnabled(false);
      }
    };
    recognition.onend = () => {
      if (config.voiceMode === 'continuous' && voiceEnabled) {
        try {
          recognition.start();
        } catch (error) {
          // Ignore restart errors
        }
      } else {
        setIsListening(false);
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [config.voiceMode, voiceEnabled, handleSubmit, stopListening]);

  const toggleVoice = useCallback(() => {
    if (voiceEnabled) {
      stopListening();
    } else {
      setVoiceEnabled(true);
      startListening();
    }
  }, [voiceEnabled, startListening, stopListening]);

  // Cleanup on close
  useEffect(() => {
    return () => {
      stopListening();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [stopListening]);

  // Config handlers
  const updateConfig = useCallback(<K extends keyof AIConfig>(key: K, value: AIConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleModelChange = (modelId: string) => {
    const option = MODEL_OPTIONS.find((m) => m.id === modelId);
    updateConfig('model', modelId);
    if (option) {
      updateConfig('provider', option.provider);
    }
  };

  const handleVoiceModeChange = (mode: 'off' | 'push-to-talk' | 'continuous') => {
    updateConfig('voiceMode', mode);
    if (mode === 'off') {
      stopListening();
    }
  };

  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateConfig('systemPrompt', e.target.value);
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig('temperature', parseFloat(e.target.value));
  };

  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig('maxTokens', parseInt(e.target.value, 10));
  };

  if (!isOpen) {
    return (
      <button
        className="ai-assist-toggle"
        onClick={() => setIsOpen(true)}
        title="Live AI Assistant"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v7.5l2.5 1" />
          <path d="M8 10a4 4 0 0 1 8 0v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V10z" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      </button>
    );
  }

  return (
    <div className="ai-assist-container">
      <div className="ai-assist-chat">
        <div className="ai-assist-header">
          <span>Live AI Assistant</span>
          <div className="header-actions">
            <button
              className={`icon-btn ${showOptions ? 'active' : ''}`}
              onClick={() => setShowOptions(!showOptions)}
              title={showOptions ? 'Hide Options' : 'Show Options'}
            >
              ⚙️
            </button>
            <div className={`relay-status ${relayStatus}`} title={`Relay: ${RELAY_URL}`}>
              <span className="status-dot" />
              {relayStatus === 'up' ? 'AI' : relayStatus === 'down' ? 'OFF' : '...'}
            </div>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>
        </div>

        {/* Options Panel */}
        {showOptions && (
          <div className="ai-assist-options">
            <div className="option-group">
              <label>Model</label>
              <select
                value={config.model}
                onChange={(e) => handleModelChange(e.target.value)}
                className="option-select"
              >
                {MODEL_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
              <span className="option-hint">Provider: {config.provider}</span>
            </div>

            <div className="option-group">
              <label>Voice Mode</label>
              <div className="voice-mode-buttons">
                {VOICE_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    className={`voice-mode-btn ${config.voiceMode === mode.value ? 'active' : ''}`}
                    onClick={() => handleVoiceModeChange(mode.value)}
                    disabled={
                      mode.value !== 'off' &&
                      !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
                    }
                  >
                    {mode.icon} {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="option-group">
              <label>Temperature: {config.temperature.toFixed(1)}</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.temperature}
                onChange={handleTemperatureChange}
                className="option-slider"
              />
            </div>

            <div className="option-group">
              <label>Max Tokens: {config.maxTokens}</label>
              <input
                type="range"
                min="256"
                max="8192"
                step="256"
                value={config.maxTokens}
                onChange={handleMaxTokensChange}
                className="option-slider"
              />
            </div>

            <div className="option-group full-width">
              <label>System Prompt</label>
              <textarea
                value={config.systemPrompt}
                onChange={handleSystemPromptChange}
                className="system-prompt-input"
                rows={4}
                placeholder="Customize the AI's behavior..."
              />
            </div>
          </div>
        )}

        <div className="ai-assist-messages">
          {messages.length === 0 && (
            <div className="ai-assist-welcome">
              <p>Hi! I'm your TNF-powered AI assistant.</p>
              <p className="hint">Click ⚙️ to configure model, voice, and behavior.</p>
              <p className="hint">
                Relay: <code>{RELAY_URL}</code> —{' '}
                <span
                  className={
                    relayStatus === 'up'
                      ? 'online'
                      : relayStatus === 'down'
                        ? 'offline'
                        : 'checking'
                  }
                >
                  {relayStatus === 'up'
                    ? 'Connected'
                    : relayStatus === 'down'
                      ? 'Offline'
                      : 'Connecting...'}
                </span>
              </p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`ai-message ${msg.role}`}>
              <div className="message-content">{msg.content}</div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="ai-message assistant typing">
              <span className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          )}
          {isAISpeaking && (
            <div className="ai-message assistant speaking">
              <span className="speaking-indicator">🔊 Speaking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="ai-assist-input" onSubmit={handleSubmit}>
          <div className="input-row">
            {config.voiceMode !== 'off' && (
              <button
                type="button"
                className={`voice-btn ${voiceEnabled || isListening ? 'active' : ''}`}
                onClick={toggleVoice}
                disabled={isLoading}
                title={voiceEnabled ? 'Stop listening' : 'Start listening'}
              >
                {isListening ? '🎙️' : '🎤'}
                {isListening && <span className="listening-indicator" />}
              </button>
            )}
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={transcript ? `Heard: "${transcript}"` : 'Type your message...'}
              disabled={isLoading || isTyping}
              className={transcript ? 'has-transcript' : ''}
            />
            <button type="submit" disabled={isLoading || isTyping || !message.trim()}>
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
