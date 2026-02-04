---
name: conductor-protocol
version: '1.0.0-tnf'
description: |
  Adopts the Google Gemini Conductor protocol for strict, file-based context management.
  Leverages the `conductor/` directory structure to maintain product state, tech stack info, workflows, and development tracks.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - list_dir
---

# Conductor Protocol

The **Conductor Protocol** is the TNF adoption of Google's Gemini Conductor
standard. It enforces a "planning-first" workflow using a structured directory
of Markdown files.

## Directory Structure

All Conductor files reside in the `conductor/` directory at the project root.

### Project Level (`conductor/`)

- `product.md`: High-level product vision and goals.
- `tech-stack.md`: Defined technology stack.
- `workflow.md`: Standard operating procedures and workflows.
- `tracks.md`: Registry of all active and past development tracks.

### Tracks (`conductor/tracks/<id>-<slug>/`)

Every logic unit of work must be a **Track**.

- `spec.md`: Detailed requirements and "blueprint" for the track.
- `plan.md`: Step-by-step implementation plan with checkboxes.
- `metadata.json`: Machine-readable status (id, status, owner).
- `index.md`: Navigation index.

## Workflow

1. **Start a Track**:
   - Determine the next available ID from `tracks.md`.
   - Create the directory `conductor/tracks/<id>-<slug>/`.
   - Create `spec.md`, `plan.md`, `metadata.json`, and `index.md`.
   - Register the track in `tracks.md`.

2. **Execute a Track**:
   - Read `spec.md` and `plan.md` to load context.
   - Execute step by step.
   - Update `plan.md` (check boxes) as you progress.
   - If plans change, update `plan.md` and `spec.md` first.

3. **Complete a Track**:
   - Update `metadata.json` status to "completed".
   - Update `tracks.md` status.

## Migration from `planning-with-files`

Use Conductor tracks for formal feature development. Historic `task_plan.md`
usage should be migrated to a Conductor track if it represents a significant
unit of work.
