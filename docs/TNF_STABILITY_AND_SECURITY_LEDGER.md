# TNF Stability & Security Ledger

## Session 2 Fixes (May 8, 2026) — Kilo Agent

Verified zero errors across all critical monorepo packages.

### 🔒 Security Fixes
- **Fix #21: UpgradeService RCE Mitigation:** Replaced unsafe `curl | sh` pipe-to-shell with a controlled `fetch()` -> `tmpfile` -> `spawnSync()` sequence in `packages/tnf-cli/src/services/UpgradeService.ts`.

### 🛡️ Type Safety & Module Resolution
- **Fix #22: API Client ESM Extensions:** Added missing `.js` extensions to 13 integration files in `packages/api-client`. Essential for `NodeNext` resolution.
- **Fix #23: Shared Package Directory Imports:** Updated directory imports (e.g., `./validation.js` -> `./validation/index.js`) to satisfy strict ESM resolution rules.
- **Fix #24: Shared Test Exclusions:** Fixed broken `__tests__` patterns in `tsconfig.json` to prevent test-only types from leaking into production builds.
- **Fix #25: Core Package Import Paths:** Fixed incorrect internal import paths in `ContextAwareOrchestrator`, `provider-registry`, and `vector-store`.
- **Fix #26: Core LogLevel Deduplication:** Resolved duplicate `LogLevel` export by switching to explicit named exports in `packages/core/src/index.ts`.

### 🚀 Performance & Robustness (Go Orchestrator)
- **Fix #5-7: Go Orchestrator Hardening:**
  - Removed hardcoded paths, replaced with environment-aware relative resolution.
  - Added channel backpressure (HTTP 503 on full bus) and atomic message drop tracking.
  - Fixed out-of-bounds string slicing in protocol negotiation.

### 🏗️ Architecture Stabilization
- **TNF Core Implementation:** Created the foundational `TNFCore` class and `ChatManager` in `packages/tnf-core`.
- **Redis Handoff Safety:** Added 30-second cooldown to Redis error logging to prevent log-spam during transport failures.

---
*Verified by Gemini CLI & Kilo Agent — May 8, 2026*
