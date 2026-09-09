/**
 * Advertised-tool / executor parity oracle.
 *
 * WHY THIS EXISTS
 *   `llm-tools.ts` advertises a tool catalogue to the model. `agents-run.ts`
 *   implements them in a switch. Nothing connected the two, and on 2026-08-16
 *   four tools (`todo_add`, `todo_list`, `todo_update`, `todo_done`) shipped as
 *   advertised-with-no-executor: the model could call them, and every call fell
 *   through to `unknown tool`. A tool the model is told it has, and does not,
 *   is worse than no tool — it burns turns and produces confident nonsense.
 *
 * WHAT IT CHECKS
 *   Every default-enabled builtin tool name has a `case '<name>':` in the
 *   executor switch. Nothing more — it does not prove the executor is correct.
 *
 * THE ALLOW-LIST IS DEBT, NOT PERMISSION
 *   KNOWN_MISSING records tools that are already advertised without an executor.
 *   It exists so this oracle can be green on a repo that already has the defect
 *   while still blocking NEW instances. Fixing a todo_* tool means deleting its
 *   line here. Adding a line is not a fix.
 */
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUILTIN_TOOLS } from './llm-tools.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const executorSource = fs.readFileSync(
  path.join(here, '..', 'commands', 'agents-run.ts'),
  'utf8'
);

/** Pre-existing advertised-without-executor debt. Shrink this; never grow it. */
const KNOWN_MISSING = new Set(['todo_add', 'todo_list', 'todo_update', 'todo_done']);

const executed = new Set(
  [...executorSource.matchAll(/case\s+'([a-z0-9_]+)'\s*:/gi)].map((m) => m[1] as string)
);

let failures = 0;

for (const tool of BUILTIN_TOOLS.filter((t) => t.defaultEnabled)) {
  const hasExecutor = executed.has(tool.name);
  if (KNOWN_MISSING.has(tool.name)) {
    if (hasExecutor) {
      console.error(
        `FAIL ${tool.name} now has an executor — remove it from KNOWN_MISSING in this test.`
      );
      failures += 1;
    } else {
      console.log(`known-gap ${tool.name} (advertised, no executor)`);
    }
    continue;
  }
  if (!hasExecutor) {
    console.error(
      `FAIL ${tool.name} is advertised in llm-tools.ts but has no case in agents-run.ts.`
    );
    failures += 1;
  }
}

// The tools this change adds must be genuinely wired, not merely advertised.
for (const name of ['graph_query', 'graph_path', 'graph_explain']) {
  assert.ok(
    BUILTIN_TOOLS.some((t) => t.name === name),
    `${name} should be advertised in llm-tools.ts`
  );
  assert.ok(executed.has(name), `${name} should have an executor case in agents-run.ts`);
}

if (failures > 0) {
  console.error(`\n${failures} advertised tool(s) have no executor.`);
  process.exit(1);
}

console.log(`ok — ${BUILTIN_TOOLS.length} builtin tools checked, ${KNOWN_MISSING.size} known gaps`);
