# Popup Autonomy Quick Guide

## Where To Find Controls

- Open extension popup.
- `Services` tab:
  - Start/stop `TNF Relay`
  - Start/stop `Relay Monitor`
  - Start/stop `Master Clock`
  - View `Autonomy Status` panel (overall, monitor, master clock, wake ping,
    last wake ping)
- `Settings` tab:
  - `Auto Monitor`
  - `Auto Master Clock`
  - `Auto Wake Ping`
  - `Start Autonomy Now`

## Docs Access

- In popup footer, click `Docs`.
- This opens extension page: `popup/docs-index.html`.
- From there, open `Architecture Pattern Index` quick-view.
- Canonical source remains: `docs/ARCHITECTURE_PATTERN_INDEX.md`.

## Notes

- Popup tries `GET_AUTONOMY_STATUS` from background first.
- If unavailable (older background bundle), popup falls back to native-host
  status for monitor/masterClock.
- Last wake ping is best-effort from relay endpoint:
  - `GET http://localhost:3000/activity/recent?count=100`
