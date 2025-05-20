import highlight from 'highlight.js';
import { getFileExtension } from '../directories.js';

interface HighlightOptions {
  language?: string;
  ignoreIllegals?: boolean;
}

export function highlightCode(code: string, options: HighlightOptions = {}): string {
  const { language, ignoreIllegals = true } = options;

  if (!code) return '';

  try {
    if (language && highlight.getLanguage(language)) {
      return highlight.highlight(code, { language, ignoreIllegals }).value;
    }

    return highlight.highlightAuto(code).value;
  } catch {
    return code;
  }
}

export function detectLanguage(code: string, filename?: string): string {
  // Try to detect from filename first
  if (filename) {
    const ext = getFileExtension(filename);
    if (ext && highlight.getLanguage(ext)) {
      return ext;
    }

    // Map common extensions to languages
    const extensionMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'rb': 'ruby',
      'rs': 'rust',
      'go': 'go',
      'java': 'java',
      'kt': 'kotlin',
      'php': 'php',
      'cs': 'csharp',
      'fs': 'fsharp',
      'sh': 'bash',
      'yml': 'yaml',
      'yaml': 'yaml',
    };

    if (ext && extensionMap[ext]) {
      return extensionMap[ext];
    }
  }

  // Try to detect from code content
  try {
    const result = highlight.highlightAuto(code);
    return result.language || '';
  } catch {
    return '';
  }
}

export function getLanguageIcon(language: string): string {
  // Map languages to icon classes (using your icon system)
  const iconMap: Record<string, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    python: 'python',
    java: 'java',
    ruby: 'ruby',
    go: 'go',
    rust: 'rust',
    cpp: 'cpp',
    csharp: 'csharp',
    php: 'php',
    swift: 'swift',
    kotlin: 'kotlin',
    html: 'html',
    css: 'css',
    sql: 'database',
    bash: 'terminal',
    shell: 'terminal',
    yaml: 'file-code',
    json: 'brackets-curly',
    markdown: 'markdown',
  };

  return iconMap[language] || 'file-code';
}

export function registerCustomLanguages(): void {
  // Add any custom language definitions here if needed
  // Example:
  // highlight.registerLanguage('custom', customLanguageDefinition);
}

// Initialize any custom languages
registerCustomLanguages();