## 2026-09-07 - [DOM-based XSS in Chrome Extension Public HTML]

**Vulnerability:** User-controlled data (`video.title`, `video.channel_name`,
`report.video_title`, `excerpt`, `tags`) fetched from the API was being unsafely
interpolated into HTML template literals assigned directly to `innerHTML` in
`apps/chrome-extension/aivi/backend/public/dashboard.html` and `reports.html`.
**Learning:** Legacy pure HTML/JS files in the monorepo (specifically in the
extension backend's public dir) lack automatic escaping (unlike React
components), making them highly susceptible to DOM-based XSS when rendering API
data. **Prevention:** Always implement a manual `escapeHTML` helper function
(using `document.createTextNode`) or use `DOMPurify` when manipulating
`innerHTML` in non-framework HTML files within the codebase.

## 2024-05-16 - Hardcoded JWT Secret in Test Script

**Vulnerability:** A hardcoded `JWT_SECRET` was present in
`test-auth-registration.js`. If this script is run in a production environment
(even accidentally), or if the hardcoded secret is copied/pasted into production
code, it severely compromises the authentication system, allowing attackers to
forge JWTs. **Learning:** Even in test scripts, secrets should not be hardcoded,
especially if the script might interact with running services or be copied as
boilerplate. Using environment variables with fallbacks is much safer.
**Prevention:** Always use `process.env` for sensitive values. Provide explicit
guardrails (e.g., exiting the process) if a known weak or dummy test secret is
detected while running in a `production` environment.
