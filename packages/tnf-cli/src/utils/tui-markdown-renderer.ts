import chalk from 'chalk';

export interface RenderMarkdownOptions {
  showThinking?: boolean;
  indent?: string;
  maxThinkingLines?: number;
}

const JS_TS_KEYWORDS = new Set([
  'import',
  'from',
  'export',
  'default',
  'const',
  'let',
  'var',
  'function',
  'return',
  'if',
  'else',
  'for',
  'while',
  'switch',
  'case',
  'break',
  'continue',
  'async',
  'await',
  'class',
  'extends',
  'implements',
  'interface',
  'type',
  'new',
  'try',
  'catch',
  'finally',
  'throw',
  'typeof',
  'instanceof',
  'void',
  'this',
  'super',
  'null',
  'undefined',
  'true',
  'false',
  'def',
  'elif',
  'pub',
  'fn',
  'struct',
  'impl',
  'mut',
  'match',
  'enum',
]);

/**
 * Basic terminal syntax highlighting for common code blocks (TS, JS, Python, Rust, Bash, JSON).
 */
export function highlightCodeLine(line: string, _lang?: string): string {
  // Comments
  if (/^\s*(\/\/|#)/.test(line)) {
    return chalk.dim(line);
  }

  // Tokenize words, strings, numbers, operators
  return line.replace(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b\d+(?:\.\d+)?\b|\b[a-zA-Z_$][a-zA-Z0-9_$]*\b)/g,
    (match) => {
      if (/^["'`]/.test(match)) {
        return chalk.green(match);
      }
      if (/^\d/.test(match)) {
        return chalk.yellow(match);
      }
      if (JS_TS_KEYWORDS.has(match)) {
        return chalk.magenta(match);
      }
      return match;
    }
  );
}

/**
 * Renders an assistant response containing markdown, code fences, and <think> CoT blocks
 * into rich ANSI-styled terminal output.
 */
export function renderTuiMarkdown(content: string, options: RenderMarkdownOptions = {}): string {
  if (!content) return '';

  const indent = options.indent ?? '  ';
  const showThinking = options.showThinking ?? process.env.TNF_SHOW_THINKING === '1';
  const maxThinkingLines = options.maxThinkingLines ?? 15;

  let processed = content;

  // 1. Process <think>...</think> reasoning blocks
  processed = processed.replace(/<think>([\s\S]*?)(?:<\/think>|$)/gi, (_match, rawThought) => {
    const thoughtLines = (rawThought || '')
      .trim()
      .split('\n')
      .map((l: string) => l.trimEnd());
    if (!thoughtLines.length || (thoughtLines.length === 1 && !thoughtLines[0])) {
      return '';
    }

    if (!showThinking && thoughtLines.length > maxThinkingLines) {
      return `\n${indent}${chalk.dim.italic(`💭 Thought process (${thoughtLines.length} lines hidden — set TNF_SHOW_THINKING=1 to view)`)}\n`;
    }

    const renderedThought = thoughtLines
      .map((l: string) => `${indent}${chalk.dim('│')} ${chalk.dim.italic(l)}`)
      .join('\n');

    return (
      `\n${indent}${chalk.dim('┌─ 💭 Thinking ' + '─'.repeat(30))}\n` +
      renderedThought +
      `\n${indent}${chalk.dim('└' + '─'.repeat(44))}\n`
    );
  });

  const lines = processed.split('\n');
  const output: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code block boundaries
    const codeMatch = trimmed.match(/^```([a-zA-Z0-9_-]*)/);
    if (codeMatch && !inCodeBlock) {
      inCodeBlock = true;
      codeBlockLang = codeMatch[1] || 'text';
      const header = `── ${codeBlockLang} ` + '─'.repeat(Math.max(4, 46 - codeBlockLang.length));
      output.push(`${indent}${chalk.dim('┌' + header)}`);
      continue;
    }
    if (trimmed === '```' && inCodeBlock) {
      inCodeBlock = false;
      output.push(`${indent}${chalk.dim('└' + '─'.repeat(50))}`);
      codeBlockLang = '';
      continue;
    }

    if (inCodeBlock) {
      output.push(`${indent}${chalk.dim('│ ')}${highlightCodeLine(rawLine, codeBlockLang)}`);
      continue;
    }

    // Horizontal Rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      output.push(`${indent}${chalk.dim('─'.repeat(48))}`);
      continue;
    }

    // Headings
    if (/^###\s+/.test(trimmed)) {
      const text = trimmed.replace(/^###\s+/, '');
      output.push(`\n${indent}${chalk.bold.blueBright('### ' + text)}`);
      continue;
    }
    if (/^##\s+/.test(trimmed)) {
      const text = trimmed.replace(/^##\s+/, '');
      output.push(`\n${indent}${chalk.bold.cyanBright('## ' + text)}`);
      continue;
    }
    if (/^#\s+/.test(trimmed)) {
      const text = trimmed.replace(/^#\s+/, '');
      output.push(`\n${indent}${chalk.bold.magentaBright('# ' + text)}`);
      continue;
    }

    // Bullet points
    const bulletMatch = rawLine.match(/^(\s*)([-*•]|\d+\.)\s+(.*)$/);
    if (bulletMatch) {
      const leadingSpace = bulletMatch[1];
      const bulletMarker = bulletMatch[2];
      const rest = bulletMatch[3];
      const formattedRest = formatInlineMarkdown(rest);
      output.push(`${indent}${leadingSpace}${chalk.cyan(bulletMarker)} ${formattedRest}`);
      continue;
    }

    // Blockquotes
    if (/^>\s*/.test(trimmed)) {
      const text = trimmed.replace(/^>\s*/, '');
      output.push(`${indent}${chalk.dim('│ ')}${chalk.dim.italic(formatInlineMarkdown(text))}`);
      continue;
    }

    // Ordinary prose line
    output.push(`${indent}${formatInlineMarkdown(rawLine)}`);
  }

  return output.join('\n');
}

/**
 * Formats inline backticks, bold, and italic markers within a single line of text.
 */
export function formatInlineMarkdown(line: string): string {
  if (!line) return '';

  let out = line;

  // Inline code: `code`
  out = out.replace(/`([^`]+)`/g, (_match, code) => chalk.yellow(`\`${code}\``));

  // Bold: **text** or __text__
  out = out.replace(/(\*\*|__)(.*?)\1/g, (_match, _d, text) => chalk.bold(text));

  // Italic: *text* (not surrounded by other asterisks)
  out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_match, text) => chalk.italic(text));

  return out;
}
