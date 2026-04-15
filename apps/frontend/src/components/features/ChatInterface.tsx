import React, { useEffect, useRef, useState } from 'react';
import { LLMClient } from '../../../packages/tnf-cli/src/utils/llm-client';

const ChatInterface = () => {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  return React.createElement(
    'div',
    { className: 'p-4 h-full' },
    React.createElement(
      'div',
      { className: 'grid grid-cols-1 md:grid-cols-4 gap-4 h-full' },
      React.createElement(
        'div',
        { className: 'md:col-span-3' },
        React.createElement(
          'div',
          { className: 'bg-transparent rounded-md shadow p-4 h-full' },
          React.createElement(
            'div',
            { className: 'flex-1 flex items-center justify-center' },
            React.createElement('p', { className: 'text-muted-foreground' }, 'Chat Interface Demo')
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
        { className: 'space-y-4' },
        React.createElement(
          'div',
          { className: 'bg-transparent rounded-md shadow p-4' },
          React.createElement('h3', { className: 'font-semibold mb-2' }, 'Voice Control'),
          React.createElement(
            'button',
            {
              onClick: () => setIsVoiceEnabled(!isVoiceEnabled),
              className: `px-4 py-2 rounded ${isVoiceEnabled ? 'bg-green-500 text-white' : 'bg-gray-200'}`,
            },
            isVoiceEnabled ? 'Voice On' : 'Voice Off'
          )
        ),
        React.createElement(
          'div',
          { className: 'bg-transparent rounded-md shadow p-4' },
          React.createElement('h3', { className: 'font-semibold mb-2' }, 'Status'),
          React.createElement(
            'p',
            { className: 'text-sm text-muted-foreground' },
            'Chat interface ready'
          )
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
