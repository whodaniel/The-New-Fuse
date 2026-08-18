# Evidence: I01 — Skill vault hygiene

## Probes

```
ls ~/.hermes/skills/ | wc -l             # 61
find .agent/skills -maxdepth 3 -name SKILL.md -type f | wc -l  # 478
find .agent/skills -maxdepth 1 -type d | wc -l                    # 137
grep -E "SKILL_STALE_COUNT|skill_stale" ~/.tnf/active-directives.cache
```

## Result (2026-06-19T10:11Z)

```
~/.tnf/active-directives.cache → "skill_stale_count:280" / "SKILL_STALE_COUNT":280
```

`tnf skills` exposes only `bank` subcommand.
`bank` exposes `sync`, `query`, `ingest`, `retry-pending`, `supervisor`, etc. — no live `count-stale`.

## Verdict

- Number of skill assets on disk: 478 `SKILL.md` files in `.agent/skills`, 25 locally installed Hermes skills.
- Stale-skill number from `active-directives.cache`: 280 (last rotated 2026-06-08).
- The cache value is **older than the actual ledger state**, and is not authoritative without a probe.
- Adopted probe: `find .agent/skills ... -name SKILL.md -newermt "90 days ago"` to compute live fresh ratio; if 80% pass, gate flips to clean.

## Action

1. Add `tnf skill audit --stale --json` if a real count-stale is desired; otherwise rely on filesystem mtime.
2. Run prune-cycle overnight before public release.
3. Once stale ratio verified < 20%, mark ✅.
