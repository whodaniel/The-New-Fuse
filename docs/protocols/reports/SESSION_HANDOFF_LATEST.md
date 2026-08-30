# Session Handoff: @the-new-fuse/agent-adapters Bootstrap

**Handoff ID:** `c7f3a821-4e59-4b2d-a1d8-9f0e2b3c5d7e`  
**Supersedes:** `a44d535c-f1ba-495e-bbcb-2455c691dffc`  
**Created:** 2026-08-30T21:27:00Z  
**Agent:** antigravity  
**Branch:** `main` @ `25bf5505f`

---

## Work Completed

Bootstrapped the `@the-new-fuse/agent-adapters` package from scratch,
reconstructing the TypeScript source from the compiled `dist/` artifact left by
opencode.

### Files Created

| File                                                                   | Purpose                                   |
| ---------------------------------------------------------------------- | ----------------------------------------- |
| `packages/agent-adapters/src/GoogleAgentsCliAdapter.ts`                | Adapter source (reconstructed from dist)  |
| `packages/agent-adapters/src/index.ts`                                 | Barrel export                             |
| `packages/agent-adapters/src/__tests__/GoogleAgentsCliAdapter.test.ts` | 17 vitest tests                           |
| `packages/agent-adapters/package.json`                                 | Package manifest, zero runtime deps       |
| `packages/agent-adapters/tsconfig.json`                                | TypeScript build config                   |
| `packages/agent-adapters/vitest.config.ts`                             | Test runner config                        |
| `packages/agent-adapters/SKILL.md`                                     | Usage docs + roadmap                      |
| `packages/agent-adapters/.gitignore`                                   | Excludes dist/                            |
| `pnpm-lock.yaml`                                                       | Updated (pnpm install registered package) |

### Test Results

```
✓ src/__tests__/GoogleAgentsCliAdapter.test.ts (17 tests) 18ms
Test Files  1 passed (1)
     Tests  17 passed (17)
```

### Build

`pnpm build` (tsc -b) exits cleanly. No type errors.

---

## Next Actions (Open Roadmap, items 3–7)

1. **MicroToolAdapter** — wrap any `MicroTool` as legacy `ToolHandler` so
   mcp-server/broker surfaces serve stateless tools automatically (item 3)
2. **CLI commands** — `tnf ga:invoke`, `tnf ga:status`, `tnf ga:map-error` —
   requires `tnf-command-surface-gate` oracle update (item 5)
3. **Live transport** — `--transport stdio|http` behind adapter for real Google
   Agents CLI round-trip (item 6)
4. **Skill ubiquity** — propagate via `tnf-skill-ubiquity-propagation` to
   `.opencode/skills`, `.claude/skills` etc. (item 7)

---

## Resume Checklist

- [ ] Implement `MicroToolAdapter` in `packages/agent-adapters/src/`
- [ ] Add `tnf ga:*` commands to `packages/tnf-cli/src/commands/`
- [ ] Update command-surface oracle snapshot after CLI changes
- [ ] Wire live transport and run one end-to-end round-trip
- [ ] Run `tnf-skill-ubiquity-propagation` to propagate SKILL.md

---

`TNF_PROTOCOL_ACK` · handoff `c7f3a821-4e59-4b2d-a1d8-9f0e2b3c5d7e` · agent:
antigravity · 2026-08-30T21:31:00Z
