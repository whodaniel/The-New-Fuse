## 2025-05-18 - XSS via innerHTML in Client Package
**Vulnerability:** The `packages/client/src/websocket-client.html` used `entry.innerHTML = content;` with string concatenation, exposing the application to DOM-based Cross-Site Scripting (XSS) from untrusted WebSocket payloads like `message` and `source`.
**Learning:** Legacy UI code often bypasses modern frameworks' auto-escaping mechanisms (like React) by falling back to vanilla JavaScript with insecure `innerHTML` injection.
**Prevention:** Strictly enforce the use of `document.createElement()` paired with `.textContent` for dynamic DOM manipulation, which natively sanitizes text nodes. Avoid string template concatenation when modifying HTML directly.
