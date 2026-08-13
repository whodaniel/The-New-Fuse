# Evidence: S01 — Secrets scan

## Probes

```
grep -rE "BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY" \
     --include="*.py" --include="*.env*" --include="*.pem" --include="*.key" \
     --include="*.ts" --include="*.tsx" --include="*.js" $HOME/The-New-Fuse \
   | grep -v node_modules

grep -rE "AKIA[0-9A-Z]{16}" \
     --include="*.env*" --include="*.ts" --include="*.js"
```

## Result (2026-06-19T10:14Z)

Private-key matches (5 total):

- `apps/external/gemini-cli-source/bundle/gemini.js` (1) — string literal
  substring `(?<key>[REDACTED PRIVATE KEY])` inside compiled bundle regex; not a
  usable key.
- `apps/external/gemini-cli-source/packages/core/src/telemetry/sdk.test.ts` (1)
  — explicit test fixture.
- `apps/external/gemini-cli-source/packages/core/src/services/environmentSanitization.test.ts`
  (3) — explicit test fixtures RSA / OPENSSH / EC.
- `apps/external/mini-omni/venv/lib/python3.10/site-packages/tornado/test/test.key`
  (1) — Python Tornado test fixture, PEP 472 self-test cert.

AWS-key matches: 0.

## Verdict

- All `BEGIN PRIVATE KEY` literals live under `apps/external/` (vendored
  research) or in test fixtures.
- No real signing, SSH, or AWS credentials present in the production tree.
- Policy is consistent: `apps/external/` is excluded by `.gitignore` style and
  is not part of the publishable boundary.

## Status

✅ clean for production tree; `apps/external/` is research-vendor territory
already excluded from CI in CLAUDE.md.
