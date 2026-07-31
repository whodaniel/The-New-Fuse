# Video Analysis Report

## Metadata
- **Video**: DeepSeekV4 + Claude Code = 100X Cheaper
- **Index**: #665
- **URL**: https://www.youtube.com/watch?v=tn7zXRv3Xmo
- **Duration**: 16:49
- **Processed**: 2026-05-10T01:27:31.147Z

---

## Summary
Technical tutorial demonstrating how to integrate DeepSeek V4 with Claude Code via a local proxy server to achieve ~100x cost reduction. The solution uses the open-source 'free-claude-code' repo to intercept Anthropic API calls and route them to DeepSeek's API, enabling dual-terminal workflows where users can run Claude and DeepSeek-backed Claude Code simultaneously.

## 🦾 Visual Intelligence
- **0:00**: VS Code interface showing Antigravity extension with file explorer revealing project structure - deepseek folder with api, cli, config, core, messaging, providers, smoke, tests directories; .env.example visible; chat panel shows repo being cloned from GitHub
- **0:01**: Non-technical frame - coffee brand website advertisement - grind.co.uk e-commerce site, not relevant to technical content
- **0:02**: Benchmark comparison chart with specific model performance data - Bar chart comparing DeepSeek V4 Pro (blue), Claude Sonnet 4.6 (orange), Claude Opus 4.7 (red) across 4 benchmarks: SWE-bench Verified, LiveCodeBench, TerminalBench 2.0, MCP Atlas
- **0:03**: Architecture diagram showing dual-terminal proxy setup - Vintage-style technical drawing: Terminal 1 (DeepSeek whale logo) and Terminal 2 (Anthropic flower logo) connected via PROXY :8082 to DeepSeek API and Anthropic API respectively
- **0:04**: GitHub repository page with project details and stats - Alishahryar1/free-claude-code repo: 17.1k stars, 2.4k forks, 110 watching, MIT license, Python 99.6%. Recent commits show deepseek integration features
- **0:05**: Code snippet showing shell alias configuration for proxy routing - Bash aliases in ~/.zshrc: ds and dsp with ANTHROPIC_AUTH_TOKEN='freecc' and ANTHROPIC_BASE_URL='http://localhost:8082'. Table explains ds=normal permissions, dsp=skip permissions
- **0:06**: Terminal showing Claude Code v2.1.121 running with DeepSeek backend - Split terminal view: left shows Claude Code terminal with Sonnet 4.6 / API Usage Billing, right shows chat panel with installation summary (uv 0.11.8, Python 3.14, repo cloned to $HOME/deepseek)
- **0:07**: Model selection guide for different coding tasks - 8-card grid showing task-to-model mapping: Claude for landing pages, UI/UX polish, multi-file refactors, documentation; DeepSeek V4 for scripts/automation, algorithms, unit tests; GPT-5.5/Codex for code review
