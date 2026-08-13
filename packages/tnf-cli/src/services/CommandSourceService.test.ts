/**
 * Discovery guard for the cross-runtime command index.
 *
 * The gap this closes: TNF writes commands, agents and skills into the peer
 * CLIs it runs beside (.claude/, .agent/, .gemini/, .cursor/, .codex/, .pi/)
 * and, before this service, could not see any of them from its own CLI —
 * `ProjectConfigService` read only `.tnf/command/*.md`, a directory that does
 * not exist in this repo.
 *
 * Everything here runs against a synthetic tree in a temp dir, so the
 * assertions do not drift when the real repo's 795 definitions change.
 *
 * Run: pnpm --filter @the-new-fuse/tnf-cli test
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CommandSourceService, parseFrontmatter } from './CommandSourceService.js';

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    console.log(`  PASS  ${name}`);
    pass += 1;
  } else {
    console.log(`  FAIL  ${name} ${detail}`);
    fail += 1;
  }
}

console.log('\ncommand sources — frontmatter parsing');

check(
  'no frontmatter yields the whole body',
  parseFrontmatter('# Title\nbody').body === '# Title\nbody'
);
check(
  'plain scalar',
  parseFrontmatter('---\ndescription: hello\n---\nbody').fields.description === 'hello'
);
check(
  'double-quoted scalar is unquoted',
  parseFrontmatter('---\ndescription: "hello"\n---\nbody').fields.description === 'hello'
);
check(
  'single-quoted scalar is unquoted',
  parseFrontmatter("---\ndescription: 'hello'\n---\nbody").fields.description === 'hello'
);
// The real .agent/skills/*/SKILL.md files fold long descriptions across lines.
check(
  'folded multi-line scalar is joined',
  parseFrontmatter('---\ndescription:\n  line one\n  line two\n---\nbody').fields.description ===
    'line one line two',
  parseFrontmatter('---\ndescription:\n  line one\n  line two\n---\nbody').fields.description
);
check(
  'a following list key ends the fold',
  parseFrontmatter('---\ndescription:\n  only this\nread_when:\n  - something\n---\nb').fields
    .description === 'only this'
);
check('body excludes the frontmatter', parseFrontmatter('---\nname: x\n---\nbody').body === 'body');
check(
  'unterminated frontmatter is treated as body',
  parseFrontmatter('---\nname: x\nbody').fields.name === undefined
);

console.log('\ncommand sources — discovery across runtimes');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-sources-'));
const home = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-sources-home-'));

function write(rel: string, content: string, base = root): void {
  const target = path.join(base, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

try {
  write('.claude/commands/deploy.md', '---\ndescription: Deploy the stack\n---\nRun the deploy.');
  write('.claude/commands/README.md', '# not a command');
  write(
    '.claude/agents/registry-manager.md',
    '---\nname: registry-manager\ndescription: Manages the registry\n---\nBody.'
  );
  write(
    '.agent/skills/browser/SKILL.md',
    '---\nname: browser\ndescription: Drive a browser\n---\nBody.'
  );
  // Grouped skill libraries nest one level deeper in the real repo.
  write(
    '.agent/skills/anthropic/pdf/SKILL.md',
    '---\nname: pdf\ndescription: Read PDFs\n---\nBody.'
  );
  write('.gemini/commands/summarize.md', '---\ndescription: Summarize input\n---\nBody.');
  write('.cursor/commands/refactor.md', '---\ndescription: Refactor code\n---\nBody.');
  write('.codex/prompts/plan.md', '---\ndescription: Plan the work\n---\nBody.');
  write('.pi/prompts/review.md', '---\ndescription: Review the diff\n---\nBody.');
  write('.tnf/command/native.md', '---\ndescription: A native TNF command\n---\nBody.');
  // Same name in both scopes — project must win.
  write('.claude/commands/shared.md', '---\ndescription: PROJECT version\n---\nBody.');
  write('.claude/commands/shared.md', '---\ndescription: USER version\n---\nBody.', home);
  write('.claude/commands/user-only.md', '---\ndescription: Only in user scope\n---\nBody.', home);
  // No frontmatter at all — description falls back to the first prose line.
  write('.claude/commands/bare.md', '# Heading\n\nFirst prose line here.\n');

  const service = new CommandSourceService(root, home);
  const all = service.discover();
  const byName = (name: string) => all.find((entry) => entry.name === name);

  check('finds .claude/commands', byName('deploy')?.runtime === 'claude');
  check('finds .claude/agents', byName('registry-manager')?.kind === 'agent');
  check('finds .agent/skills', byName('browser')?.kind === 'skill');
  check(
    'walks nested skill libraries',
    byName('pdf')?.kind === 'skill',
    JSON.stringify(byName('pdf'))
  );
  check('finds .gemini/commands', byName('summarize')?.runtime === 'gemini');
  check('finds .cursor/commands', byName('refactor')?.runtime === 'cursor');
  check('finds .codex/prompts', byName('plan')?.kind === 'prompt');
  check('finds .pi/prompts', byName('review')?.kind === 'prompt');
  check('finds .tnf/command', byName('native')?.runtime === 'tnf');
  check('finds user-scope entries', byName('user-only')?.scope === 'user');

  check('skips README.md', !byName('README'));
  check('reads the description', byName('deploy')?.description === 'Deploy the stack');
  check(
    'falls back to first prose line when there is no frontmatter',
    byName('bare')?.description === 'First prose line here.',
    byName('bare')?.description
  );
  check(
    'agents are named by frontmatter, not filename',
    byName('registry-manager')?.filePath.endsWith('registry-manager.md') === true
  );

  check(
    'project scope shadows user scope',
    byName('shared')?.description === 'PROJECT version',
    byName('shared')?.description
  );
  check(
    'the shadowed duplicate is dropped, not listed twice',
    all.filter((e) => e.name === 'shared').length === 1
  );

  check(
    'bodies are not read during discovery',
    all.every((e) => e.body === undefined)
  );
  check('loadBody reads on demand', service.loadBody(byName('deploy')!) === 'Run the deploy.');
  check(
    'loadBody strips frontmatter',
    !service.loadBody(byName('deploy')!).includes('description:')
  );

  const summary = service.summary();
  check(
    'summary groups by runtime and kind',
    summary.some((r) => r.runtime === 'claude' && r.kind === 'command')
  );
  check(
    'summary counts add up to the index size',
    summary.reduce((sum, r) => sum + r.count, 0) === all.length
  );

  console.log('\ncommand sources — missing directories');
  const emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-sources-empty-'));
  try {
    const empty = new CommandSourceService(emptyRoot, emptyRoot);
    check(
      'a tree with no command dirs yields nothing, and does not throw',
      empty.discover().length === 0
    );
  } finally {
    fs.rmSync(emptyRoot, { recursive: true, force: true });
  }
} finally {
  fs.rmSync(root, { recursive: true, force: true });
  fs.rmSync(home, { recursive: true, force: true });
}

console.log(`\ncommand-sources: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
