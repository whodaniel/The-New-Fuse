Use `$email-custodian-agent` for exactly one identity at a time.

Non-negotiable constraints:
0. Existing mailbox/account reuse is forbidden for new terminal agents. Use only a brand-new identity.
0a. Before any Stackmail login, go to `https://www.stackcp.com/services/be2e4e715ddd64f5/email/email-accounts` and set/reset the target mailbox password there.
0b. If any trouble occurs for the mailbox (flow error, route mismatch, 405 recurrence, ambiguity), mark the mailbox burned for this run and switch to a fresh mailbox.
0c. If any trouble occurs, stop, refine `SKILL.md` with a concrete guard for that failure, reload instructions, and restart from preflight.
1. ChatGPT/Codex auth pages must run in a Chrome incognito window only.
2. Never allow auth URL tabs in normal Chrome windows.
2a. Use only email + one-time-code auth on OpenAI pages; never click social IdP options (Google/Apple/Microsoft/phone).
2b. Do StackCP + Stackmail preflight before opening any incognito window.
2c. If Stackmail opens in incognito, mark mailbox burned, close incognito, and restart with a fresh mailbox.
2d. Right after opening Webmail, verify Stackmail account label exactly equals target mailbox; any mismatch burns the target mailbox and requires restart with a fresh mailbox.
2e. Prefer direct Stackmail login (`https://www.stackmail.com/?_task=login`) with explicit mailbox+password over `Options -> Webmail` to avoid mailbox context drift.
2f. StackCP row resolution must use retry policy: full-mailbox search, clear/research, local-part search; unresolved row burns mailbox.
2g. If OpenAI auth returns `invalid_state`/session-state errors, close incognito, burn mailbox, and restart with fresh mailbox in a new incognito window.
2h. Never use fixed tab indexes for critical actions; resolve tabs by URL and verify page context text first.
2i. Before every typed input/click, assert active URL+heading match intended step; on mismatch, re-target before action.
2j. On `deviceauth/callback`, never use Tab traversal across code boxes; it can shift focus to footer links and navigate away.
2k. On `deviceauth/callback`, verify all 9 character boxes and hidden `user_code_text` exactly match expected terminal code (without dash) before submit.
2l. If code-box verification fails after one clean re-entry, burn mailbox and restart with a fresh mailbox.
2m. If page leaves `deviceauth/callback` before `Signed in to Codex`, treat as trouble: close incognito, burn mailbox, restart fresh.
3. Use a visible top-level Terminal.app window only (no background terminal sessions).
4. Run `codex login --device-auth`, then open only the printed device URL in incognito and enter the printed device code there.
5. Persona name must be a realistic human first-and-last name.
6. DOB must produce age 25-75.
   - For runs on `2026-03-24`, allowed DOB is exactly `03/25/1950` to `03/24/2001` inclusive.
   - Safe core years: `1951-2000`; edge years require date checks (`1950` from `03/25`, `2001` through `03/24`).
7. Before submit, verify:
   - spinbutton month/day/year are correct
   - `input[name="birthday"]` is valid `YYYY-MM-DD`
   - `input[name="birthday"]` is within the allowed run-date range
   - no validation error text is visible
8. Never set DOB through direct DOM mutation (`textContent`/hidden input assignment).
9. After Codex auth, verify both:
   - `codex login status` is logged in under target `CODEX_HOME`
   - decoded tenant token email equals target mailbox
10. If any prior-use signal appears (old OpenAI OTP history, existing-account auth path), abort this mailbox and switch to a different one.
11. If any rule is violated, stop and correct before continuing.
12. On `auth.openai.com/email-verification`, never submit with scripted methods (`form.submit`, `requestSubmit`, synthetic submit/key events, JS-evaluated `element.click`, direct POST/fetch/XHR replay).
13. OpenAI auth submissions are allowed only by trusted user-style interaction with visible route buttons (`Continue`, `Verify`, `Log in`).
14. If `Route Error (405 Method Not Allowed)` appears, run one clean retry only: reload verification UI, click `Resend email`, fetch newest OTP, re-enter, submit via visible button; if 405 recurs, restart one-time-code login flow.
15. Maintain `/Users/<owner>/.codex/skills/email-custodian-agent/references/RUN_LEDGER.md` with mailbox lifecycle states: `started`, `burned`, `created_chatgpt`, `codex_authed`, `success`.

Output requirements:
- Confirm each hard check explicitly for the identity before moving on.
- Report completion only when ChatGPT account + Codex auth + sandbox/approval verification all pass.
