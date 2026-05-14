# SkIDEancer (SkIDEancer IDE) Deployment Guide

**Date:** December 25, 2025  
**Repository:** https://github.com/whodaniel/skideancer-ide  
**Deployment URL:** https://ide.thenewfuse.com /
https://skideancer.thenewfuse.com

## Overview

SkIDEancer is the cloud-based IDE component of The New Fuse platform, built on
Eclipse SkIDEancer 1.67 with full AI integrations.

## Architecture

The SkIDEancer IDE is deployed separately from the main TNF monorepo because:

- SkIDEancer requires **Yarn** while the main monorepo uses **pnpm**
- Mixing package managers causes lockfile conflicts and build issues
- Separate deployment allows independent scaling and updates

## Deployment

### CloudRuntime Configuration

- **Service:** `skideancer-ide`
- **Builder:** Dockerfile
- **Domain:** `ide.thenewfuse.com`

### Key Files

| File                          | Purpose                         |
| ----------------------------- | ------------------------------- |
| `Dockerfile`                  | Build and runtime configuration |
| `cloud_runtime.toml`                | CloudRuntime-specific settings       |
| `package.json`                | SkIDEancer dependencies (Yarn-based) |
| `src-gen/backend/main.js`     | Production entry point          |
| `src-gen/frontend/index.html` | Frontend entry point            |

## Troubleshooting History

### Issue: 502 Bad Gateway (Fixed v12)

**Problem:** Deployment showed "success" but returned 502 errors.

**Root Causes:**

1. Wrong start command (`yarn ide start` instead of
   `node src-gen/backend/main.js`)
2. CloudRuntime custom start command overriding Dockerfile CMD

**Solution:**

- Updated Dockerfile CMD to use `node src-gen/backend/main.js`
- Removed custom start command from CloudRuntime settings

### Issue: FrontendApplicationConfigProvider Error (Fixed v12)

**Problem:** Browser console showed:

```
Error: The configuration is not set. Did you call FrontendApplicationConfigProvider#set?
```

**Root Cause:** Webpack bundling created multiple copies of the config provider
module. SkIDEancer's singleton pattern using `Symbol('...')` created unique symbols
per copy, breaking the pattern.

**Solution:** Three-phase patching to replace `Symbol('...')` with
`Symbol.for('...')`:

1. **Phase 1:** Patch `@ide` source files before build
2. **Phase 2:** Patch generated `src-gen/frontend/index.js`
3. **Phase 3:** Patch compiled `lib/frontend/*.js` bundles

`Symbol.for()` returns the same global symbol across all module instances,
preserving the singleton pattern.

## Environment Variables

```bash
# Server
PORT=3007  # CloudRuntime overrides dynamically

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
HUGGINGFACE_API_KEY=hf_...

# Ollama (local models)
OLLAMA_HOST=http://localhost:11434

# TNF Integration
CLOUD_SANDBOX_URL=https://tnf-cloud-sandbox-production.thenewfuse.com
CLOUD_SANDBOX_WS=wss://tnf-cloud-sandbox-production.thenewfuse.com/ws
```

## Version History

| Version | Date       | Changes                                              |
| ------- | ---------- | ---------------------------------------------------- |
| v12     | 2025-12-25 | Fixed 502 + FrontendApplicationConfigProvider issues |
| v11     | 2025-12-25 | Attempted main.js fix                                |
| v10     | 2025-12-22 | Initial Symbol.for patch                             |

## Related Documentation

- [TROUBLESHOOTING.md](https://github.com/whodaniel/skideancer-ide/blob/main/docs/TROUBLESHOOTING.md) -
  Detailed troubleshooting guide
- [README.md](https://github.com/whodaniel/skideancer-ide/blob/main/README.md) -
  Quick start guide
