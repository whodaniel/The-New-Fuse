# TNF Reflect CLI Handoff Receipt

TNF_PROTOCOL_ACK

## Outcome

Wired `tnf reflect` as a first-class CLI command and `/reflect` slash entry. The
command spawns `~/.agents/skills/tnf-self-improvement-loop/scripts/reflect.sh`
(with Claude skills-tree fallback). Host symlink for that skill path was
restored so the documented script path resolves. Command-surface snapshot
updated and live `tnf reflect` verified.

## Next Actions

- Commit and push this receipt with the CLI surface changes.
- After pull on other hosts, confirm the
  `~/.agents/skills/tnf-self-improvement-loop` symlink still exists
  (host-local).
