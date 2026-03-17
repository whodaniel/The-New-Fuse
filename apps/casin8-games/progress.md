Original prompt: Improve this implementation:
https://poker.ai-arcade.xyz/console ,
/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse

- Added /console-safe asset loading (index.html now uses /console/styles.css +
  /console/script.js).
- CSS asset URLs now resolve relative to /console (./assets/... =>
  /console/assets/...).
- JS poker asset map now uses dynamic base (/console/assets vs /assets).
- Added window.render_game_to_text for Playwright state capture.
- Added ALLOW_CONSOLE_ANON env toggle for local /console testing.
- Script API base keeps /api root paths intact (prevents /console/api
  misroutes).
- Membership gate now bypasses when ALLOW_CONSOLE_ANON=true for local console
  testing.
- Added local asset fallback copies for missing pkr\_\*.png assets so console
  styling renders.
- Playwright snapshots captured in apps/casin8-games/output/web-game-console
  (shot-0.png, shot-1.png). Errors cleared after asset fallback.
- Added /console favicon + backend favicon routing to eliminate missing favicon
  404s.
- Card SVG asset URLs now respect /console/assets path.
- Added /ws no-content response to avoid noisy 404s for unused websocket probe.
- Added LOG_404 env switch for debugging missing static assets.
