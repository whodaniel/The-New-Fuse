import { marked } from 'marked';
import highlight from 'highlight.js';
import { decode } from 'he';
import DOMPurify from 'dompurify';

interface MarkdownOptions {
  disableLinks?: boolean;
  disableHighlight?: boolean;
  stripHtml?: boolean;
}

function configureDOMPurify() {
  if (typeof window === 'undefined') return;

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

configureDOMPurify();

marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
  highlight: (code, lang) => {
    if (lang && highlight.getLanguage(lang)) {
      try {
        return highlight.highlight(code, { language: lang }).value;
      } catch {
        return code;
      }
    }
    return code;
  },
});

export default function renderMarkdown(
  content: string,
  options: MarkdownOptions = {}
): string {
  if (!content) return '';

  const { disableLinks, disableHighlight, stripHtml } = options;

  let renderedContent = content;

  // Strip HTML if requested
  if (stripHtml) {
    renderedContent = renderedContent.replace(/<[^>]*>/g, '');
  }

  // Convert markdown to HTML
  renderedContent = marked(renderedContent);

  // Decode HTML entities
  renderedContent = decode(renderedContent);

  // Disable links if requested
  if (disableLinks) {
    renderedContent = renderedContent.replace(
      /<a [^>]*>/g,
      '<span class="text-primary-button">'
    ).replace(/<\/a>/g, '</span>');
  }

  // Disable syntax highlighting if requested
  if (disableHighlight) {
    renderedContent = renderedContent.replace(/<pre><code[^>]*>/g, '<pre><code>');
  }

  // Sanitize the final HTML
  return DOMPurify.sanitize(renderedContent);
}

export function extractCodeBlocks(content: string): string[] {
  const codeBlockRegex = /```[\s\S]*?```/g;
  return content.match(codeBlockRegex) || [];
}

export function stripMarkdown(content: string): string {
  return content
    .replace(/[#*`_~\[\]]/g, '') // Remove markdown syntax
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
}