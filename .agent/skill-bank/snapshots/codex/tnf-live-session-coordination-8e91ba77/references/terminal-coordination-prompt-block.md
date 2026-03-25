# Terminal Coordination Prompt Block

Use this prompt block when another terminal-based agent needs to poll live
terminal sessions, avoid collisions, and escalate to `orchestrator-agent` only
when warranted.

## Reusable Prompt

```text
Run TNF live-session coordination protocol.

Goal:
1. identify every live terminal agent/session,
2. determine what each is working on,
3. detect overlap or conflict,
4. preserve coherent lane ownership,
5. invoke orchestrator-agent only if cross-terminal consultation, reassignment,
   or conflict resolution is warranted.

Rules:
1. use metadata-first inspection before reading buffers,
2. prefer shared thread context and durable repo artifacts over raw TTY writes,
3. do not inject text into another live terminal unless explicitly required and
   verified safe,
4. if a session is newly discovered, create a provisional TNF discovery record,
5. if a session already owns an edge, do not race it; define a lane split.

For each live session, collect:
1. tnf_agent_id if known, otherwise provisional discovery ID
2. tty
3. shell pid
4. current working directory
5. foreground/main process
6. repo or project path
7. current task edge
8. active vs idle state
9. overlap risk with other sessions
10. short visible-buffer summary
11. recommended disposition: continue, consult, pause, or no action

Conflict test:
1. same repo plus same files or subsystem
2. same deploy/runtime surface
3. same protocol or design edge
4. contradictory assumptions or plans
5. unclear ownership of the task edge

Escalate to orchestrator-agent when:
1. two or more sessions appear to own the same edge,
2. a handoff or lane split is needed,
3. protocol understanding differs,
4. a production-risk surface is involved,
5. safe ownership inference is not possible from local evidence

Output:
1. session inventory
2. overlap/conflict matrix
3. recommended lane ownership
4. sessions that should continue, pause, or be consulted
5. whether orchestrator-agent was invoked and why
```

## Notes

1. Treat this as a reusable operator block, not a replacement for durable
   artifact-based coordination.
2. If the task matters later, write the lane split or consultation outcome into
   a repo artifact or shared note.
3. If another session is newly discovered, follow the discovery fingerprint and
   tagging rules before deeper consultation.
