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
## 2024-05-24 - [Title] Cryptographically Insecure Random ID Generation
**Vulnerability:** Found `Math.random().toString(36)` used for generating message IDs in the Redis Streams service.
**Learning:** `Math.random()` generates pseudo-random numbers that are predictable and can be exploited to guess message IDs, which could potentially lead to session hijacking or spoofing in a multi-agent system relying on unique correlation IDs.
**Prevention:** Always use cryptographically secure random number generators (CSPRNG) such as `crypto.randomBytes(4).toString('hex')` or UUIDv4 for generating sensitive identifiers.
## 2024-03-24 - Weak Random Number Generation for IDs
**Vulnerability:** Widespread use of `Math.random().toString(36).substr(2, 9)` to generate unique IDs across the `packages/agent/src` directory, including execution IDs, message IDs, and session IDs.
**Learning:** This pattern was likely copy-pasted across multiple files during initial development for convenience. `Math.random()` is not cryptographically secure, making these IDs predictable and vulnerable to guessing attacks, which is especially concerning for session and execution IDs.
**Prevention:** Always use cryptographically secure methods like `crypto.randomBytes(4).toString('hex')` or `crypto.randomUUID()` when generating unique identifiers for security-sensitive or session-related context.
## 2026-04-09 - Fix SQL injection in pgvector driver getStats method
**Vulnerability:** Unsanitized collection parameter directly interpolated into SQL query via pg_total_relation_size() and FROM clause
**Learning:** A sanitizeIdentifier function existed but was missed for one specific method query where a dynamic parameter was evaluated directly in string template literals, leading to an easy SQL Injection.
**Prevention:** Ensure that anytime string interpolations are required (since table names cannot be parameterized in Postgres), the variables are strictly run through identifier sanitizers or whitelist validators.
