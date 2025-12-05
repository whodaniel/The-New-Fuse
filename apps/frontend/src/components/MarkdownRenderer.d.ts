import React from 'react';
import 'katex/dist/katex.min.css';
interface MarkdownRendererProps {
    content: string;
    className?: string;
}
declare const MarkdownRenderer: React.FC<MarkdownRendererProps>;
export default MarkdownRenderer;
