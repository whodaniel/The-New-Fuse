## 2025-05-18 - XSS via innerHTML in Client Package

**Vulnerability:** The `packages/client/src/websocket-client.html` used
`entry.innerHTML = content;` with string concatenation, exposing the application
to DOM-based Cross-Site Scripting (XSS) from untrusted WebSocket payloads like
`message` and `source`. **Learning:** Legacy UI code often bypasses modern
frameworks' auto-escaping mechanisms (like React) by falling back to vanilla
JavaScript with insecure `innerHTML` injection. **Prevention:** Strictly enforce
the use of `document.createElement()` paired with `.textContent` for dynamic DOM
manipulation, which natively sanitizes text nodes. Avoid string template
concatenation when modifying HTML directly.

## 2024-05-28 - Insecure Random Number Generation for Security Identifiers

**Vulnerability:** Found `Math.random()` being used to generate `requestId` in
`SecurityValidationMiddleware`, and multiple other places like session IDs,
token IDs across the codebase. **Learning:** `Math.random()` is not a
cryptographically secure pseudo-random number generator (CSPRNG). Using it for
security-sensitive identifiers (like session IDs, request tracking IDs which
could be exposed in logs/headers) is a security risk, as it can be predictable.
**Prevention:** Use `crypto.randomBytes()` from the `node:crypto` library to
generate secure identifiers where randomness is required for security tracking
and identification.

## $(date +%Y-%m-%d) - Rate Limiting via Unbounded Map

**Vulnerability:** A custom rate limiter was implemented using a JavaScript `Map` to track login/registration attempts per IP address, but without a mechanism to delete expired entries, introducing an unbounded memory leak DoS risk.
**Learning:** When using in-memory data structures (like a `Map` or `Set`) to track ephemeral client data over time, the data structure will grow indefinitely unless actively pruned.
**Prevention:** Always implement a cleanup mechanism (such as a periodic `setInterval` that is `.unref()`ed, or an LRU cache) when storing time-bound data per unique client identifier in a long-running process.
