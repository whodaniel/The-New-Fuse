# Video Analysis Report

## Metadata
- **Video**: What is an Agent Harness? and How to build a great one!
- **Index**: #677
- **URL**: https://www.youtube.com/watch?v=nWzXyjXCoCE
- **Duration**: 20:33
- **Processed**: 2026-05-10T01:03:34.510Z

---

## Summary
Technical deep-dive defining an 'agent harness' as a fixed architecture that turns an LLM into an agent, contrasting it with frameworks like LangChain/LangGraph. The video presents nine components of a modern harness (while loop, context management, skills & tools, sub-agents, built-in skills, session persistence, system prompt assembly, lifecycle hooks, permissions & safety) and demonstrates building one in Python with a tool registry dispatch table.

## 🦾 Visual Intelligence
- **0:16**: Conceptual diagram showing ambiguous terminology - Text cloud: langgraph?, autogen?, agent loop?, framework?, MCP?, cursor?, react pattern?, claude code? with caption 'the word gets thrown around constantly'
- **2:20**: Architecture overview of 9 harness components - Circular diagram labeled 'HARNESS VERSION 1.0' with numbered segments 01-09. List: 01 while loop, 02 context management, 03 skills & tools, 04 sub-agents, 05 built-in skills, 06 session persistence, 07 system prompt assembly, 08 lifecycle hooks, 09 permissions & safety
- **3:00**: Skills vs tools architecture diagram - Two-tier architecture: SKILLS (markdown, team-specific) with examples git_commit.md, open_pr.md, run_tests.md, deploy.md; TOOLS (primitives, universal) with read_file, edit_file, bash, search
- **4:00**: Sub-agent spawning architecture - Parent main thread spawns three isolated sessions: EXPLORE (read-only), GENERAL (full), VERIFY (execute+read)
- **7:00**: Python code implementation of tool registry - harness/tools.py showing Tool dataclass and ToolRegistry class with register/get/descriptors methods. Key takeaway: 'Skills are tools too. They just live in markdown.'
