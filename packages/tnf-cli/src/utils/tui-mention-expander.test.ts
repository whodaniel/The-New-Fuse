import assert from 'node:assert/strict';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expandPromptMentions } from './tui-mention-expander.js';

console.log('Testing tui-mention-expander...');

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// 1. Plain text with no mentions
const res1 = expandPromptMentions('Hello how are you?');
assert.equal(res1.expandedPrompt, 'Hello how are you?');
assert.equal(res1.attachments.length, 0);

// 2. Email addresses must not match as mentions
const res2 = expandPromptMentions('Contact me at test@example.com please');
assert.equal(res2.attachments.length, 0);

// 3. Mention of an existing file
const res3 = expandPromptMentions(
  'Please check @tui-markdown-renderer.ts and summarize it',
  currentDir
);
assert.equal(res3.attachments.length, 1);
assert.equal(res3.attachments[0].name, '@tui-markdown-renderer.ts');
assert.ok(
  res3.expandedPrompt.includes('[Context attached by operator: @tui-markdown-renderer.ts]')
);
assert.ok(res3.expandedPrompt.includes('renderTuiMarkdown'));
assert.ok(res3.expandedPrompt.includes('Please check @tui-markdown-renderer.ts'));

// 4. Git status mention
const res4 = expandPromptMentions('What changed in @git:status ?', currentDir);
assert.equal(res4.attachments.length, 1);
assert.equal(res4.attachments[0].name, '@git:status');
assert.ok(res4.expandedPrompt.includes('[Context attached by operator: @git:status]'));

console.log('tui-mention-expander tests passed!');
