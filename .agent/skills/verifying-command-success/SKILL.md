---
name: verifying-command-success
description:
  How to know whether a long-running or background command actually succeeded.
  Covers the shell pipeline exit-code trap, silent-empty results from analysis
  scripts, and services that report healthy while failing.
primary_type: diagnostic
category: engineering/patterns
department: tech
risk_tier: low
harmful_pattern_detection: false
---

# Verifying Command Success

Three failure modes where a command reports success it did not earn. Each was
observed on TNF, each produced a confidently wrong status report, and each is
invisible unless you check for it specifically.

## 1. A pipeline's exit code is the LAST stage's

```bash
pnpm tauri build 2>&1 | tail -40
echo $?          # tail's status. Always 0. Says nothing about the build.
```

This misreported a failed DMG build, a failed repack, and a failed guard test as
"exit 0" in a single session. The `| tail` was added to keep output readable,
which is exactly when it matters least that the status is honest.

Capture the real status immediately, before anything else runs:

```bash
pnpm tauri build > /tmp/build.log 2>&1
REAL_EXIT=$?
tail -40 /tmp/build.log
echo "exit=$REAL_EXIT"
```

Or set `set -o pipefail` so the pipeline takes the first non-zero status.

**Rule:** never report a build or test result from a command whose output you
piped, unless you captured `$?` before the pipe or enabled `pipefail`.

## 2. "No results" from a broken query looks like "nothing matches"

```js
try {
  return execFileSync('git', ['ls-files', '*'], { encoding: 'utf8' }).split(
    '\n'
  );
} catch {
  return []; // ENOBUFS here → every link looks dangling
}
```

`git ls-files '*'` exceeds execFileSync's 1 MB default buffer on this repo. The
`catch` turned a crash into an empty index, and the link checker then reported
every single link as broken — a specific, plausible, entirely wrong answer.

- Set `maxBuffer` generously (256 MB) for repo-wide listings.
- Do **not** catch-and-return-empty in a function whose emptiness is meaningful.
  Let it throw. A loud failure beats a silent wrong answer.
- Sanity-check the denominator: if a scan reports 0 of N valid, verify N first.

Related trap in zsh — an unquoted glob in a grep flag:

```bash
grep -rn "foo" --include=*.ts .    # zsh expands *.ts; wrong or no matches
grep -rn "foo" --include='*.ts' .  # correct
```

This produced a false "no callers found", which nearly justified deleting code
that was in fact used.

## 3. A health probe that causes the failure it reports

TNF's operator surface reported `API: OFFLINE` while the API was healthy
(`/health` returned 200 in 2 ms). `healthCheck()` polled the full `/api/agents`
list every 5 s and discarded the body; that traffic tripped the endpoint's own
rate limit, which returned 429, which the probe read as "down".

- Probe the cheapest endpoint that answers the actual question (`/health`), not
  a heavy one that happens to be nearby.
- Before believing a red status, hit the endpoint by hand. Ask whether the probe
  could be the cause.

## Checklist before reporting a result

- [ ] Did I capture the exit status before piping?
- [ ] If the answer is "zero" or "none", have I verified the input was
      non-empty?
- [ ] Did I read the actual output, or only the status?
- [ ] Could my measurement have caused what it measured?

See also [[tnf-honest-guard-review]], [[systematic-debugging]].
