# Video Analysis Report

## Metadata
- **Video**: Full Workshop: Build Your Own Deep Research Agents - Louis-François Bouchard, Paul Iusztin, Samridhi
- **Index**: #649
- **URL**: https://www.youtube.com/watch?v=mYSRn6PC1mc
- **Duration**: 1:57:03
- **Processed**: 2026-05-10T02:02:35.135Z

---

## Summary
Workshop introduction at AI Engineer Europe conference presenting a multi-agent pipeline system for automating deep research and technical writing. The speakers from 'towards AI' discuss common problems with AI-generated content (AI slop), then introduce their solution: a topic-driven system that uses a deep research agent to produce technical articles with code and images. They cover foundational concepts distinguishing workflows from agents, emphasizing simplicity-first design with a spectrum from simple prompts to multi-agent systems.

## 🦾 Visual Intelligence
- **0:00**: Sponsor slide - no technical content - Platinum sponsors: Braintrust, WorkOS, OpenAI
- **0:12**: Architecture overview slide - Pipeline: Topic in -> deep research agent -> technical article (with code, images and non-slop writing)
- **0:16**: Problem space constraints - Cost per task, latency requirements (real-time vs batch)
- **0:17**: Meme slide - conceptual only - Agent unmasked as prompts, if-else, loops, functions
- **0:23**: Workflow diagram with technical detail - Prompt chaining flow: In -> LLM Call 1 -> Gate -> LLM Call 2/Exit -> LLM Call 3 -> Out
- **0:27**: Conceptual meme slide - Automation workflow with ChatGPT is not an AI Agent
- **0:34**: Decision framework slide - Spectrum: Simple Prompts -> Workflows -> Single Agent -> Multi-Agent Systems. Q4 for workflow selection
- **2:00**: Live coding/demo beginning - Speaker at podium with VS Code visible on screen showing project structure with folders: datasets, media, models, prompts, src, examples, outline, timeline
