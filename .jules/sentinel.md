## 2024-05-18 - EIP-4361 Missing Verification in Web3 Login
**Vulnerability:** The `findOrCreateUnstoppableDomainsUser` in `auth.service.ts` was only using generic `verifyMessage` from `viem` to check Ethereum signatures, lacking complete EIP-4361 (Siwe) validation for nonces, timestamps, and domains. This creates a replay attack vulnerability.
**Learning:** Generic signature validation guarantees *who* signed the payload, but not *when* or *why*. Reusing the same valid signature payload across different contexts or timeframes is a classic web3 vulnerability.
**Prevention:** Always use a specialized EIP-4361 parsing library like `siwe` that handles time limits (expiration/issuedAt), domains, and nonces instead of raw signature recovery when building Sign-In with Ethereum workflows.
## 2024-05-19 - Authentication Stub Vulnerability
**Vulnerability:** The `validateCredentials` method in `AuthService` inside the security package was implemented as a stub that always returned `true`. This creates a silent security bypass allowing any credentials to pass validation.
**Learning:** Hardcoded stubs in security-critical paths (especially those waiting for a "production implementation") are dangerous as they can easily slip into production uncompleted.
**Prevention:** If a dependency or store is missing, the service should explicitly fail or throw an error rather than bypassing the check entirely. Dependency injection should be used with explicit failure modes for missing configurations.
## 2024-05-18 - Math.random() replaced with cryptographically secure RNG
**Vulnerability:** Used `Math.random()` to generate authentication tokens and verification codes. `Math.random()` is not cryptographically secure and can be predicted, leading to session hijacking and brute forcing.
**Learning:** Incomplete implementations often rely on `Math.random()` as a placeholder, but this is a critical security risk when used for security mechanisms. I also learned that `packages/utils/src/auth/auth.utils.ts` had a missing import of `crypto` after I replaced `Math.random()`, which was caught during code review.
**Prevention:** Always use Node.js `crypto.randomBytes` or `crypto.randomInt` (or the Web Crypto API) for any random values used in security contexts. Make sure to double-check that you added necessary imports.
