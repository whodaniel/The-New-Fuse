import assert from 'node:assert/strict';
import {
  formatInlineMarkdown,
  highlightCodeLine,
  renderTuiMarkdown,
} from './tui-markdown-renderer.js';

console.log('Testing tui-markdown-renderer...');

// 1. Inline markdown formatting
const inline = formatInlineMarkdown('Use `const x = 10` and **bold** with *italic*.');
assert.ok(inline.includes('const x = 10'));
assert.ok(inline.includes('bold'));
assert.ok(inline.includes('italic'));

// 2. Syntax highlighting line
const highlighted = highlightCodeLine('import { foo } from "bar"; // comment');
assert.ok(highlighted.includes('import'));
assert.ok(highlighted.includes('comment'));

// 3. Render markdown with headings, code blocks and bullet points
const sampleMd = `# Overview
This is an agent response.

## Steps
- First step with \`code\`
- Second step

\`\`\`typescript
const answer = 42;
return answer;
\`\`\`
`;

const rendered = renderTuiMarkdown(sampleMd);
assert.ok(rendered.includes('# Overview'));
assert.ok(rendered.includes('## Steps'));
assert.ok(rendered.includes('First step'));
assert.ok(rendered.includes('── typescript ──'));
assert.ok(rendered.includes('const answer = 42;'));

// 4. Test <think> tag handling
const thinkMd = `<think>
Analyzing the codebase.
Checking permissions.
</think>
Here is the final recommendation.`;

const renderedThink = renderTuiMarkdown(thinkMd, { showThinking: true });
assert.ok(renderedThink.includes('Thinking'));
assert.ok(renderedThink.includes('Analyzing the codebase.'));
assert.ok(renderedThink.includes('Here is the final recommendation.'));

console.log('tui-markdown-renderer tests passed!');
