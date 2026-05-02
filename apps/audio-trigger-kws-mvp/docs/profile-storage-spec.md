# User Profile Storage Spec

## Design Principle

The `audio-trigger-kws-mvp` pipeline is **user-agnostic** in the codebase — no personal data is committed to git. Individual users personalize their experience through local profile files that live outside version control.

## Directory Layout

```
apps/audio-trigger-kws-mvp/
├── configs/
│   └── profiles/
│       ├── default.json          # Template profile (tracked in git)
│       └── <userId>.json         # Per-user profiles (gitignored)
├── users/                        # Optional: extended per-user data (gitignored)
│   └── <userId>/
│       ├── preferences.json      # UI/modal preferences
│       ├── keyword-sets.json     # Custom keyword sets
│       └── history/              # Trigger history, feedback logs
```

## configs/profiles/ (Primary Storage)

- **Purpose**: JSON files loaded at startup by `ProfileService`
- **Schema**: Matches `UserProfile` interface in `src/services/profile/schema.ts`
- **Naming**: `<userId>.json` — e.g., `default.json`, `daniel.json`
- **Default**: `default.json` is the template and is tracked in git
- **Custom profiles**: Created via `PUT /v1/profiles/:userId` API, stored as `<userId>.json`, gitignored via `.gitignore` rule `configs/profiles/*` with `!configs/profiles/default.json` exception

## users/ (Extended Storage — Future)

- **Purpose**: Extended per-user data that doesn't fit in the flat profile JSON
- **Contents**: Trigger history logs, feedback data, custom rule sets
- **Status**: Directory structure defined here but not yet implemented in code
- **Git**: Entirely gitignored

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/profiles` | List all profile IDs |
| GET | `/v1/profiles/:userId` | Get a specific profile |
| PUT | `/v1/profiles/:userId` | Create/update a profile (body = `ProfileUpdate`) |

## Echo Suppression

To prevent AI TTS output from re-triggering the KWS pipeline:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/echo/speaking-start` | Mark system as speaking (suppress KWS hits) |
| POST | `/v1/echo/speaking-end` | Mark system as done speaking (grace period: 1500ms) |
| GET | `/v1/echo/status` | Query current speaking state |

## Privacy Notes

- Profile data contains personal information (name, interests, thresholds)
- `configs/profiles/` uses gitignore to exclude all profiles except `default.json`
- `users/` directory is entirely gitignored
- The ProfileService uses synchronous file I/O for compatibility with the existing singleton import pattern
