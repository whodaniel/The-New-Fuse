# Session handoff: announce slash + skill

**TNF_PROTOCOL_ACK**

## Summary

- Wired `/announce` (aliases `/availability-announce`, `/dispatchable`) →
  `tnf agents announce`
- Added skill `tnf-agent-availability-announce` under `.agent` / `.claude`, plus
  fleet and Cursor marketplace command mirrors
- Protocol doc cites slash + skill paths

## Next Actions

1. Push this commit to `main`
2. Re-announce while the Cursor session remains dispatchable
   (`tnf agents announce` or `/announce`)
