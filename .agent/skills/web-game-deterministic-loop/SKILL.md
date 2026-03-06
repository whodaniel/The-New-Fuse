---
name: web-game-deterministic-loop
description: "Build and iterate HTML/JS canvas web games with a deterministic test loop using the standard Playwright client. Use when a user asks to implement or fix gameplay, controls, collisions, UI states, or regressions in browser games and you must validate behavior with screenshots, render_game_to_text output, and console-error checks after each change."
---

# Web Game Deterministic Loop

## Goal
Ship web-game changes in tight loops: implement a small delta, run deterministic interaction bursts, inspect visual and text-state artifacts, fix issues, and rerun.

## Workflow
1. Locate the game entrypoint and test URL.
2. Ensure the game exposes:
- One primary `<canvas>` used for gameplay.
- `window.render_game_to_text()` returning concise JSON with coordinate-system note and current interactive state.
- `window.advanceTime(ms)` stepping simulation deterministically.
3. Implement one focused change at a time.
4. Run the Playwright client after each meaningful change.
5. Open latest screenshots and compare against `state-*.json`.
6. Check `errors-*.json`; fix first new runtime error before continuing.
7. Re-test major interactions end-to-end: move, shoot/attack, collisions, game-over/win flow, restart path, fullscreen toggle.

## Standard Commands
Set once per shell:
```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export WEB_GAME_CLIENT="$CODEX_HOME/skills/develop-web-game/scripts/web_game_playwright_client.js"
```

Run a hosted game URL:
```bash
node "$WEB_GAME_CLIENT" \
  --url http://127.0.0.1:8000/games/ \
  --actions-file "$CODEX_HOME/skills/develop-web-game/references/action_payloads.json" \
  --click-selector "#start-btn" \
  --iterations 3 \
  --pause-ms 250
```

Run local folder + auto-server helper:
```bash
bash scripts/run_web_game_loop.sh \
  --project /abs/path/to/project \
  --page /games/ \
  --click-selector "#start-btn" \
  --iterations 3
```

## Quality Bar
- Keep in-game HUD text minimal; place controls in menu/start overlay.
- Keep visuals readable (avoid near-black-on-black gameplay).
- Prefer non-blocking mode transitions over `alert()`.
- Ensure fullscreen toggle on `f` works and resize keeps gameplay/input correct.
- Keep `render_game_to_text` aligned with what is visibly on-screen.

## Resources
- `scripts/run_web_game_loop.sh`: Runs local static server + standard Playwright client and writes artifacts.
- `references/action_payloads.md`: Reusable action bursts for movement/combat/menu coverage.
