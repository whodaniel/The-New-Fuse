---
name: email-custodian-agent
description: "Provision and link new email inboxes with ChatGPT accounts, then complete Codex CLI authentication for that identity. Use when setting up a fresh agent persona account end-to-end (email login, ChatGPT signup/login, one-time code retrieval from Stackmail, Codex browser auth handoff, and terminal mode verification)."
---

# Email Custodian Agent

## Overview
Execute a deterministic, browser-assisted account provisioning run for one new agent identity. Use a brand-new mailbox identity (never previously used for ChatGPT/Codex), create the paired ChatGPT account, and finish Codex CLI login with `Approval: never` and `Sandbox: danger-full-access`.

## Credential Source Of Truth (Required First Step)
- Before any Stackmail login attempt, always open:
  - `https://www.stackcp.com/services/be2e4e715ddd64f5/email/email-accounts`
- Use this page as the source of truth to set/reset the mailbox password in the target row.
- Do not assume previously used mailbox credentials are still valid unless maintained in a verified local credential registry.
- If no verified local credential registry exists, you must set/reset the password in StackCP first, then proceed to Stackmail.

## Continuous Self-Correction Loop (Required)
- If any trouble appears at any step (unexpected page, failed submit, wrong account path, stale OTP, selector instability, 405, or mailbox ambiguity), stop immediately.
- Before retrying, refine this skill file with a concrete guard that prevents that exact failure pattern.
- Reload the updated skill instructions, then restart the run from preflight.
- Do not continue from an unstable in-between state.

## New-Identity Requirement (Strict)
- Existing identities are forbidden for new terminal agent account creation.
- Do not use a mailbox that already has a ChatGPT/Codex identity.
- If any prior-use signal appears, abort that mailbox and pick a different one.
- If any operational trouble occurs for a mailbox during provisioning, mark that mailbox as burned for the current run and switch to a new mailbox.

Prior-use signals (any one is a hard stop):
- Mailbox appears in known local persona registries.
- Stackmail already contains prior OpenAI/ChatGPT verification messages for that mailbox before the new run.
- OpenAI auth flow behaves like an existing account (for example password-login path without account creation, or immediate entry to ChatGPT without onboarding).

## Browser Isolation Rule
- Perform all ChatGPT auth pages and Codex auth URL pages inside a Chrome incognito window only.
- Keep webmail/Stackmail open in a separate non-incognito tab/window for code retrieval.
- Do not run this workflow in a normal signed-in Chrome profile.
- In OpenAI auth pages, use email + one-time-code flow only. Do not click social IdP paths (`Continue with Google`, `Continue with Apple`, `Continue with Microsoft`, `Continue with phone`).
- Do candidate preflight + StackCP + Stackmail checks before opening any incognito auth window.
- If Stackmail opens in an incognito window at any point, stop, mark mailbox `burned`, close that incognito window, and restart with a fresh mailbox.
- To force an incognito window from terminal on macOS, run:
```bash
open -na 'Google Chrome' --args --incognito
```

## Preflight Checks (Required)
- Confirm target mailbox is explicit before starting the run.
- Confirm target mailbox is not in known local active persona files.
- Confirm target mailbox is not listed as `burned` in the current run ledger.
- Confirm StackCP email table is hydrated (`Modify Email Accounts(...)` visible).
- Confirm Stackmail shows the same target mailbox identity in UI before fetching OTP.
- Confirm Stackmail has no pre-existing OpenAI/ChatGPT OTP history for the selected mailbox before starting.
- Confirm there are no `auth.openai.com` tabs in normal Chrome windows before opening auth URLs in incognito.
- Confirm there are no open incognito windows while performing StackCP/Stackmail preflight.
- Confirm run ledger file exists and append a timestamped `started` record for the mailbox.

## Workflow
1. Select a brand-new mailbox identity for this process (existing identities forbidden).
2. Open `https://www.stackcp.com/services/be2e4e715ddd64f5/email/email-accounts`.
3. Set/reset the target mailbox password in StackCP Email Accounts.
4. Copy the email address.
5. Open a new Chrome incognito window.
   macOS terminal command:
```bash
open -na 'Google Chrome' --args --incognito
```
6. Go to `https://chatgpt.com`, click `Log in`, paste email, click `Continue`.
7. If account creation is required, create password using the sequential convention, then continue.
8. Open Stackmail inbox (`https://www.stackmail.com/?_task=mail&_mbox=INBOX`) and log in with the StackCP-reset password.
9. Find `Your ChatGPT code is` email; press `Refresh` until present.
10. Copy code and return to ChatGPT tab.
11. Paste code and continue.
12. Enter a human first-and-last name for the persona (never agent labels).
13. Enter DOB producing persona age between 25 and 75.
14. Click `Finish creating account`.
15. Append mailbox status in the run ledger: `created_chatgpt`.

## Violation Policy (Hard Stop)
- If any hard requirement is violated (including mailbox reuse / existing-account signals), stop and correct before proceeding.
- Do not continue to the next identity until the current identity fully passes all checks.
- If violation occurred for the mailbox, mark it `burned` in the run ledger and do not reuse it in this run.

## Persona Identity Guardrails (Hard Requirement)
- Name must be a realistic human name with at least two words (first + last).
- Never use placeholder/agent-style names (for example: `codex225`, `Agent 225`, `TNF Bot`, `Sub-Director`).
- DOB must produce an age from 25 to 75 on the current run date.
- Validate age before submission; if outside 25-75, re-enter DOB.
- If the UI prefills an invalid DOB, overwrite it before submit.
- Current-run anchor (required for this date): on `2026-03-24`, valid DOB range is `03/25/1950` through `03/24/2001` (inclusive).
- Year guidance for `2026-03-24`:
  - safe core years: `1951-2000`
  - edge years require date checks:
    - `1950` only if DOB is `03/25-12/31`
    - `2001` only if DOB is `01/01-03/24`

## About-You DOB Entry (Explicit, Required)
- The OpenAI `about-you` birthday UI is segmented into **three `role="spinbutton"` fields** (`month`, `day`, `year`) and each segment is `contenteditable`, not a standard `<input>`.
- Enter DOB with trusted keyboard input only: type `MM`, `Tab`, `DD`, `Tab`, `YYYY` (always 4-digit year).
- Never mutate DOB via direct DOM assignment (for example, setting `textContent` on spinbuttons or setting `input[name="birthday"]` directly).
- After typing, verify rendered segment values are exactly:
  - month: 2 digits (01-12)
  - day: 2 digits (01-31)
  - year: 4 digits (for example `1993`, never `18`)
- Validate hidden birthday normalization before submit:
  - `input[name="birthday"]` must be `YYYY-MM-DD` with a plausible year (for example `1993-07-18`), not malformed values like `0018-07-22`.
  - DOB must map to age 25-75.
  - On `2026-03-24`, `input[name="birthday"]` must be between `1950-03-25` and `2001-03-24` inclusive.
- If malformed:
  - click month segment and re-enter full sequence `MM Tab DD Tab YYYY`
  - do not submit until hidden birthday is valid and age is 25-75.
- Submit by clicking the visible `Finish creating account`/`Continue` button (or trusted Enter on focused button). Do not submit with direct POST.
- If validation text is visible (for example `Hmm, that doesn't look right. Try again?`), do not submit; re-enter values.

## Reliable Execution Guards
- Always wait for StackCP table hydration before acting. The page shell can load first while mailbox rows are absent.
- Never rely on hardcoded tab indices. Resolve target tabs/windows by URL pattern and verify context text before each critical action.
- Immediately before any typed input or click, assert active page URL and heading text match the intended step; if mismatch, stop and re-target first.
- Keep a dedicated automation window frontmost during each critical phase (StackCP, Stackmail, OpenAI auth) to prevent focus drift.
- On `deviceauth/callback`, never use `Tab` traversal to populate code boxes; this can shift focus to footer links and navigate away.
- On `deviceauth/callback`, verify all 9 code boxes are filled (and hidden `user_code_text` equals the expected 9-character code) before any submit attempt.
- If code-box fill verification fails after one clean re-entry, mark mailbox `burned` and restart with a fresh mailbox.
- If the page navigates away from `deviceauth/callback` before `Signed in to Codex`, treat as trouble: close incognito, burn mailbox, restart fresh.
- On `Email Accounts`, verify the page text contains `Modify Email Accounts(...)` before searching rows.
- Search using the full mailbox (`local@domain`), not partial local-part only.
- If a target row is not found on first pass, clear search, re-apply full mailbox search, wait, then retry once with local-part search.
- If row is still unresolved after retries, mark mailbox `burned` and switch to a fresh mailbox.
- Treat mailbox auth as successful only if Stackmail URL is `?_task=mail&_mbox=INBOX` (not `?_task=login`).
- Use `Resend email` before reading code from inbox to avoid stale OTP reuse.
- Prefer `Log in with a one-time code` for authentication flows.

## StackCP + Stackmail Handling
1. Open `https://www.stackcp.com/services/be2e4e715ddd64f5/email/email-accounts`.
2. Confirm table is hydrated (`Modify Email Accounts` visible).
3. Filter/search for the exact mailbox.
4. Set/reset mailbox password in row input, then click row `Save`.
5. Preferred: open `https://www.stackmail.com/?_task=login` directly and sign in explicitly with target mailbox + the StackCP-reset password.
6. Fallback only: row `Options` -> `Webmail`, then verify account label.
7. Immediately verify Stackmail account label exactly matches target mailbox (for example `codex259@thenewfuse.com`).
8. If Stackmail account label does not exactly match target mailbox, stop, mark target mailbox `burned`, and restart with a fresh mailbox.
9. Verify inbox URL is `?_task=mail&_mbox=INBOX`.
10. Refresh inbox and read latest `Your ChatGPT/OpenAI code` message.

## OTP Submission Rules
- Never reuse old codes after a resend.
- Pull the newest code immediately after resend from the same mailbox inbox.
- If OTP email history indicates pre-existing OpenAI usage for this mailbox before the run, abort this mailbox and switch to a new one.
- If verification UI errors, reload verification URL and repeat resend -> retrieve -> submit.
- If credential flow falls back to password route, explicitly switch back to `Log in with a one-time code`.
- Never follow social-provider branches during recovery; always stay on email + one-time-code route.
- On OpenAI auth pages, never force-submit forms with raw POST calls (for example `form.submit()` or direct POST to `/email-verification`).
- Always enter fields and click the visible route action button (`Continue`, `Verify`, `Log in`) so the route action is invoked correctly and avoids `405 Method Not Allowed`.
- Forbidden submit methods on OpenAI auth routes: `form.submit()`, `requestSubmit()`, synthetic `submit`/keyboard events, JS-evaluated `element.click()`, or any direct `fetch`/XHR/HTTP replay to route endpoints.
- Allowed submit method on OpenAI auth routes: type into visible fields, then trigger only a trusted user-style interaction on the visible action button (`Continue`, `Verify`, `Log in`) in the page UI.
- Before any submit on `/email-verification`, confirm the UI has both the OTP field and visible action button; if either is missing, do not submit.
- For segmented DOB fields, never set only a 1-2 digit year; always enter full 4 digits and verify `input[name="birthday"]` reflects `YYYY-MM-DD` before submit.

## 405 Prevention Protocol (Hard Stop)
1. On `auth.openai.com/email-verification`, never use scripted submission paths of any kind.
2. Submit only via the visible route action control in-page.
3. If `Route Error (405 Method Not Allowed)` appears once:
   - return to the verification UI
   - click `Resend email`
   - retrieve the newest OTP
   - re-enter OTP
   - submit only via visible action button
4. If 405 repeats after one clean retry, restart the verification flow from `Log in with a one-time code` and continue only with trusted visible-button submissions.

## Recovery Rules
- If StackCP API/XHR returns `403 {"redirect":true}`, continue via visible UI controls on the page.
- If DOM selectors are unstable, use rendered text confirmation first, then locate nearest row controls.
- If window ordering changes, re-enumerate Chrome windows/tabs before each critical step.
- If auth flow shows `Route Error (405 Method Not Allowed)` on `/email-verification`, treat as a submission-method violation and execute the full `405 Prevention Protocol (Hard Stop)` above.
- If auth shows `invalid_state` (or similar state/csrf session error), close the incognito window, burn the mailbox for this run, and restart with a fresh mailbox in a new incognito window.
- If `about-you` rejects otherwise valid data, inspect segmented DOB values and hidden `input[name="birthday"]`; malformed years (e.g. `18` -> `0018-...`) must be corrected by full re-entry of `MM/DD/YYYY`.
- If auth flow indicates an existing account rather than account creation, treat mailbox as already used, stop this run, and move to a new mailbox.
- If any unexpected route appears (including social IdP pages), treat as trouble: update skill guard, mark mailbox `burned`, and restart with a fresh mailbox.

## Codex Auth Handoff
1. Open a new visible top-level Terminal.app window (not a subterminal, not a background terminal session).
   macOS helper:
```bash
osascript -e 'tell application "Terminal" to do script ""' -e 'tell application "Terminal" to activate'
```
2. Run device authorization flow (no browser auto-open):
```bash
codex login --device-auth
```
3. In Terminal, copy:
   - device URL (for example `https://auth.openai.com/codex/device`)
   - one-time device code (for example `ABCD-EFGHI`)
4. Verify there is no auth tab in normal Chrome profile windows.
5. In the existing incognito window, open the device URL yourself (do not hand off this action to the user).
6. Enter the same target mailbox email when prompted.
7. Choose `Log in with a one-time code`.
8. Return to Stackmail inbox, refresh, copy latest verification code.
9. Paste OTP in incognito and continue.
10. Enter the Terminal device code in the incognito page and submit.
10a. On `deviceauth/callback`, do not use `Tab` to move between character boxes.
10b. After entry, verify all 9 boxes and hidden `user_code_text` exactly match the terminal code (without dash) before submit.
10c. Submit only when still on `deviceauth/callback` and the visible `Continue` action is focused.
11. Complete consent (`Continue`) on `Sign in to Codex with ChatGPT`.
12. In the same tenant, run `codex login status` and confirm it reports logged in.
13. Decode tenant `id_token` payload and confirm `email` exactly matches the target mailbox.

Identity check command:
```bash
ID=$(jq -r '.tokens.id_token' "$CODEX_HOME/auth.json")
PAY=$(printf '%s' "$ID" | cut -d'.' -f2)
PAD=$(( (4 - ${#PAY} % 4) % 4 ))
PAY_PAD="$PAY"; [ $PAD -eq 2 ] && PAY_PAD="$PAY=="; [ $PAD -eq 1 ] && PAY_PAD="$PAY="; [ $PAD -eq 3 ] && PAY_PAD="$PAY==="
printf '%s' "$PAY_PAD" | tr '_-' '/+' | base64 -d 2>/dev/null | jq -r '.email'
```

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

## No-Background-Terminal Rule
- Default and required behavior: use a visible top-level Terminal.app window for auth and `/status` checks.
- Do not use background terminal sessions for this skill.

## Pre-Submit Checklist (Hard Stop)
- Selected mailbox is brand-new for ChatGPT/Codex (not reused).
- Persona name is a human first-and-last name.
- DOB is valid and age is 25-75.
- `input[name="birthday"]` is valid `YYYY-MM-DD` (no malformed year).
- No validation error text is present on the form.
- No social IdP branch was used at any point.
- No scripted submit path was used on OpenAI auth pages (only visible route action button interaction).
- Codex auth URL was opened only in incognito.
- A visible top-level Terminal.app window was used for `codex login` and verification.
- `codex login status` succeeds under target `CODEX_HOME`.
- Tenant token email matches the target mailbox.
- No prior-use signals were encountered during preflight/auth.
- Run ledger has a final mailbox status (`success` or `burned`) and no ambiguous in-progress state.

## Completion Criteria
Mark run complete only when all are true:
- Selected inbox is new (not previously used for ChatGPT/Codex).
- ChatGPT account is active for the selected inbox.
- Codex CLI is authenticated with that same identity.
- `codex login status` reports logged in in that tenant.
- Tenant `id_token` email equals the selected inbox.
- `/status` confirms non-interrupting approvals and full-access sandbox.
- Account is ready for assignment to a local Sub-Director Agent.
- The webmail tab used for OTP retrieval is closed.
- The incognito window used for ChatGPT/Codex auth is closed.

## Operational Notes
- SSH access is already established for this environment
- Work on one identity at a time to avoid code/email mismatch.
- Always refresh Stackmail before assuming a code was not sent.
- Preserve deterministic naming/password conventions used by your existing process.
- Use run ledger file: `/Users/<owner>/.codex/skills/email-custodian-agent/references/RUN_LEDGER.md`.
