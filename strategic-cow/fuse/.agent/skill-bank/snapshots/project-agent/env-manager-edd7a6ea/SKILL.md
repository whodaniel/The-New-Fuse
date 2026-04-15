# Environment Manager Skill

**Skill ID**: `env-manager` **Type**: Configuration & Utility Skill **Purpose**:
Programmatic management of environment variables across the TNF ecosystem.
**Status**: Active

---

## Purpose

Enables AI agents to safely read, write, and verify environment variables in
`.env` files. This is critical for configuring LLM keys, database URLs, and
service ports without manual user intervention.

## Core Capabilities

1.  **Programmatic Set**: Set/Update environment variables with automatic
    backups.
2.  **Verification**: Check if required environment variables (like
    `DATABASE_URL` or `ANTHROPIC_API_KEY`) are present.
3.  **Audit**: List all current environment variables in a target file.
4.  **Backup/Restore**: Automatically creates timestamped backups before
    modification.

## Usage Guide

### 1. Verification (Pre-flight)

Use this before starting services to ensure configuration is valid.

```bash
python .agent/skills/env-manager/scripts/manage_env.py --action check --key DATABASE_URL
```

### 2. Setting Variables

Use this to configure new integrations or update expired tokens.

```bash
python .agent/skills/env-manager/scripts/manage_env.py --action set --key NEW_VAR --value "some_value"
```

### 3. Reading Variables

Retrieve specific values for use in scripts or API calls.

```bash
python .agent/skills/env-manager/scripts/manage_env.py --action get --key PORT
```

## Best Practices

- **Never Overwrite Without Backup**: Always allow the script to create a backup
  unless explicitly told otherwise.
- **Validate After Set**: Always run a `--action check` after a `--action set`
  to confirm the file was updated correctly.
- **Path Awareness**: By default, it looks for `.env` in the current directory.
  Use `--path` for target applications (e.g., `apps/api/.env`).

## Fail-Safe Protocol (3-Strike)

1.  **Attempt 1**: Try setting the variable using the script.
2.  **Attempt 2**: If failure (e.g., permission error), verify file path and
    permissions using `ls -l`.
3.  **Attempt 3**: If still failing, check if the disk is full or if there are
    locked files.
4.  **ESCALATION**: If unable to set a CRITICAL variable (like a key needed for
    the task), inform the user immediately.

---

**Last Updated**: 2026-02-19 **Version**: 1.0.0
