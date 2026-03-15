Original prompt: $develop-web-game fully professional presentation and complete!
But, the action is still a bit out of sync and the layout is to crowded where
the cards can't be seen clearly. Also, there is supposed to be active games in
every category.: There are no active games is any category: No Tables Found
There are currently no active tables matching your filter criteria. Would you
like to create a private game? https://poker.ai-arcade.xyz/ /Users/
danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games/AI-ARCADE.XYZ---POKER-ROOM

- Initialized progress log.

- Enlarged table cards and community slots; widened table and spaced seats for
  better readability.
- Slowed action tape cadence to reduce sync issues
  (ACTION_TAPE_INTERVAL_MS=650).
- Cash tables now always show active fallback tables when filters return none,
  with a banner hint.
- Added demo-mode boot (?demo=1) to jump straight into a live-looking table,
  plus render_game_to_text + advanceTime.
- Implemented local demo gameState so table renders even when backend is
  unreachable.
- Playwright snapshots: table renders clearly with larger cards and spacing
  (output/web-game-table/shot-0.png).
- Known: console shows ERR_CONNECTION_REFUSED in demo because backend is
  skipped; harmless in demo-only mode.

- Removed demo-mode boot and local demo game state; game state now only comes
  from live backend logic.
- Renamed bot tournament flow to remove demo wording and IDs
  (bot-table/bot-hand).
- Cash tables no longer show fabricated fallback tables; empty state now offers
  "Start Bot-Filled Table" to launch real play.
- Tournament lobby no longer uses mock tournaments; empty states shown with
  create actions where permitted.

- Added per-user Bot Studio in Settings with localStorage persistence (up to 5
  bots, temperament/risk/AI assist).
- Table join now uses user bots first, then system bots to fill seats; bots are
  registered via agentApi.
- Custom bot avatars default from bot pool when backend omits avatar.
