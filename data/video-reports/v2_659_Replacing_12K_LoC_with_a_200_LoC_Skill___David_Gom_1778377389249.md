# Video Analysis Report

## Metadata
- **Video**: Replacing 12K LoC with a 200 LoC Skill — David Gomes, Cursor
- **Index**: #659
- **URL**: https://www.youtube.com/watch?v=WE_Gnowy3uw
- **Duration**: 19:22
- **Processed**: 2026-05-10T01:43:09.249Z

---

## Summary
A technical talk from AI Engineer Europe (presented by Google DeepMind) about how Cursor replaced a complex git worktree feature (shipped in Cursor 2.0, October 2023) with a ~200 line markdown-based skill. The speaker explains how git worktrees enable parallel agent execution, model comparison ('Best of N'), and isolated development environments, and details the journey from a full codebase implementation to a lightweight skill-based approach using markdown prompts.

## 🦾 Visual Intelligence
- **0:00**: Speaker on stage with event branding, no technical content - AI Engineer Europe stage, Google DeepMind sponsor banner, Cursor logo on screen
- **2:00**: Implementation overview slide with bullet points - Lists: UI/UX for worktree creation, Agent Loop and tool call worktree scoping, Worktree setup script execution, Best of N judging, Harness changes and system reminders, Worktree clean up
- **3:00**: Updated implementation slide showing code reduction - Same bullet points with strikethrough on original items, added '~200 LoC skill', GitHub diff badge showing '151 files +2,142 -15,328'
- **4:00**: Code snippet visible - skill definition file - Dark IDE showing TypeScript file with skill definition including name, description, instructions array with worktree setup steps, and examples with model configuration
- **5:00**: Cursor application UI showing worktree comparison - Cursor interface with 'Best of N' results, showing multiple model outputs side by side with recommendations, file changes, and composer/agent selection UI
- **6:00**: Pros slide summarizing benefits - 5 bullet points: less code/maintenance, switch into worktree mid-chat, multiple workspaces, better Best of N judging, stitch pieces from different subagents
- **7:00**: Future roadmap slide with UI mockup - Cursor 3.0 Agent Window with native worktree implementation, multiple agents on same worktree, improved skills, local parallelism beyond git worktrees
