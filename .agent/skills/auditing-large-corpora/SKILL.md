---
name: auditing-large-corpora
description:
  How to measure and classify a repo-scale corpus (docs, skills, agents) without
  producing confident wrong numbers. Covers catch-all buckets, identity and
  dedup keys, and repairing link rot mechanically without inventing targets.
primary_type: diagnostic
category: engineering/patterns
risk_tier: low
harmful_pattern_detection: false
---

# Auditing Large Corpora

For repo-scale inventories — 1,300 docs, 1,600 skill files, hundreds of agents.
The hazard is not that the audit fails; it is that it **succeeds with wrong
numbers**, because every bucket is populated and every total adds up.

## A fallback in a classifier becomes a catch-all

Building the TNF skill taxonomy, classification matched skill name *and* path:

```js
const hay = `${name} ${file}`;              // WRONG
for (const [domain, re] of DOMAINS) if (re.test(hay)) return domain;
```

Every skill lives under `.agent/skills/`, so the `agent|fleet|…` pattern matched
the *path* of essentially everything. Result: 322 of 589 skills in one bucket,
including `2d-games`, `algolia-search`, and `azure-functions`. Restricting to a
"meaningful path" only moved the problem — the next fallback sorted
`multiplayer` and `yeet` into `skill-authoring`.

Fixes, in order of importance:

- **Classify on the one field that carries intent.** A skill's directory is its
  own slug; the path adds no information the name lacks. Drop the fallback.
- **Let unmatched items be `uncategorised`.** That bucket is the taxonomy's
  coverage metric. A fallback hides the gap; an honest bucket sizes it.
- **Order patterns specific → general**, since first match wins.
- **Watch substring collisions.** `product` matched "Production", filing
  `Linux Production Shell Scripts` under business-growth. Use `\bproducts?\b`.

**Always sample your biggest bucket before trusting the histogram.** Print 30
random members. If they do not obviously belong together, the bucket is a lie —
and it is the bucket you would otherwise quote in the summary.

## Identity: pick a dedup key deliberately

The same corpus contained `Burp Suite Web Application Testing` and
`burp-suite-web-application-testing` — one skill, counted twice. Fold case and
separators for identity, keep a preferred spelling for display:

```js
const dedupKey = (n) => n.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '');
```

Folding changed unique count 589 → 575 and *raised* detected divergence 60 → 72,
because case-variants with different bodies were finally compared. Better dedup
surfaces more conflict, not less — a drop in conflicts after a dedup change is a
signal you merged away real differences.

Also sanitize parsed fields. Malformed frontmatter (`name:` and `description:`
on one line) yielded the skill name
`"clawhub-skill-scout description: Discover and rank ClawHub skills using"`.
Cut at the first embedded key and cap length.

## Repairing link rot without inventing targets

1,304 docs held 566 dangling links, 548 pointing into archive paths. The rot was
mechanical — files were archived without updating references — so most targets
still existed under a new path.

Rewrite only when the target is **unambiguous**: exactly one file matches the
basename, or several match but exactly one is outside an archive directory.

Two rules that matter more than the matching:

- **Never point a live doc at archived content.** Resolving a break to an
  archive copy looks like a repair but silently makes stale material
  authoritative — worse than leaving the break visible.
- **Report ambiguity, never guess it.** A wrong link is worse than a known-broken
  one.

Result: valid links 432 → 851, dangling 697 → 278, 60 docs touched, idempotent
on a second run. The remainder are genuinely absent targets — a human call.

## Report the denominator and the compression

Useful audit numbers are ratios against a stated total, not raw counts:

| Measure | Value |
| --- | --- |
| skill corpus, full bodies | ~2,326k tokens |
| all frontmatter | ~128k tokens |
| Tier-0 domain manifest | ~4.8k tokens |

Both pre-existing tiers were too large to load, which means in practice neither
was loaded and the network was not discoverable at all. That conclusion is only
visible once the totals are measured rather than assumed.

Run `node scripts/skills/build-skill-manifest.cjs --check` and
`node scripts/docs/repair-doc-links.cjs` (dry run by default) to reproduce.

See also [[verifying-command-success]], [[master-of-taxonomies]].
