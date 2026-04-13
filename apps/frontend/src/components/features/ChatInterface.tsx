import React, { useEffect, useRef, useState } from 'react';
import { LLMClient } from '../../../packages/tnf-cli/src/utils/llm-client';

const ChatInterface = () => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>(
    []
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'connecting' | 'offline' | 'error'
  >('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [llmClient, setLlmClient] = useState<LLMClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize LLM client on mount
  useEffect(() => {
    const initLLM = async () => {
      setConnectionStatus('connecting');
      try {
        const client = new LLMClient();
        setLlmClient(client);

        // Test connection
        await client.chatComplete([{ role: 'user', content: 'Hello' }], { maxTokens: 1 });
        setConnectionStatus('connected');
        setErrorMessage(null);
      } catch (error) {
        console.error('LLM connection failed:', error);
        setConnectionStatus('offline');
        setErrorMessage(
          error instanceof Error ? error.message : 'Failed to connect to LLM service'
        );
      }
    };

    initLLM();

    // Cleanup
    return () => {
      // LLM client cleanup if needed
    };
  }, []);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading || !llmClient) {
      return;
    }

    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await llmClient.chatComplete(
        messages.map((msg) => ({ role: msg.role, content: msg.content })),
        { temperature: 0.7, maxTokens: 1000 }
      );

      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Failed to get LLM response:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to get response from LLM');
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleRetryConnection = async () => {
    setConnectionStatus('connecting');
    setErrorMessage(null);

    try {
      const client = new LLMClient();
      setLlmClient(client);

      // Test connection
      await client.chatComplete([{ role: 'user', content: 'Hello' }], { maxTokens: 1 });
      setConnectionStatus('connected');
      setErrorMessage(null);
    } catch (error) {
      console.error('LLM reconnection failed:', error);
      setConnectionStatus('offline');
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to reconnect to LLM service'
      );
      setLlmClient(null);
    }
  };

  if (connectionStatus === 'connecting') {
    return React.createElement(
      'div',
      { className: 'p-4 h-full flex flex-col items-center justify-center' },
      React.createElement(
        'div',
        { className: 'text-center' },
        React.createElement('h2', { className: 'text-xl font-bold mb-4' }, 'Connecting to AI...'),
        React.createElement(
          'p',
          { className: 'text-muted-foreground' },
          'Establishing connection with available LLM providers...'
        ),
        React.createElement('div', {
          className:
            'animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mt-4',
        })
      )
    );
  }

  if (connectionStatus === 'offline' || connectionStatus === 'error') {
    return React.createElement(
      'div',
      { className: 'p-4 h-full' },
      React.createElement(
        'div',
        { className: 'bg-red-50 border border-red-200 rounded-lg p-6 mb-4' },
        React.createElement(
          'h3',
          { className: 'text-red-800 font-bold flex items-start' },
          React.createElement(
            'svg',
            {
              className: 'flex-shrink-0 w-5 h-5 mt-0.5',
              xmlns: 'http://www.w3.org/2000/svg',
              fill: 'none',
              viewBox: '0 0 24 24',
              stroke: 'currentColor',
            },
            React.createElement('path', {
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: '2',
              d: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
            })
          ),
          'AI Connection Unavailable'
        ),
        React.createElement(
          'p',
          { className: 'mt-2' },
          errorMessage ||
            'Unable to connect to any LLM provider. The chat interface requires an active connection to an AI model.'
        ),
        React.createElement(
          'div',
          { className: 'mt-4 space-y-3' },
          React.createElement(
            'button',
            {
              onClick: handleRetryConnection,
              className:
                'w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors',
            },
            connectionStatus === 'connecting' ? 'Retrying...' : 'Retry Connection'
          ),
          React.createElement(
            'button',
            {
              onClick: () => {
                // Open LLM configuration help
                window.open('https://thenewfuse.com/docs/llm-setup', '_blank');
              },
              className:
                'w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors',
            },
            'Setup LLM Providers'
          )
        ),
        React.createElement(
          'div',
          { className: 'mt-4 text-xs text-gray-500' },
          'To enable AI chat, configure at least one LLM provider:',
          React.createElement('br', null),
          '• Set TNF_LLM_API_KEY environment variable',
          React.createElement('br', null),
          '• Or configure via tnf boot goldberg',
          React.createElement('br', null),
          '• Supported providers: OpenAI, Anthropic, Gemini, Ollama, local LLMs'
        )
      ),
      React.createElement(
        'div',
        { className: 'mt-6 p-4 bg-gray-50 rounded-lg' },
        React.createElement('h4', { className: 'font-semibold mb-2' }, 'Demo Mode Available'),
        React.createElement(
          'p',
          { className: 'text-sm' },
          'While no LLM is connected, you can still use the interface to:'
        ),
        React.createElement(
          'ul',
          { className: 'mt-2 list-disc list-inside text-sm' },
          React.createElement('li', null, 'Compose and queue messages for later delivery'),
          React.createElement('li', null, 'Test the chat UI and functionality'),
          React.createElement('li', null, 'Prepare prompts for when connection is restored')
        )
      )
    );
  }

  return React.createElement(
    'div',
    { className: 'p-4 h-full flex flex-col' },
    React.createElement(
      'div',
      { className: 'flex-1 overflow-y-auto pb-4' },
      React.createElement(
        'div',
        { className: 'space-y-4' },
        ...messages.map((msg, index) =>
          React.createElement(
            'div',
            {
              key: index,
              className: `flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`,
            },
            React.createElement(
              'div',
              {
                className: `max-w-[80%] px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white ml-auto' : 'bg-gray-200 text-gray-900 mr-auto'}`,
              },
              React.createElement('p', { className: 'whitespace-pre-wrap' }, msg.content)
            )
          )
        ),
        isLoading
          ? React.createElement(
              'div',
              { className: 'flex justify-center py-4' },
              React.createElement('div', {
                className:
                  'animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent',
              })
            )
          : null
      ),
      React.createElement('div', { ref: messagesEndRef })
    ),
    React.createElement(
      'form',
      {
        onSubmit: handleSendMessage,
        className: 'flex space-x-2 mt-4 pt-4 border-t',
      },
      React.createElement('textarea', {
        value: input,
        onChange: (e) => setInput(e.target.value),
        onKeyDown: handleKeyDown,
        placeholder: 'Type your message here... (Shift+Enter for new line)',
        className:
          'flex-1 min-h-[60px] resize-none border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
        rows: 2,
        disabled: isLoading || !llmClient,
      }),
      React.createElement(
        'button',
        {
          type: 'submit',
          disabled: isLoading || !llmClient || !input.trim(),
          className: `px-4 py-2 rounded-lg ${isLoading || !llmClient || !input.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed'}`,
        },
        isLoading ? 'Sending...' : 'Send'
      )
    )
  );
};

export default ChatInterface;
