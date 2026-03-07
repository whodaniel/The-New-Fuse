# Poker Asset Wiring Audit

## Summary

- Canonical asset set referenced in runtime files (`script.js`, `styles.css`,
  `index.html`): **58/58**
- Unwired canonical assets by manifest code: **0**
- Static `/assets/...` refs checked: **110**
- Missing file paths among static refs: **0**

## Scope Wired

- Live table: felt variants, seat frames, dealer marker, action textures, state
  banners.
- Showcase surfaces: table/tournament/economy skins and icon rails using
  canonical `pkr_*` assets.
- Brand/shell: desktop and mobile shell backgrounds, logo mark, wordmark.
- HUD/panel surfaces: fairness, ledger, network health, sponsor market/chat
  panel textures.
- Mobile-specific visuals: action sheet, tab bar, drawer handle, compact table
  header.
- Error-state visuals: chain mismatch / insufficient funds cards via shared
  panel error flow.

## Remaining Work To Be Production-Ready

- Visual QA pass: verify every wired asset is semantically correct for its UI
  context (some are currently used as decorative rail icons).
- UX fit/finish: tune scaling/cropping for desktop/tablet/mobile breakpoints and
  avoid stretched panel art.
- Functional QA: run end-to-end flows and browser-console inspection for real
  interactions.
- Accessibility pass: contrast/readability and alt-text strategy for decorative
  vs informative imagery.
