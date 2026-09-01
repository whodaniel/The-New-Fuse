/**
 * Agent Testing Step
 *
 * Interactive step to test the newly configured agent
 */

import { Check, Loader, MessageSquare, Play, RefreshCw, Send, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { WizardContext } from '../WizardSystem.js';

export interface AgentTestingProps {
  context: WizardContext;
  onDataChange: (data: Record<string, unknown>) => void;
  validationErrors?: string[];
}

interface TestMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface TestResult {
  success: boolean;
  responseTime: number;
  tokensUsed?: number;
  error?: string;
}

const SAMPLE_PROMPTS = [
  'Hello! Can you tell me about yourself?',
  'What capabilities do you have?',
  'Can you help me with a simple coding task?',
  'Summarize the key features of The New Fuse',
  'What kind of tasks are you best suited for?',
];

export const AgentTesting: React.FC<AgentTestingProps> = ({
  context,
  onDataChange,
  validationErrors = [],
}) => {
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testsPassed, setTestsPassed] = useState(0);

  const agentName = (context.data.agentName as string) || 'Your Agent';

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: TestMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setIsLoading(true);

      const startTime = Date.now();

      // Simulate API call - in production this would call the actual agent
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

        const responseTime = Date.now() - startTime;

        const assistantMessage: TestMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `This is a simulated response from ${agentName}. In production, this would be the actual AI response based on your configuration:\n\n• Agent Type: ${context.data.agentType || 'Not set'}\n• Provider: ${context.data.provider || 'Not set'}\n• Model: ${context.data.model || 'Not set'}\n\nYour message was: "${content}"`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setTestResult({
          success: true,
          responseTime,
          tokensUsed: Math.floor(Math.random() * 100) + 50,
        });
        setTestsPassed((prev) => prev + 1);
        onDataChange({ testsPassed: testsPassed + 1, lastTestResult: 'success' });
      } catch (error) {
        setTestResult({
          success: false,
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        onDataChange({ lastTestResult: 'failure' });
      } finally {
        setIsLoading(false);
      }
    },
    [agentName, context.data, testsPassed, onDataChange]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const clearConversation = () => {
    setMessages([]);
    setTestResult(null);
  };

  return (
    <div className="wizard-step-testing">
      <div className="step-header">
        <Play className="w-8 h-8 text-primary" />
        <h2 className="step-title">Test Your Agent</h2>
        <p className="step-description">Try out your agent before finalizing the configuration</p>
      </div>

      {validationErrors.length > 0 && (
        <div className="validation-errors">
          {validationErrors.map((error, index) => (
            <div key={index} className="error-message">
              {error}
            </div>
          ))}
        </div>
      )}

      <div className="testing-container">
        <div className="chat-section">
          <div className="chat-header">
            <div className="agent-info">
              <MessageSquare className="w-5 h-5" />
              <span>{agentName}</span>
            </div>
            <button className="clear-btn" onClick={clearConversation}>
              <RefreshCw className="w-4 h-4" />
              Clear
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="empty-state">
                <MessageSquare className="w-12 h-12 text-muted" />
                <p>Start a conversation to test your agent</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`message ${message.role}`}>
                  <div className="message-content">{message.content}</div>
                  <div className="message-time">{message.timestamp.toLocaleTimeString()}</div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="message assistant loading">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
          </div>

          <form className="chat-input" onSubmit={handleSubmit}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message to test your agent..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !inputValue.trim()}>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="test-sidebar">
          <div className="sample-prompts">
            <h4>Try These Prompts</h4>
            <div className="prompt-list">
              {SAMPLE_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  className="prompt-btn"
                  onClick={() => sendMessage(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {testResult && (
            <div className={`test-result ${testResult.success ? 'success' : 'failure'}`}>
              <div className="result-header">
                {testResult.success ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                <span>{testResult.success ? 'Test Passed' : 'Test Failed'}</span>
              </div>
              <div className="result-stats">
                <div className="stat">
                  <span className="label">Response Time</span>
                  <span className="value">{testResult.responseTime}ms</span>
                </div>
                {testResult.tokensUsed && (
                  <div className="stat">
                    <span className="label">Tokens Used</span>
                    <span className="value">{testResult.tokensUsed}</span>
                  </div>
                )}
              </div>
              {testResult.error && <div className="result-error">{testResult.error}</div>}
            </div>
          )}

          <div className="test-summary">
            <h4>Test Summary</h4>
            <div className="summary-stat">
              <span className="label">Tests Passed</span>
              <span className="value">{testsPassed}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="step-tips">
        <h4>Tips</h4>
        <ul>
          <li>Test with different types of prompts to verify capabilities</li>
          <li>Check response times to ensure acceptable performance</li>
          <li>You can skip this step and test later if needed</li>
        </ul>
      </div>
    </div>
  );
};
