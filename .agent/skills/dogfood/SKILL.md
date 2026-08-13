---
name: dogfood
description:
  Systematic exploratory QA testing of web applications — find bugs, capture
  evidence, and generate structured reports
version: 1.0.0
metadata:
  hermes:
    tags: [qa, testing, browser, web, dogfood]
    related_skills: []
---

# Dogfood: Systematic Web Application QA Testing

## Overview

This skill guides you through systematic exploratory QA testing of web
applications using the browser toolset. You will navigate the application,
interact with elements, capture evidence of issues, and produce a structured bug
report.

**Part of Continuous Correction Flywheels**: This skill is often used as the
**detection layer** in `tnf-continuous-correction-flywheel` systems, where cron
jobs run regular QA sweeps and dispatch fixes to specialty agents.

## Prerequisites

- **Browser mode**: Browser toolset must be available (`browser_navigate`,
  `browser_snapshot`, `browser_click`, `browser_type`, `browser_scroll`,
  `browser_back`, `browser_press`)
- **Headless mode** (cron/CI): Only `curl` and `dig`/`nslookup` are needed — see
  Phase 1.5 below
- A target URL and testing scope from the user
- **Note**: Even when browser tools are available, Phase 1.5 (headless security
  audit) should ALWAYS be run first as it catches infrastructure-level issues
  that browser interactions might miss
- **Environment Adaptation**: The skill should automatically detect whether
  browser tools are available. If `browser_navigate` is not available, the skill
  should skip Phases 2-4 (browser-based exploration) and rely solely on Phase
  1.5 (headless security audit) for testing. This enables the skill to work in
  both interactive and automated (cron/CI) environments without modification.
- **Path Resolution**: In cron/CI environments, use absolute paths when
  referencing scripts and tools to avoid path resolution issues. The skill
  should detect missing browser tools and automatically adapt to headless-only
  mode. The `scripts/quick-security-audit.sh` script itself has been updated to
  correctly create its output directory and handle dynamic output file naming
  (e.g., `domain_critical_high_issues.json`, `domain_report.md`) within the
  specified `output_dir`.

## Inputs

The user provides:

1. **Target URL** — the entry point for testing
2. **Scope** — what areas/features to focus on (or "full site" for comprehensive
   testing)
3. **Output directory** (optional) — where to save screenshots and the report
   (default: `./dogfood-output`)

## Workflow

Follow this 5-phase systematic workflow:

### Phase 1: Plan

1. Create the output directory structure:
   ```
   {output_dir}/
   ├── screenshots/       # Evidence screenshots
   └── report.md          # Final report (generated in Phase 5)
   ```
2. Identify the testing scope based on user input.
3. Build a rough sitemap by planning which pages and features to test:
   - Landing/home page
   - Navigation links (header, footer, sidebar)
   - Key user flows (sign up, login, search, checkout, etc.)
   - Forms and interactive elements
   - Edge cases (empty states, error pages, 404s)

### Phase 1.5: Headless Security Audit (curl-based)

> **When to use**: Always run this phase, even when browser tools are available.
> It catches issues (CORS, security headers, DNS, info disclosure) that browser
> interactions don't surface. **Essential for cron/CI runs** where browser tools
> are unavailable.
>
> **Note for cron/CI environments**: When browser tools are not available (as
> detected by missing `browser_navigate` command), this phase becomes the
> primary testing mechanism. The skill should automatically adapt to
> headless-only mode and generate a report based on security audit findings. The
> `scripts/quick-security-audit.sh` script now supports a `--json` flag for
> machine-readable output.
>
> **Adaptive Execution**: The skill should check for browser tool availability
> at runtime. If browser tools are available, run all phases. If not available
> (e.g., in cron/CI environments), skip Phases 2-4 and rely solely on Phase 1.5.
> This enables the same skill to work in both interactive and automated
> environments without modification.

For each target URL, run these curl-based probes. See
`references/headless-security-probes.md` for the full probe catalog and
`scripts/quick-security-audit.sh` for a re-runnable script.

1. **DNS resolution**: `dig +short {domain}` or
   `curl -sv --max-time 5 https://{domain}/ 2>&1 | grep "Could not resolve"` —
   NXDOMAIN is a Critical finding.

2. **Security headers check**: `curl -sI --max-time 5 https://{domain}/ 2>&1`
   then grep for:
   - `x-frame-options` (missing → Medium/High)
   - `x-content-type-options` (missing → Medium)
   - `content-security-policy` (missing → Medium)
   - `referrer-policy` (missing → Low)
   - `permissions-policy` (missing → Low)
   - `strict-transport-security` (missing → Medium if not behind Cloudflare)
   - `x-powered-by` (present → Medium — information disclosure)

3. **CORS audit**:
   - `curl -sI -H "Origin: https://evil-test.com" https://{domain}/` — check
     `access-control-allow-origin` value
   - `*` is a Critical finding (wildcard CORS)
   - Test with legitimate origins too (e.g., `https://thenewfuse.com`)
   - Check CORS error response code (500 instead of 403/silent → High)

4. **Route availability**:
   - Probe key routes: `/login`, `/register`, `/dashboard`, `/pricing`, `/docs`,
     `/api/health`
   - 404 on user-facing SPA routes that should work → High
   - Redirects to wrong domain → Medium

5. **Information disclosure**:
   - `curl -s https://{domain}/` — check for version, env, internal paths in
     response body
   - `curl -s https://{domain}/api-docs` — Swagger exposed in prod → Medium
   - `curl -s https://{domain}/api/v1` — API index leaking → Medium
   - `curl -s https://{domain}/` — check for JSON info disclosure (version,
     status, uptime, etc.) → Medium
   - `curl -s https://{domain}/` — check for version/build info in HTML meta
     tags → Medium

6. **Record all findings** using the same issue format as Phase 3.

### Phase 2: Explore

For each page or feature in your plan:

1. **Navigate** to the page:

   ```
   browser_navigate(url="https://example.com/page")
   ```

2. **Take a snapshot** to understand the DOM structure:

   ```
   browser_snapshot()
   ```

3. **Check the console** for JavaScript errors:

   ```
   browser_console(clear=true)
   ```

   Do this after every navigation and after every significant interaction.
   Silent JS errors are high-value findings.

4. **Take an annotated screenshot** to visually assess the page and identify
   interactive elements:

   ```
   browser_vision(question="Describe the page layout, identify any visual issues, broken elements, or accessibility concerns", annotate=true)
   ```

   The `annotate=true` flag overlays numbered `[N]` labels on interactive
   elements. Each `[N]` maps to ref `@eN` for subsequent browser commands.

5. **Test interactive elements** systematically:
   - Click buttons and links: `browser_click(ref="@eN")`
   - Fill forms: `browser_type(ref="@eN", text="test input")`
   - Test keyboard navigation: `browser_press(key="Tab")`,
     `browser_press(key="Enter")`
   - Scroll through content: `browser_scroll(direction="down")`
   - Test form validation with invalid inputs
   - Test empty submissions

6. **After each interaction**, check for:
   - Console errors: `browser_console()`
   - Visual changes:
     `browser_vision(question="What changed after the interaction?")`
   - Expected vs actual behavior

### Phase 3: Collect Evidence

For every issue found:

1. **Take a screenshot** showing the issue:

   ```
   browser_vision(question="Capture and describe the issue visible on this page", annotate=false)
   ```

   Save the `screenshot_path` from the response — you will reference it in the
   report.

2. **Record the details**:
   - URL where the issue occurs
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Console errors (if any)
   - Screenshot path

3. **Classify the issue** using the issue taxonomy (see
   `references/issue-taxonomy.md`):

- Severity: Critical / High / Medium / Low
- Category: Functional / Visual / Accessibility / Console / UX / Content /
  **Security**
- Security category covers: CORS misconfig, missing security headers, info
  disclosure, DNS failures, exposed credentials/docs

### Phase 4: Categorize

1. Review all collected issues.
2. De-duplicate — merge issues that are the same bug manifesting in different
   places.
3. Assign final severity and category to each issue.
4. Sort by severity (Critical first, then High, Medium, Low).
5. Count issues by severity and category for the executive summary.

### Phase 5: Report

Generate the final report using the template at
`templates/dogfood-report-template.md`.

The report must include:

1. **Executive summary** with total issue count, breakdown by severity, and
   testing scope
2. **Per-issue sections** with:
   - Issue number and title
   - Severity and category badges
   - URL where observed
   - Description of the issue
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshot references (use `MEDIA:<screenshot_path>` for inline images)
   - Console errors if relevant
3. **Summary table** of all issues
4. **Testing notes** — what was tested, what was not, any blockers

Save the report to `{output_dir}/report.md`.

## Integration with Fix Agents

## Integration with Fix Agents

When running in automated environments (like cron jobs), consider integrating
with the fix agent workflow:

1. After generating the report, parse it for Critical and High severity issues
2. For each such issue, create a task using the delegate_task tool or equivalent
3. Include in the task:

- The issue details from the report
- Screenshot evidence (if available)
- Steps to reproduce
- Recommended fix approach

4. Tag tasks appropriately for routing to the correct specialty agent (e.g.,
   frontend, backend, security)

**Standard Practice in Cron Environments**: In automated environments where
delegate_task may be unreliable, it's standard practice to:

- Save the issue details to a JSON file (e.g., `critical_high_issues.json`) for
  later processing
- Log any delegation failures and continue with report generation
- Consider alternative remediation mechanisms like creating GitHub issues or
  sending notifications
- When generating `critical_high_issues.json`, do so programmatically (e.g., via
  `execute_code` with Python's `json` module) to ensure valid JSON output. The
  `critical-high-issues-template.json` serves as a structural reference, not a
  direct template.

**Headless-Only Mode (Cron/CI)**: When browser tools are unavailable, the skill
automatically adapts to run only Phase 1.5 (Headless Security Audit). This mode
is sufficient for detecting:

- CORS misconfigurations (wildcard origins, 500 errors on rejection)
- Missing security headers (CSP, HSTS, X-Frame-Options, etc.)
- Information disclosure (version strings, JSON endpoints, exposed docs)
- Route availability (404s on expected user-facing paths)
- DNS resolution failures
- **Note on report generation:** In headless-only mode, the report template
  (`templates/dogfood-report-template.md`) dynamically adapts to indicate that
  screenshots and console errors are not captured. A `critical_high_issues.json`
  file is also generated for structured issue output.

**Note on delegate_task reliability**: In some environments, the delegate_task
tool may not be available or may fail due to import errors or timeouts. If
delegation fails:

- Save the issue details to a JSON file (e.g., `critical_high_issues.json`) for
  later processing
- Log the failure and continue with report generation
- Consider alternative remediation mechanisms like creating GitHub issues or
  sending notifications
- The core value of dogfood is in detection and reporting; integration with fix
  agents is enhancive but not required for the skill to be useful

This creates a closed-loop system where detection (dogfood) automatically
triggers remediation (fix agents) when the integration is functioning properly.

## Tools Reference

| Tool               | Purpose                                                          |
| ------------------ | ---------------------------------------------------------------- |
| `browser_navigate` | Go to a URL                                                      |
| `browser_snapshot` | Get DOM text snapshot (accessibility tree)                       |
| `browser_click`    | Click an element by ref (`@eN`) or text                          |
| `browser_type`     | Type into an input field                                         |
| `browser_scroll`   | Scroll up/down on the page                                       |
| `browser_back`     | Go back in browser history                                       |
| `browser_press`    | Press a keyboard key                                             |
| `browser_vision`   | Screenshot + AI analysis; use `annotate=true` for element labels |
| `browser_console`  | Get JS console output and errors                                 |

## Tips

- **Always check `browser_console()` after navigating and after significant
  interactions.** Silent JS errors are among the most valuable findings.
- **Run the headless security audit (Phase 1.5) FIRST**, even in browser mode.
  It's faster and catches infrastructure-level issues that browser interactions
  miss.
- **Use `annotate=true` with `browser_vision`** when you need to reason about
  interactive element positions or when the snapshot refs are unclear.
- **Test with both valid and invalid inputs** — form validation bugs are common.
- **Scroll through long pages** — content below the fold may have rendering
  issues.
- **Test navigation flows** — click through multi-step processes end-to-end.
- **Check responsive behavior** by noting any layout issues visible in
  screenshots.
- **Don't forget edge cases**: empty states, very long text, special characters,
  rapid clicking.
- **For multi-property sweeps**: test each property independently, then
  cross-check CORS between them (e.g., can `app.thenewfuse.com` make
  credentialed requests to `api.thenewfuse.com`?).
- When reporting screenshots to the user, include `MEDIA:<screenshot_path>` so
  they can see the evidence inline.
- **Ensure audit scripts are executable**: In automated environments, you may
  need to run `chmod +x scripts/quick-security-audit.sh` before executing the
  headless security audit.
  - **In cron/CI environments, use absolute paths** to reference scripts and
    tools to avoid path resolution issues. The skill should detect missing
    browser tools and automatically adapt to headless-only mode.
  - **Script Argument Parsing**: Ensure that shell scripts, especially those
    used in automated environments, robustly parse their arguments. The
    `scripts/quick-security-audit.sh` was updated to handle `TARGET_URL`,
    `OUTPUT_DIR`, and the `--json` flag more explicitly, and
    `scripts/tnf-security-audit.sh` was updated to pass these arguments
    correctly.
  - **For TNF properties specifically**: Run `scripts/tnf-security-audit.sh` for
    automated multi-domain audits across app.thenewfuse.com, extreamix.com,
    api.thenewfuse.com, and relay.thenewfuse.com.

## Pitfalls

- **CORS checks require an `Origin` header** — plain `curl` requests don't send
  one, so you'll miss CORS misconfigurations unless you explicitly add
  `-H "Origin: https://test.com"`.
- **SPA 404s may be false positives** — some SPAs return HTTP 200 with
  `index.html` for all routes (correct client-side routing). Others return HTTP
  404 (broken server config). Always check the response body, not just the
  status code.
- **Cloudflare masks the origin** — `server: cloudflare` means you're seeing
  Cloudflare headers, not the backend's. Security headers may need to be
  configured at the Cloudflare level, not just in app code.
- **CORS rejection returning 500** is both a UX issue and a monitoring issue —
  it pollutes error trackers and leaks implementation details. The correct
  behavior is no `access-control-allow-origin` header in the response.
- **`x-powered-by: Express` leaks through NestJS** unless explicitly disabled
  with `app.disable('x-powered-by')` in `main.ts`.
- **Headless mode cannot detect UI/UX issues** — browser-based testing (Phases
  2-4) is required for form validation, authentication flows, and accessibility
  testing.
- **404s on API-only domains may be expected** — `/login`, `/register`,
  `/dashboard` on `api.thenewfuse.com` are likely supposed to return 404; focus
  on `relay.thenewfuse.com` for functional route breaks.
- **JSON parsing failures from script output**: Audit scripts that output a mix
  of log messages and JSON (especially with line numbers or other prefixes) can
  cause `json.JSONDecodeError`. Always pre-process script output to strip
  non-JSON content before attempting to parse. Manual compilation may be
  necessary as a fallback.

## Reference Files

## Reference Files

- `references/issue-taxonomy.md` — Severity and category classification guide
- `references/headless-security-probes.md` — Full curl probe catalog for
  headless QA
- `references/tnf-property-baseline.md` — Current known state of TNF properties
- `references/tnf-cors-fix-patterns.md` — Proven patterns for fixing CORS issues
  found in TNF properties
- `references/tnf-security-audit-2026-05-05.md` — Session-specific audit
  findings (TNF properties)
- `references/tnf-security-audit-2026-05-05-updates.md` — Session notes and
  script improvements from 2026-05-05 audit
- `templates/dogfood-report-template.md` — Report template
- `scripts/quick-security-audit.sh` — Re-runnable security header + CORS + DNS
  probe
- `scripts/tnf-security-audit.sh` — Automated TNF multi-domain security audit
  script
