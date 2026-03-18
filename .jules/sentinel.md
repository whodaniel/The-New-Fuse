## 2024-05-18 - EIP-4361 Missing Verification in Web3 Login
**Vulnerability:** The `findOrCreateUnstoppableDomainsUser` in `auth.service.ts` was only using generic `verifyMessage` from `viem` to check Ethereum signatures, lacking complete EIP-4361 (Siwe) validation for nonces, timestamps, and domains. This creates a replay attack vulnerability.
**Learning:** Generic signature validation guarantees *who* signed the payload, but not *when* or *why*. Reusing the same valid signature payload across different contexts or timeframes is a classic web3 vulnerability.
**Prevention:** Always use a specialized EIP-4361 parsing library like `siwe` that handles time limits (expiration/issuedAt), domains, and nonces instead of raw signature recovery when building Sign-In with Ethereum workflows.## $(date +%Y-%m-%d) - Hardcoded Fallback Secret in Cloud Sandbox

**Vulnerability:** The `CloudSandboxAuthGuard` used a hardcoded fallback string (`'dev-secret'`) for the `JWT_SECRET` when validating incoming agent and user connections.
**Learning:** Hardcoded fallback secrets are a dangerous antipattern that can easily slip into production environments if configuration variables are missed, completely bypassing authentication security.
**Prevention:** Fail fast on initialization. The constructor must validate that security-critical environment variables (like `JWT_SECRET`) are present and cryptographically strong (e.g., length >= 32). If not, it should throw an error to prevent the service from starting in a vulnerable state.
## 2025-05-24 - Fix Weak Random Number Generation
**Vulnerability:** Weak random number generation using Math.random() in apps/backend/src/agent/services/InterAgentChatService.ts to generate message IDs.
**Learning:** Math.random() is predictable and should not be used in contexts where random strings are used for tokens, IDs, or security-related contexts, as this could allow an attacker to predict generated message IDs.
**Prevention:** Always use cryptographically secure random number generators (e.g., Node's native crypto module, crypto.randomBytes) when generating IDs or tokens.
## 2024-05-24 - Fix Weak Random Number Generation in Invite Codes
**Vulnerability:** Weak random number generation using `Math.random()` in `apps/api/src/services/auth.service.ts` to generate registration invite codes.
**Learning:** `Math.random()` is predictable and should not be used in contexts where random strings are used for tokens, IDs, or security-related contexts, as this could allow an attacker to predict generated invite codes and bypass registration controls.
**Prevention:** Always use cryptographically secure random number generators (e.g., Node's native `crypto` module, `crypto.randomBytes()`) when generating sensitive tokens or IDs.
