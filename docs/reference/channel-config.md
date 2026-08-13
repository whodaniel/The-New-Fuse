# Channel Configuration Reference

User-editable messaging-channel registry for the locally-installed harness.

- **File:** `~/.config/tnf/channels.json` (optional)
- **Override path:** `TNF_CHANNEL_CONFIG_PATH`
- **Implementation:** `packages/tnf-cli/src/services/channel-config.ts`
- **Inspect:** `tnf channels status`

With no file present, TNF uses the built-in channel definitions and reports
`source: "defaults"`.

## Why this exists

The Slack and WhatsApp services read eight environment variables hardcoded
across four source files, and none of the eight appeared in `.env.example`. A
user running the open-source harness locally had no discoverable way to
configure channels short of reading service source — the same defect as the
hardcoded provider list this file's sibling (`provider-config.md`) replaced.

**Scope:** local configuration only. It changes how one installation reads its
own credentials and toggles. It does not affect TWIP/A2A envelope handling,
federated identity, or anything crossing the SaaS boundary.

## Secrets do not live here

Each credential declares **which environment variable holds it**, never the
value:

```jsonc
{
  "channels": [
    {
      "id": "slack",
      "enabled": true,
      "credentials": [
        { "key": "botToken", "env": "TNF_SLACK_BOT_TOKEN", "required": true },
      ],
      "settings": {},
    },
  ],
}
```

A literal secret in this file (`value`, `token`) is **reported as a warning and
discarded**, not consumed. Put the actual values in your environment or `.env` —
see `.env.example`.

## Merge semantics

An override layer, not a replacement — identical rules to `provider-config`:

- Channels merge over built-ins **by `id`**; omitted fields are inherited.
- Built-in channels you do not mention are **preserved**.
- Set `"enabled": false` to take a channel out of resolution while keeping it
  visible for diagnostics.
- A channel left with no credentials is dropped **with a warning**.

## Readiness

`tnf channels status` reports three states, not pass/fail:

| State                 | Meaning                                                        |
| --------------------- | -------------------------------------------------------------- |
| `ready`               | enabled, all required credentials present                      |
| `disabled`            | `enabled: false` — a deliberate choice, not a fault            |
| `missing-credentials` | enabled but required variables unset; the **names** are listed |

Before this existed, the only way to learn whether a channel was configured was
to run `slack start` and see whether it threw — collapsing "not configured",
"deliberately off", and "actually broken" into one stack trace, and requiring a
side effect to answer a read-only question.

Output never prints credential values, so it is safe to paste into an issue.

## Degradation rules

Never fails closed; never fails silently:

| Condition                      | Result            | Reported                |
| ------------------------------ | ----------------- | ----------------------- |
| File absent                    | built-in defaults | no warning (normal)     |
| Malformed JSON                 | built-in defaults | warning naming the file |
| `channels` not an array        | built-in list     | warning                 |
| Entry without `id`             | dropped           | warning with index      |
| Credential without `key`/`env` | dropped           | warning                 |
| Literal secret in a credential | discarded         | warning                 |
| Unknown setting type           | ignored           | warning                 |

`tnf channels status` exits non-zero only when the config itself is malformed.
Missing credentials are a configuration state, not a crash.

## Examples

Disable WhatsApp and move Slack's token to a different variable:

```json
{
  "channels": [
    { "id": "whatsapp", "enabled": false },
    {
      "id": "slack",
      "credentials": [
        { "key": "botToken", "env": "WORK_SLACK_BOT_TOKEN", "required": true },
        {
          "key": "signingSecret",
          "env": "TNF_SLACK_SIGNING_SECRET",
          "required": true
        },
        { "key": "appToken", "env": "TNF_SLACK_APP_TOKEN", "required": true }
      ]
    }
  ]
}
```

Change the WhatsApp webhook port:

```json
{ "channels": [{ "id": "whatsapp", "settings": { "webhookPort": 8443 } }] }
```

## Verification

```bash
pnpm --filter @the-new-fuse/tnf-cli test   # includes channel-config.test.ts
tnf channels status --json
```
