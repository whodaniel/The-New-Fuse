## 2024-05-18 - EIP-4361 Missing Verification in Web3 Login
**Vulnerability:** The `findOrCreateUnstoppableDomainsUser` in `auth.service.ts` was only using generic `verifyMessage` from `viem` to check Ethereum signatures, lacking complete EIP-4361 (Siwe) validation for nonces, timestamps, and domains. This creates a replay attack vulnerability.
**Learning:** Generic signature validation guarantees *who* signed the payload, but not *when* or *why*. Reusing the same valid signature payload across different contexts or timeframes is a classic web3 vulnerability.
**Prevention:** Always use a specialized EIP-4361 parsing library like `siwe` that handles time limits (expiration/issuedAt), domains, and nonces instead of raw signature recovery when building Sign-In with Ethereum workflows.
## 2024-05-19 - Authentication Stub Vulnerability
**Vulnerability:** The `validateCredentials` method in `AuthService` inside the security package was implemented as a stub that always returned `true`. This creates a silent security bypass allowing any credentials to pass validation.
**Learning:** Hardcoded stubs in security-critical paths (especially those waiting for a "production implementation") are dangerous as they can easily slip into production uncompleted.
**Prevention:** If a dependency or store is missing, the service should explicitly fail or throw an error rather than bypassing the check entirely. Dependency injection should be used with explicit failure modes for missing configurations.
## 2025-03-05 - [CRITICAL] Hardcoded fallback JWT secret in relay-core Auth service
**Vulnerability:** The relay core `JWTAuthService` had a fallback JWT secret `dev-secret-change-in-production` which it would default to if `JWT_SECRET` wasn't provided, allowing potentially weak token generation and compromising capability-based access control.
**Learning:** Using a hardcoded secret or simply warning about a missing environment variable is unsafe, as it can inadvertently lead to insecure token generation in production.
**Prevention:** Hardcode minimum requirements (e.g., strong secrets > 32 length) and fail securely by throwing errors on initialization when missing or invalid security requirements are detected instead of falling back to insecure defaults.
