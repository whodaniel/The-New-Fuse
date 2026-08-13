---
name: stitch-direct
description: Programmatically interact with the Google Stitch MCP server via direct JSON-RPC over stdio. Use when high-level design tools fail or when precise control over project creation, screen generation, and code retrieval is required.
---

# Stitch Direct Integration

This skill provides a robust bridge to the Google Stitch MCP server, bypassing UI-level abstractions to interact directly with the design engine.

## Core Workflow

1.  **Set Authentication**: Ensure the `STITCH_API_KEY` is available in your environment.
2.  **Invoke the RPC Script**: Use `scripts/stitch_rpc.py` to communicate with the server.
3.  **Reference the Schema**: Consult [api_reference.md](references/api_reference.md) for tool names and argument structures.

## Usage Examples

### List All Projects
```bash
python3 scripts/stitch_rpc.py list_projects '{}'
```

### Create a New Project
```bash
python3 scripts/stitch_rpc.py create_project '{"title": "My New App"}'
```

### Generate a Dashboard Screen
```bash
python3 scripts/stitch_rpc.py generate_screen_from_text '{"projectId": "YOUR_ID", "prompt": "A modern analytics dashboard", "deviceType": "DESKTOP"}'
```

### Fetch HTML Code
```bash
python3 scripts/stitch_rpc.py fetch_screen_code '{"projectId": "YOUR_ID", "screenId": "SCREEN_ID"}'
```

## Best Practices

- **Timeout Management**: Screen generation can take up to 2 minutes. The `stitch_rpc.py` script has a default 120s timeout.
- **Project IDs**: Most tools require the `projectId`. This is the numeric ID found at the end of the project `name` (e.g., in `projects/12345`, the ID is `12345`).
- **Quiet Mode**: The `stitch-mcp` server is invoked with `--quiet` to suppress non-JSON noise on `stdout`.

## Ongoing Improvement

- **Persistent Learning Log**: Maintain a `notes/` directory within this skill. After each RPC interaction or screen generation, append an entry to `notes/session-log.md` detailing the approach taken, success/failure status, and any lessons learned.
- **Success Documentation**: When a complex screen or project is generated successfully, capture the effective prompt and tool-call sequence in `references/success-patterns.md`.
- **Instruction Refinement**: Proactively suggest clarifications to `SKILL.md` or `references/api_reference.md` via `/replace` if instructions lead to errors or inefficiencies.
