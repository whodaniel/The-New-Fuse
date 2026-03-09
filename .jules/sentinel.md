## 2024-05-18 - EIP-4361 Missing Verification in Web3 Login
**Vulnerability:** The `findOrCreateUnstoppableDomainsUser` in `auth.service.ts` was only using generic `verifyMessage` from `viem` to check Ethereum signatures, lacking complete EIP-4361 (Siwe) validation for nonces, timestamps, and domains. This creates a replay attack vulnerability.
**Learning:** Generic signature validation guarantees *who* signed the payload, but not *when* or *why*. Reusing the same valid signature payload across different contexts or timeframes is a classic web3 vulnerability.
**Prevention:** Always use a specialized EIP-4361 parsing library like `siwe` that handles time limits (expiration/issuedAt), domains, and nonces instead of raw signature recovery when building Sign-In with Ethereum workflows.## $(date +%Y-%m-%d) - Hardcoded Fallback Secret in Cloud Sandbox

**Vulnerability:** The `CloudSandboxAuthGuard` used a hardcoded fallback string (`'dev-secret'`) for the `JWT_SECRET` when validating incoming agent and user connections.
**Learning:** Hardcoded fallback secrets are a dangerous antipattern that can easily slip into production environments if configuration variables are missed, completely bypassing authentication security.
**Prevention:** Fail fast on initialization. The constructor must validate that security-critical environment variables (like `JWT_SECRET`) are present and cryptographically strong (e.g., length >= 32). If not, it should throw an error to prevent the service from starting in a vulnerable state.
