import { detectLanguage, highlightCode } from './highlight.js';

interface CodeBlock {
  language: string;
  code: string;
  highlighted: string;
}

interface ParseOptions {
  detectFromContent?: boolean;
  highlightCode?: boolean;
}

export function parseCodeBlock(block: string, options: ParseOptions = {}): CodeBlock {
  const { detectFromContent = true, highlightCode: shouldHighlight = true } = options;

  // Remove triple backticks and get language if specified
  const match = block.match(/^```(\w*)\n([\s\S]*?)```$/);
  if (!match) {
    return {
      language: '',
      code: block,
      highlighted: shouldHighlight ? highlightCode(block) : block
    };
  }

  let [, language, code] = match;
  code = code.trim();

  // Detect language if not specified and detection is enabled
  if (!language && detectFromContent) {
    language = detectLanguage(code);
  }

  return {
    language,
    code,
    highlighted: shouldHighlight ? highlightCode(code, { language }) : code
  };
}

export function extractCodeBlocks(content: string): CodeBlock[] {
  const codeBlockRegex = /```[\s\S]*?```/g;
  const matches = content.match(codeBlockRegex);
  
  if (!matches) return [];

  return matches.map(block => parseCodeBlock(block));
}

export function wrapInCodeBlock(code: string, language = ''): string {
  return `\`\`\`${language}\n${code}\n\`\`\``;
}

export function isCodeBlock(text: string): boolean {
  return /^```[\s\S]*?```$/.test(text.trim());
}

export function getLanguageLabel(language: string): string {
  const languageLabels: Record<string, string> = {
    js: 'JavaScript',
    javascript: 'JavaScript',
    ts: 'TypeScript',
    typescript: 'TypeScript',
    jsx: 'React JSX',
    tsx: 'React TSX',
    py: 'Python',
    python: 'Python',
    rb: 'Ruby',
    java: 'Java',
    cpp: 'C++',
    cs: 'C#',
    php: 'PHP',
    go: 'Go',
    rust: 'Rust',
    swift: 'Swift',
    kotlin: 'Kotlin',
    sql: 'SQL',
    html: 'HTML',
    css: 'CSS',
    shell: 'Shell',
    bash: 'Bash',
    yaml: 'YAML',
    json: 'JSON',
    xml: 'XML',
    markdown: 'Markdown',
    md: 'Markdown'
  };

  return languageLabels[language.toLowerCase()] || language;
}