import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-renderer ${className} space-y-2`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ _node, inline, className, children, ...props }: CodeProps) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={materialDark}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          p: ({ children }: { children?: React.ReactNode }) => (
            <p className="text-base leading-relaxed">
              {children}
            </p>
          ),
          h1: ({ children }: { children?: React.ReactNode }) => (
            <h1 className="text-2xl font-bold mb-4">
              {children}
            </h1>
          ),
          h2: ({ children }: { children?: React.ReactNode }) => (
            <h2 className="text-xl font-bold mb-3">
              {children}
            </h2>
          ),
          h3: ({ children }: { children?: React.ReactNode }) => (
            <h3 className="text-lg font-bold mb-2">
              {children}
            </h3>
          ),
          a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              {children}
            </a>
          ),
          ul: ({ children }: { children?: React.ReactNode }) => (
            <ul className="pl-4 list-disc">
              {children}
            </ul>
          ),
          ol: ({ children }: { children?: React.ReactNode }) => (
            <ol className="pl-4 list-decimal">
              {children}
            </ol>
          ),
          blockquote: ({ children }: { children?: React.ReactNode }) => (
            <blockquote
              className="border-l-4 border-blue-500 pl-3 py-2 my-2 bg-gray-50 rounded-md"
            >
              {children}
            </blockquote>
          ),
          table: ({ children }: { children?: React.ReactNode }) => (
            <table className="w-full border-collapse">
              <tbody>
                {children}
              </tbody>
            </table>
          ),
          th: ({ children }: { children?: React.ReactNode }) => (
            <th className="border border-gray-200 p-2 bg-gray-50 font-bold">
              {children}
            </th>
          ),
          td: ({ children }: { children?: React.ReactNode }) => (
            <td className="border border-gray-200 p-2">
              {children}
            </td>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
