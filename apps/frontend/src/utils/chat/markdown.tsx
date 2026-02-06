import DOMPurify from 'dompurify';
import { decode } from 'he';
import { marked } from 'marked';

interface MarkdownOptions {
  disableLinks?: boolean;
  disableHighlight?: boolean;
  stripHtml?: boolean;
}

function configureDOMPurify() {
  if (typeof window === 'undefined') return;

  // SECURITY: Configure DOMPurify with secure defaults
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Add security attributes to links
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }

    // Remove any inline event handlers
    if ('on' in node) {
      const attributes = Array.from(node.attributes || []);
      attributes.forEach((attr: Attr) => {
        if (attr.name.startsWith('on')) {
          node.removeAttribute(attr.name);
        }
      });
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

export default function renderMarkdown(content: string, options: MarkdownOptions = {}): string {
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
    renderedContent = renderedContent
      .replace(/<a [^>]*>/g, '<span class="text-primary-button">')
      .replace(/<\/a>/g, '</span>');
  }

  // Disable syntax highlighting if requested
  if (disableHighlight) {
    renderedContent = renderedContent.replace(/<pre><code[^>]*>/g, '<pre><code>');
  }

  // SECURITY: Sanitize the final HTML with strict configuration
  // This prevents XSS attacks by removing dangerous HTML/JS
  return DOMPurify.sanitize(renderedContent, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'code',
      'pre',
      'ul',
      'ol',
      'li',
      'a',
      'img',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'span',
      'div',
      'hr',
    ],
    ALLOWED_ATTR: [
      'href',
      'src',
      'alt',
      'title',
      'class',
      'target',
      'rel',
      'width',
      'height',
      'align',
    ],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false,
  });
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
