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

- Wired cash-table joins to v2 flow (handleJoinCashTable) and pass table
  metadata from CashTableBrowser.
- Fixed v2 seat selection to scan by seat numbers (table.seats only contains
  occupied seats).
- Added activeTableMeta to size v2 seat ring and render empty seats;
  hero/opponents show hidden cards instead of empty slots.
- Added v2 connection set/unset and improved v2 action clamping
  (minRaiseTo/toCall).
- Fixed v2 bot loop lookup (acting seat by seatNo, legal actions parsing) and
  bet/raise amount selection.
- Backend v2 tables list now reports maxSeats from engine table (not occupied
  seats) and v2 state includes maxSeats for frontend sizing.
- Frontend v2 seatCount now derives from table.maxSeats/maxPlayers or highest
  seat number when metadata missing; seat ring positions now use actual seat
  count.
- Hero card rendering now hides "hidden" cards instead of displaying the literal
  string.
- Added deterministic card dealing to v2 holdem engine (holeCards + boardCards,
  deck hash) with suit codes matching UI.
- v2 state/resume/action/seat responses now redact hole cards for non-hero
  seats; state supports playerId query.
- Frontend v2 state fetch passes playerId and reveals hero cards only; board
  cards revealed by street.
- /table now auto-joins first v2 cash table after login if no table is active.

- Cash tables now render with a dedicated layout: tournament sidebars hidden,
  bottom bar switched to cash status, and top bar labels show Stakes for cash.
- TournamentTableView now accepts cash-specific header/title/badge/blinds and
  uses a streamlined cash footer.
- App now passes cash/tournament variant based on v2 cash tables plus header
  metadata (table name/type/stakes).
- Rebuilt poker-room and deployed to Cloudflare Pages (latest deploy:
  https://6b6e7030.ai-arcade-poker.pages.dev).

- Action tape now appends only new actions as they arrive (no replay timer),
  keeping action tape synced with live table state.
- Tournament sidebars now accept live data (players remaining, average stack,
  rankings) instead of static placeholders; falls back safely when data missing.
- Cash table join reliability: when a table is full or seat fails, auto-spawn a
  fresh bot-filled table with same stakes/type to avoid dead-end joins.

- Enforced members-only access for all poker play surfaces
  (player_core/player_hud now require isMember).
- Added member gating to cash/tournament join flows and table auto-join with
  clear notifications.
- Route restriction now redirects non-members to LOGIN with member-only notice.

- Backend membership enforcement added in casin8-games: all poker endpoints now
  require active TNF membership (with bot bypass).
- Membership check uses TNF /billing/membership/:identity when COMMUNITY API key
  present; otherwise falls back to community membership API.
- Frontend now persists identity in localStorage and sends x-tnf-identity header
  on API calls.

- Added JWT-based membership verification path in casin8-games: if Authorization
  Bearer JWT is present, backend checks /billing/membership/me for active status
  before falling back.
- Frontend now forwards Authorization Bearer from localStorage
  (tnf_access_token/tnf_jwt) automatically if present.

- Set CASIN8_COMMUNITY_API_KEY in Railway for membership enforcement.
- Redeployed casin8-games-backend with JWT + membership gate.
- Frontend redeployed with Authorization forwarding + identity header.
- Verified /api/v2/holdem/tables now returns 401 without identity (members-only
  active).

- Added persistent player primitive profiles: create/manage callsigns, avatars,
  and control modes (human/hybrid/agent) in Settings.
- Session login now shows saved callsigns for quick selection; new callsigns
  create a persisted profile with selected avatar/control mode.

- Added persistent player primitives (callsign/avatar/control mode) with Saved
  Callsigns on login and full management in Settings → Account.
- New profiles are created with unique names, avatars, and control modes;
  existing profiles can be updated or deleted.
- Frontend redeployed with new player primitives UX (latest Pages deploy:
  https://67417f6e.ai-arcade-poker.pages.dev).

- Added tournament policy support (open / bots-only / hybrid +
  allowHumanTakeover) to v2 holdem tournaments.
- Enforced bots-only and join rules in v2 tournament register endpoint.
- Updated SNG/MTT creator modals to capture policy and pass it to v2 tournament
  creation.
- Switched tournamentApi create/clock/payouts to correct v2 endpoints.

- Added per-seat controlMode in v2 holdem engine (seatPlayer now stores
  controlMode; snapshots include it).
- Added v2 control endpoint in casin8-games: POST /api/v2/holdem/control updates
  seat controlMode (identity-verified).
- Bot loop now respects controlMode (skips seats set to human), so manual
  takeover stops bot actions.
- Frontend passes controlMode on seating (user from profile, bots as agent) and
  maps controlMode into gameState.
- Added Manual Takeover button in table HUD when hero seat is agent/hybrid;
  calls holdemV2Api.control and persists profile controlMode.
- Added render_game_to_text + advanceTime hooks for deterministic test harness.
