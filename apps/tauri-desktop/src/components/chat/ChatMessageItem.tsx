import { Bot, Check, Copy, RefreshCw, Trash2, User } from 'lucide-react';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '../../types';

interface ChatMessageItemProps {
  message: ChatMessage;
  getAgentColor: (platform: string) => string;
  getAgentPlatform?: (agentId?: string) => string;
  onDelete?: (id: string) => void;
  onRegenerate?: (message: ChatMessage) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = React.memo(
  ({ message, getAgentColor, getAgentPlatform, onDelete, onRegenerate }) => {
    const [copiedText, setCopiedText] = useState(false);

    const handleCopyText = () => {
      navigator.clipboard.writeText(message.content);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    };

    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    const platform = getAgentPlatform ? getAgentPlatform(message.agentId) : 'custom';
    const badgeColor = getAgentColor(platform);

    return (
      <div
        className={`group relative flex gap-3 ${
          isUser ? 'flex-row-reverse justify-start' : 'justify-start'
        } animate-in fade-in slide-in-from-bottom-2 duration-200 mb-4`}
      >
        {/* Avatar */}
        {!isSystem && (
          <div
            className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center border text-sm font-semibold shadow-sm ${
              isUser
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400/30 text-white'
                : 'bg-slate-900 border-slate-800 text-indigo-400'
            }`}
            style={{ borderColor: !isUser ? badgeColor : undefined }}
          >
            {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </div>
        )}

        {/* Message Content Bubble */}
        <div className={`max-w-[85%] space-y-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {/* Header */}
          <div className={`flex items-center gap-2 text-xs text-slate-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && !isSystem && (
              <span
                className="px-2 py-0.5 rounded-md text-[11px] font-medium text-white shadow-sm"
                style={{ backgroundColor: badgeColor }}
              >
                {message.agentName || message.agentId || 'Agent'}
              </span>
            )}
            {isUser && <span className="font-semibold text-indigo-300">You</span>}
            <span className="font-mono text-[10px] opacity-75">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Bubble Box */}
          <div
            className={`p-4 rounded-2xl text-sm leading-relaxed ${
              isUser
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10'
                : isSystem
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-xl text-xs font-mono py-2.5 px-3.5'
                : 'bg-slate-900/90 border border-slate-800 text-slate-100 rounded-tl-none shadow-md'
            }`}
          >
            {isSystem ? (
              <div className="flex items-center gap-2">
                <span>{message.content}</span>
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');

                    if (!inline && match) {
                      return (
                        <CodeBlock language={match[1]} value={codeString} />
                      );
                    }

                    return (
                      <code
                        className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800 font-mono text-xs text-indigo-300"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>

          {/* Hover Toolbar */}
          <div
            className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1 ${
              isUser ? 'justify-end' : 'justify-start'
            }`}
          >
            <button
              onClick={handleCopyText}
              title="Copy message"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {!isUser && !isSystem && onRegenerate && (
              <button
                onClick={() => onRegenerate(message)}
                title="Regenerate response"
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(message.id)}
                title="Delete message"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ChatMessageItem.displayName = 'ChatMessageItem';

/** Code block component with copy button */
const CodeBlock: React.FC<{ language: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden text-left">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-[11px] font-mono text-slate-400">
        <span className="uppercase">{language}</span>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '12px 16px',
          fontSize: '12px',
          background: 'transparent',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

export default ChatMessageItem;
