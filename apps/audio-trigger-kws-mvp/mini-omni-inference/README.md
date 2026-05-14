# mini-omni-inference (CloudRuntime Service)

This folder defines a production deployment target for mini-omni speech
inference.

## What It Runs

- Clones `gpt-omni/mini-omni` from `main` during build.
- Installs runtime dependencies and serves mini-omni via Gunicorn in CPU mode.
- Exposes mini-omni `/chat` endpoint.

## CloudRuntime Deploy

```bash
cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse
cloud_runtime add --service mini-omni-inference
cloud_runtime up apps/audio-trigger-kws-mvp/mini-omni-inference \
  --service mini-omni-inference \
  --detach \
  --path-as-root
cloud_runtime domain --service mini-omni-inference
```

## Recommended Service Variables

- `OMNI_DEVICE=cpu` (default in Dockerfile)
- `OMNI_SKIP_WARMUP=1` (default in Dockerfile for faster startup)
- `OMNI_WHISPER_MODEL=tiny` (default in Dockerfile; raise to `base`/`small` if
  quality allows)

## Connect `kws-api`

Set:

- `MINI_OMNI_MODE=native_chat`
- `MINI_OMNI_API_URL=https://<mini-omni-domain>/chat`
- `MINI_OMNI_TIMEOUT_MS=180000`

Then redeploy `kws-api`.

## Notes

- The first boot downloads model artifacts from Hugging Face and can take
  several minutes.
- Keep `MINI_OMNI_MAX_TOKENS` on the caller side at or below `2048` for this
  model.
