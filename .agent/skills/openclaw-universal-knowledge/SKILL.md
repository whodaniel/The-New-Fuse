---
name: openclaw-universal-knowledge
description:
  Universal OpenClaw knowledge skill for TNF agents. Use when working on
  OpenClaw/PicoClaw architecture, gateway, providers/models, skills authoring,
  tools, channels, installation, operations, troubleshooting, or cross-agent
  skill portability (.agent/.claude/.gemini/.kilo/OpenClaw).
---

# OpenClaw Universal Knowledge

## When to use

Use this skill for any OpenClaw work where correctness depends on official docs
behavior.

## Required references

1. Read [openclaw-skills-spec.md](references/openclaw-skills-spec.md).
2. Read [openclaw-docs-map.md](references/openclaw-docs-map.md).
3. Use [openclaw-sitemap.xml](references/openclaw-sitemap.xml) for full URL
   coverage.

## Cross-ecosystem portability workflow

1. Author canonical TNF folder skill (`SKILL.md` + `references/`).
2. Publish flat adapters for `.claude/.gemini/.kilo`.
3. Keep trigger, safety checks, and output contract semantically equivalent.
