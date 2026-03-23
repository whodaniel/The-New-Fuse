#!/usr/bin/env node

const changedFiles = process.argv.slice(2).filter(Boolean);

if (process.env.TNF_ALLOW_PRIVATE_DOC_PUSH === "1") {
  process.exit(0);
}

const blockedPathMatchers = [
  /^reports\/personal-archaeology\//,
  /^apps\/api\/data\/unified-task-ledger\.json$/,
  /^\.agent\/handoff_notes\.txt$/,
  /^\.agent\/memories\.md$/,
  /^\.agent\/runtime-state\.json$/,
  /^\.agent\/jules-logs\//,
  /^\.agent\/session-logs\//,
  /^docs\/strategy\//,
  /^docs\/session-\d{4}-\d{2}-\d{2}.*\.md$/i,
  /^docs\/UNIFIED_LEDGER_TIMELINE_GOALS_PLAN\.md$/,
  /^docs\/TNF_DELEGATION_RUN_\d{4}-\d{2}-\d{2}\.md$/,
  /^docs\/project-management\/.*(PLAN|ROADMAP|INVENTORY|SUMMARY|audit|analysis).*\.md$/i,
];

function isBlocked(filePath) {
  return blockedPathMatchers.some((pattern) => pattern.test(filePath));
}

const blocked = changedFiles.filter(isBlocked);

if (blocked.length === 0) {
  process.exit(0);
}

console.error("\n[doc-gate] Push blocked: private planning/session docs detected.");
console.error("[doc-gate] These files are configured as local-only:\n");
for (const filePath of blocked) {
  console.error(`  - ${filePath}`);
}
console.error(
  "\n[doc-gate] If this push is intentional, rerun with TNF_ALLOW_PRIVATE_DOC_PUSH=1."
);
console.error("[doc-gate] Example: TNF_ALLOW_PRIVATE_DOC_PUSH=1 git push\n");
console.error(
  "[doc-gate] Cloud-first handoff guidance: docs/protocols/AGENT_TARGETED_HANDOFF_V1.md\n"
);
process.exit(1);
