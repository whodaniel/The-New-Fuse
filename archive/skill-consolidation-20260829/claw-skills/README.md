# @the-new-fuse/claw-skills

Canonical markdown skill packs shared by OpenClaw and PicoClaw.

Consumer trees keep **relative symlinks** into this package so skills do not
drift across copies:

| Consumer                                              | Symlinks to here                                                 |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| `TNF-Extensions/openclaw/skills/*`                    | TNF + OpenClaw-facing packs                                      |
| `TNF-Extensions/picoclaw-overseer/pkg/skills/*`       | content skills only (`loader.go` / `installer.go` stay in Go)    |
| `TNF-Extensions/picoclaw-overseer/workspace/skills/*` | shared packs; operator overlays (`github`, `tmux`, …) stay local |

Core redirect: `The-New-Fuse/apps/extensions` → `../TNF-Extensions`.

## Packs in this package

- `context-frontloader`
- `continuous-improvement`
- `framework-consciousness`
- `library-of-living-knowledge`
- `skill-builder`
- `skill-creator`
- `openclaw-universal-knowledge` (OpenClaw metadata canonical)
- `sherpa-onnx-tts`
- `turn-zero-validator`
- `tnf-scaffold`

## Edit rules

1. Edit skills **only** under `packages/claw-skills/<name>/`.
2. Do not replace symlinks with real directories in the consumer apps.
3. New shared packs: add here, then `ln -s` from each consumer that should see
   them.
4. Pico/OpenClaw-only overlays that must diverge stay under that app’s `skills/`
   tree as real directories (workspace overlays today: `github`, `hardware`,
   `overwatch`, `summarize`, `tmux`, `weather`).

Created 2026-08-09 as part of the apps cohesion audit.
