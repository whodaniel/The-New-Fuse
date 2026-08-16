---
name: tnf-skill-ubiquity-propagation
description: >-
  Make TNF skills and slash-commands ubiquitous across every agent runtime
  (claude, codex, gemini, opencode, kilo, hermes, tnf, agents, command-code,
  ...). Use when a runtime is missing the slash-commands family, when adding a
  new runtime root to the skill bank, when reconciling agent-definition wrappers
  across homes, or when "make all tnf skills available to X agent" is requested.
primary_type: protocol
category: engineering/skills
risk_tier: low
harmful_pattern_detection: false
---

# TNF Skill Ubiquity Propagation

TNF runs a multi-root skill topology. The ubiquity goal: every agent runtime
loads the same slash-commands family + TNF skills, and the skill bank indexes
every root. This is the propagation playbook (proven 2026-08-16 when
command-code was added).

## The topology

| Root                   | Role                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `~/.agents/skills/`    | Canonical ubiquity root: `*-slash-commands`, `skill-management`, `tnf-universal-slash-commands`, `tnf-full-auto-network-autopilot` |
| `~/.<runtime>/skills/` | Per-runtime global root (codex, claude, gemini, opencode, kilo, hermes, tnf, commandcode, augment, cursor)                         |
| `.agent/skills/`       | Repo project skills (171)                                                                                                          |
| `~/.tnf/skills/`       | TNF runtime root                                                                                                                   |
| `.agent/skill-bank/`   | Index: `skills-index.json`, `skills-summary.md`, `snapshots/<llm>/`                                                                |

## Adding a new runtime (e.g. command-code)

### 1. Skill-bank scan roots + origin labels

Edit `scripts/skills/skill-bank-sync.cjs`:

- `detectOriginLabel`: add
  `if (p.startsWith(\`${hm}/.<id>/\`)) return { llm: '<id>', scope: 'global' };`
  and for the shared root `if (p.startsWith(\`${hm}/.agents/\`))
  return { llm: 'agents', scope: 'global' };`
- `folderSkillRoots` + `flatSkillRoots`: add
  `path.join(home, '.<id>', 'skills')` and
  `path.join(home, '.agents', 'skills')`.

### 2. Reconcile target

Edit `scripts/agents/reconcile-agent-banks.cjs` targetMap:

```js
'<id>': [path.join(home, '.<id>', 'skills', 'imported-claude-agents')],
```

### 3. Frontload surface

Edit `scripts/install-agent-frontload.cjs` TARGETS:

```js
{ id: '<id>', runtime: '<Runtime>', scope: 'global', contextFile: path.join(HOME, '.<id>', 'AGENTS.md') },
```

### 4. Symlink the ubiquity family into the runtime root

```bash
cd ~/.<id>/skills
for s in claude-slash-commands codex-slash-commands gemini-slash-commands \
         hermes-slash-commands jules-slash-commands kilo-slash-commands \
         openclaw-slash-commands opencode-slash-commands <id>-slash-commands \
         skill-management tnf-universal-slash-commands tnf-full-auto-network-autopilot; do
  [ -e "$s" ] || ln -s "$HOME/.agents/skills/$s" "$s"
done
```

### 5. New slash-commands skill for the runtime

Create `~/.agents/skills/<id>-slash-commands/SKILL.md` (frontmatter: name +
description; body: session/context commands, tooling, TNF integration). Then
symlink it into every other runtime root that lacks it.

### 6. Propagate

```bash
node scripts/skills/skill-bank-sync.cjs                 # refresh index (adds <id> + agents llm)
node scripts/agents/reconcile-agent-banks.cjs --targets all   # 11 runtime targets, ~138 wrappers
```

## Verification

```bash
for r in ~/.claude/skills ~/.codex/skills ~/.gemini/skills ~/.opencode/skills \
         ~/.kilo/skills ~/.hermes/skills ~/.tnf/skills ~/.agents/skills ~/.<id>/skills; do
  echo "$(basename $r): $(ls $r | grep -c 'slash-commands') slash-cmd"
done
# every root >= 9; the <id>-slash-commands skill reachable in each
ls ~/.<id>/skills/imported-claude-agents/ | wc -l        # ~138 agent wrappers
tnf skill list --json | grep <id>                        # CLI sees the skills
```

## Notes / traps

- **Symlinks are not isDirectory()**: the skill-bank walker must treat a
  symlinked dir as a dir (fixed 2026-08-16) and skip broken symlinks — a
  dangling link throws ENOENT and aborts the whole sync.
- **Command Code reads `~/.agents/skills/` natively** (Agent Skills standard)
  and `~/.commandcode/skills/` takes priority on name conflicts. Other runtimes
  vary — check the runtime's docs before assuming discovery.
- **Skill governance** requires frontmatter keys `primary_type`, `category`,
  `risk_tier`, `harmful_pattern_detection` in repo-tracked skills; the legacy
  `~/.agents/skills` family predates that and is exempt from the repo gate.
- Never create parallel registries: extend the existing skill-bank / reconcile /
  frontload lists, which is the single source of truth.
