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

## 2026-08-08 - Hardcoded Fallback Secrets in API Gateway

**Vulnerability:** The `GatewayAuthService` used hardcoded fallback strings (`'dev-secret-key-123'`) for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
**Learning:** Providing default weak secrets in the source code as fallback for missing environment variables means that in production environments where the configuration fails to load properly, the app will start up securely compromised without warning. This silently exposes endpoints since anyone could generate a valid token using the fallback secret.
**Prevention:** Instead of fallback strings, throw a hard error at runtime (fail securely) when critical security environment variables (like JWT secrets) are missing or too weak.

## 2026-08-08 - Gemini Native Host Command Injection

**Vulnerability:** The Gemini bridge native host passed an extension-provided path through a shell command when handling `open-folder`, allowing shell metacharacters in a crafted path to execute arbitrary commands.
**Learning:** Quoting an interpolated value does not make shell construction safe. Paths controlled by another process must be passed as discrete arguments.
**Prevention:** Use `execFile('open', [targetPath])` for macOS folder opening so the path bypasses shell parsing.

## 2026-08-08 - Predictable ID Generation in Message Relays

**Vulnerability:** Weak random number generation using `Math.random().toString(36)` in `packages/relay-core` to generate message IDs, task IDs, and client IDs for real-time WebSocket communication and inter-agent event broadcasting.
**Learning:** `Math.random()` is pseudo-random, highly predictable, and completely unsuited for distributed message brokers where attackers could theoretically guess connection IDs or message IDs to spoof system events or disrupt relay communication.
**Prevention:** Always use Node's built-in `crypto.randomBytes(4).toString('hex')` or UUID libraries to ensure identifiers in message brokers are cryptographically secure and unguessable.

## 2026-08-14 - Drizzle ORM Raw Query Parameterization Pattern
**Vulnerability:** Raw SQL queries executed using Drizzle's `db.execute(sql.raw(query))` in this codebase were bypassing parameterization, leading to developers manually escaping variables (e.g., using `replace(/'/g, "''")`), which introduces high SQL injection risk.
**Learning:** Drizzle's `sql.raw()` function intentionally does not support query parameters. To securely execute raw queries with parameter bindings (`$1`, `$2`), the code must bypass the Drizzle abstraction and use the underlying database driver (e.g., postgres.js).
**Prevention:** We updated `DatabaseService.executeRaw` to detect parameters. If parameters are provided, it securely routes the query via the driver `queryClient.unsafe(query, params)`. Ensure `queryClient` is properly imported in `database.service.ts` to avoid runtime reference errors. All future raw queries should use standard `$1`, `$2` parameterization and pass the array to `executeRaw`.

## 2024-05-18 - Parameterized Queries Required in DB ExecuteRaw
**Vulnerability:** SQL Injection in raw database queries via string concatenation and manual escaping.
**Learning:** The `this.db.executeRaw` wrapper around Drizzle doesn't automatically parameterize strings when passed as a single string literal. Manual string escaping (e.g. replacing `'` with `''`) is brittle and prone to bypasses, especially when dealing with complex or unexpected inputs.
**Prevention:** Always use the two-argument form of `executeRaw` where the first argument is a query string with `$1, $2, ...` placeholders and the second argument is an array of bind values. Ensure `executeRaw` internally routes this array to a safe underlying client like postgres.js `queryClient.unsafe()`.
