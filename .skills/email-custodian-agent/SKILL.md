---
name: email-custodian-agent
description: "Provision and link new email inboxes with ChatGPT accounts, then complete Codex CLI authentication for that identity. Use when setting up a fresh agent persona account end-to-end (email login, ChatGPT signup/login, one-time code retrieval from Stackmail, Codex browser auth handoff, and terminal mode verification)."
---

# Email Custodian Agent

## Overview
Execute a deterministic, browser-assisted account provisioning run for one new agent identity. Reuse an unused inbox, create or authenticate the paired ChatGPT account, and finish Codex CLI login with `Approval: never` and `Sandbox: danger-full-access`.

## Browser Isolation Rule
- Perform all ChatGPT auth pages and Codex auth URL pages inside a Chrome incognito window only.
- Keep webmail/Stackmail open in a separate non-incognito tab/window for code retrieval.
- Do not run this workflow in a normal signed-in Chrome profile.
- To force an incognito window from terminal on macOS, run:
```bash
open -na 'Google Chrome' --args --incognito
```

## Workflow
1. Sign in to an unused email inbox for this process.
2. Copy the email address.
3. Open a new Chrome incognito window.
   macOS terminal command:
```bash
open -na 'Google Chrome' --args --incognito
```
4. Go to `https://chatgpt.com`, click `Log in`, paste email, click `Continue`.
5. If account creation is required, create password using the sequential convention, then continue.
6. Open Stackmail inbox (`https://www.stackmail.com/?_task=mail&_mbox=INBOX`).
7. Find `Your ChatGPT code is` email; press `Refresh` until present.
8. Copy code and return to ChatGPT tab.
9. Paste code and continue.
10. Enter persona name.
11. Enter DOB producing persona age between 12 and 75.
12. Click `Finish creating account`.

## About-You DOB Entry (Explicit, Required)
- The OpenAI `about-you` birthday UI is segmented into **three `role="spinbutton"` fields** (`month`, `day`, `year`) and each segment is `contenteditable`, not a standard `<input>`.
- Enter DOB with trusted keyboard input only: type `MM`, `Tab`, `DD`, `Tab`, `YYYY` (always 4-digit year).
- After typing, verify rendered segment values are exactly:
  - month: 2 digits (01-12)
  - day: 2 digits (01-31)
  - year: 4 digits (for example `1993`, never `18`)
- Validate hidden birthday normalization before submit:
  - `input[name="birthday"]` must be `YYYY-MM-DD` with a plausible year (for example `1993-07-18`), not malformed values like `0018-07-22`.
- If malformed:
  - click month segment and re-enter full sequence `MM Tab DD Tab YYYY`
  - do not submit until hidden birthday is valid and age is 12-75.
- Submit by clicking the visible `Finish creating account`/`Continue` button (or trusted Enter on focused button). Do not submit with direct POST.

## Reliable Execution Guards
- Always wait for StackCP table hydration before acting. The page shell can load first while mailbox rows are absent.
- On `Email Accounts`, verify the page text contains `Modify Email Accounts(...)` before searching rows.
- Search using the full mailbox (`local@domain`), not partial local-part only.
- If a target row is not found on first pass, clear search, re-apply search, then scroll and retry selector resolution.
- Treat mailbox auth as successful only if Stackmail URL is `?_task=mail&_mbox=INBOX` (not `?_task=login`).
- Use `Resend email` before reading code from inbox to avoid stale OTP reuse.
- Prefer `Log in with a one-time code` for authentication flows.

## StackCP + Stackmail Handling
1. Open `https://www.stackcp.com/services/be2e4e715ddd64f5/email/email-accounts`.
2. Confirm table is hydrated (`Modify Email Accounts` visible).
3. Filter/search for the exact mailbox.
4. Set/reset mailbox password in row input, then click row `Save`.
5. Open row `Options` -> `Webmail`.
6. If redirected to Stackmail login, sign in with mailbox + new password and verify inbox URL.
7. Refresh inbox and read latest `Your ChatGPT code is` message.

## OTP Submission Rules
- Never reuse old codes after a resend.
- Pull the newest code immediately after resend from the same mailbox inbox.
- If verification UI errors, reload verification URL and repeat resend -> retrieve -> submit.
- If credential flow falls back to password route, explicitly switch back to `Log in with a one-time code`.
- On OpenAI auth pages, never force-submit forms with raw POST calls (for example `form.submit()` or direct POST to `/email-verification`).
- Always enter fields and click the visible route action button (`Continue`, `Verify`, `Log in`) so the route action is invoked correctly and avoids `405 Method Not Allowed`.
- For segmented DOB fields, never set only a 1-2 digit year; always enter full 4 digits and verify `input[name="birthday"]` reflects `YYYY-MM-DD` before submit.

## Recovery Rules
- If StackCP API/XHR returns `403 {"redirect":true}`, continue via visible UI controls on the page.
- If DOM selectors are unstable, use rendered text confirmation first, then locate nearest row controls.
- If window ordering changes, re-enumerate Chrome windows/tabs before each critical step.
- If auth flow shows `Route Error (405 Method Not Allowed)` on `/email-verification`, restart from the current verification screen and re-submit by clicking the visible button (no direct form POST).
- If `about-you` rejects otherwise valid data, inspect segmented DOB values and hidden `input[name="birthday"]`; malformed years (e.g. `18` -> `0018-...`) must be corrected by full re-entry of `MM/DD/YYYY`.

## Codex Auth Handoff
1. Open a new top-level terminal window (not a subterminal).
2. Run `codex login`.
3. Immediately close the Chrome tab auto-opened by the command before it loads.
4. Copy the auth URL printed in terminal.
5. In the existing incognito window, open a new tab and visit auth URL yourself (do not hand off this action to the user).
6. Enter the same email.
7. Choose `Log in with a one-time code`.
8. Return to Stackmail inbox, refresh, copy latest verification code.
9. Paste code into ChatGPT auth prompt and continue.
10. On `Sign in to Codex with ChatGPT`, click `Continue`.

## Terminal Mode Setup
1. In the new terminal, run:
```bash
codex --dangerously-bypass-approvals-and-sandbox
```
2. If unsupported, run:
```bash
codex -a never -s danger-full-access
```
3. If `Update available` appears, choose `skip` and press Enter.
4. Run:
```bash
/status
```
5. Confirm:
- `Approval: never` (or trusted/no prompts)
- `Sandbox: danger-full-access`

## Already-Logged-In Behavior (Winning Rule)
- If terminal commands above return `Operation not permitted` after successful Codex web auth for the same identity, treat this as a likely already-authenticated state.
- Verify authenticated state with a non-interactive check:
```bash
codex exec --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox -C /Users/<owner> "Return exactly two lines: Approval=<policy> and Sandbox=<mode>."
```
- Accept success when output is:
  - `Approval=never`
  - `Sandbox=danger-full-access`
- Do not loop password-based login when one-time-code flow is required.

## Background Terminal Exception + Logging
- Default: use a new top-level terminal window.
- Exception: if instructed, use a background terminal session for final verification.
- After any background-terminal execution, write a local run log with:
  - session id
  - working directory
  - exact commands executed
  - command results/errors
  - timestamp/date
- Use a deterministic path for auditability, e.g. `/Users/<owner>/background-terminal-details.md`.

## Completion Criteria
Mark run complete only when all are true:
- ChatGPT account is active for the selected inbox.
- Codex CLI is authenticated with that same identity.
- `/status` confirms non-interrupting approvals and full-access sandbox.
- Account is ready for assignment to a local Sub-Director Agent.
- The webmail tab used for OTP retrieval is closed.
- The incognito window used for ChatGPT/Codex auth is closed.

## Operational Notes
- SSH access is already established for this environment
- Work on one identity at a time to avoid code/email mismatch.
- Always refresh Stackmail before assuming a code was not sent.
- Preserve deterministic naming/password conventions used by your existing process.
