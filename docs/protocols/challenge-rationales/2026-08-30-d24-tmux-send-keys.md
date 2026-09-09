# D24 multiplexer keystroke path — 2026-08-30

`[CLASS:PRIME] [STATUS:PROPOSED] [DOC_TYPE:CHALLENGE_RATIONALE] [VISIBILITY:COLLECTIVE]`

- file: docs/protocols/DIRECTIVES.md
- file: docs/protocols/TNF_OPERATOR_TERMINAL_INVIOABILITY_PROTOCOL.md
- doc_hash_directives:
  sha256:481e779d218b29a1ca50a10062807bc78fb814f52442bb8122cf7b6a6437d9ce
- doc_hash_protocol:
  sha256:fb4eed63d0a69ccd853606112ca640d66f374170f49131cf46a4e1e7fdc38d66

## Assumption challenged

D24 was written against AppleScript (`activate`, `set frontmost`,
`window id N`). That left `tmux send-keys` — a write into a pane with no
Accessibility checkpoint — ungoverned. Filling TWIP's multiplexer surface
without widening D24 would reopen the 2026-07-28 composer-injection hole.

## Replacement behavior

Treat `tmux send-keys` as a keystroke path. Allow it only in
`scripts/lib/tnf-tmux-inject.cjs` after `shouldInjectTmuxPane` (operator-class
`tnf-o-*` hard deny, attached-active pane skip, typing/composer skip). Enter
stays behind `TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION`. The CI guard fails
any other `send-keys` in runtime scripts.

## Safety invariants retained

- no `activate` / `set frontmost`
- structured bus remains the default heartbeat channel
- opt-in still requires challenge_rationale + log entry
- capture-pane remains read-only

## Authority basis

Operator approved the multiplexer convention plan and said proceed after Phase
A, including the locked send-keys go/no-go.
