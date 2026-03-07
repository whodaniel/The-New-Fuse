# cloudflare-openclaw-gateway

Prototype containerized OpenClaw Gateway for Cloudflare Containers.

This directory is intentionally minimal right now:

- `container/Dockerfile` bootstraps OpenClaw Gateway.
- `docs/PLAN.md` defines the phased replacement of echo → real gateway.

**Next step:** confirm Cloudflare Containers enablement and deployment workflow,
then wire `openclaw-runtime` to call this gateway.
