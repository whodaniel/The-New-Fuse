# OpenClaw GLM 4.7 Configuration

The New Fuse now runs OpenClaw with GLM 4.7 by default so that the agent ecosystem benefits from a powerful, cost-aware model.
This quick reference explains how to pivot your local `openclaw.json` from Codex back to GLM 4.7 without touching any of the customizations you already care about.

## Why GLM 4.7?

- GLM 4.7 provides strong reasoning and tool-calling results while avoiding overuse of high-cost API calls.
- It aligns with our TNF strategy of keeping 
  - hearthbeat/cron monitoring only hitting cheap or free models, and
  - session tool execution routed through a predictable provider.
- The helper described below only touches the primary model entry, so it preserves every skill, channel, and YAML patch you already have in place.

## Use the helper script

A helper script lives at `tools/set-openclaw-model.js`. It sets the primary default to `zai/glm-4.7` and adds the same key to the `agents.defaults.models` allowlist.

```bash
node tools/set-openclaw-model.js [path/to/openclaw.json]
```

- If you omit the path, the script honors `OPENCLAW_CONFIG_PATH`.
- It runs safely multiple times and never overwrites unrelated sections of the config.
- The script leaves your `models.providers` untouched; it only touches `agents.defaults.model`/`models`.

## After you run it

1. Ensure `ZAI_API_KEY` (or the legacy `Z_AI_API_KEY`) is available to OpenClaw so the new provider can be called.
2. Restart the gateway or agent session if it was running.
3. You can still use `/model` to temporarily override the running session, but new sessions now start on GLM 4.7.

## Troubleshooting

- If the script fails with `ENOENT`, double-check the `openclaw.json` path or point the script at the right file via the argument or `OPENCLAW_CONFIG_PATH`.
- The script does not inject credentials. Pair it with your standard onboarding (e.g., `openclaw onboard` or `openclaw models auth login`) if Z.AI keys are missing.
