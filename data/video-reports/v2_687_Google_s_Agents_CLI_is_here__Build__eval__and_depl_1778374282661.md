# Video Analysis Report

## Metadata
- **Video**: Google’s Agents CLI is here: Build, eval, and deploy AI agents in minutes | The Agent Factory
- **Index**: #687
- **URL**: https://www.youtube.com/watch?v=nXafozNIk3c
- **Duration**: 52:59
- **Processed**: 2026-05-10T00:51:22.661Z

---

## Summary
Technical interview with Shubham Sabu, Senior AI Product Manager at Google, discussing Google's new agentic tools including ADK 2.0 and the Agents CLI. The video demonstrates how to build, evaluate, and deploy AI agents using these tools, with a live demo of creating a 'caveman-agent' that compresses technical text into terse grunts.

## 🦾 Visual Intelligence
- **0:11**: Speaker introduction with name/title overlay - Smitha Kolan, Senior Developer Relations Engineer @ Google, introducing Shubham. Visual utility low - just speaker face with title card.
- **0:00**: Documentation page for google/agents-cli with installation instructions - Shows prerequisites (Python 3.11+, uv, Node.js), install command `uvx google-agents-cli setup`, platform support note, and authentication details. High utility for setup instructions.
- **0:00**: Skills table showing 7 bundled CLI skills - Lists all 7 skills: google-agents-cli-workflow, adk-code, scaffold, eval, deploy, publish, observability with descriptions. High utility for understanding tool capabilities.
- **0:00**: Terminal demo showing caveman-agent creation steps - Shows 3-step process: 1) Scaffold with adk template, 2) Update app/agent.py, 3) Install dependencies and test. Includes example input/output showing agent compressing technical text into terse grunts.
- **0:00**: Agent Development Kit web UI showing interactive chat - ADK UI v1.31.0 with chat interface showing conversation with caveman-agent. Event details panel visible with Event ID, Invocation ID, Branch, Timestamp, Author fields.
- **0:00**: Terminal showing evaluation results - `agents-cli eval` run against 20 test cases, caveman-agent scored perfectly (20 passed, 0 failed). Shows workspace path `~/Desktop/agents_cli_demo` and model `gemini-3-pro-preview`.
- **0:00**: Terminal showing Google Search tool integration - Shows `google_search` tool added to agent, import updated in `app/agent.py` to use `google.adk.tools.google_search`. Example shows agent searching for latest AI news and returning compressed 'tech grunts' about current events.
