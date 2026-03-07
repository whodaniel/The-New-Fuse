# The New Fuse (TNF) UI Feature Map: Matching & Exceeding Kilo AI Claw

To bring TNF to the same tier (and beyond) as strictly-gated platforms like Kilo
AI, Cursor, and V0, we need to implement the following critical UI components
and functionalities.

Since I wasn't able to extract the exact HTML of the authenticated `/claw`
dashboard programmatically, I've compiled this comprehensive structural map of
the core features and UI workflows required to achieve a top-tier Agentic App
Builder interface.

## 1. Core App Layout & Navigation

- **Sidebar Navigation Panel:** For managing projects, active sessions, and
  global deployments.
- **Intelligent Top Header:**
  - Active file/project breadcrumbs.
  - **Model Selection Dropdown:** Quick-switch between LLM engines (Claude 3.5
    Sonnet, GPT-4o, Gemini) mid-conversation.
  - Deployment and network status indicators.
- **Resizable Split Panes:** Allow dynamic resizing of the Chat Window, Editor,
  and Terminal outputs.

## 2. Advanced Multi-Modal Interaction Console (The "Claw" Input)

- **Omni-Input Box:**
  - **@-Mentions:** Reference files, components, MCP tools, or specific
    sub-agents dynamically.
  - Drag-and-drop support for pasting images, datasets, and files.
  - Multi-line code edit mode that expands context.
- **Streaming Chat Interface:**
  - Rich Markdown parsing (syntax highlighting, bolding).
  - Collapsible thought processes ("Agent is thinking...").
  - **Inline Diff Views:** Accept/Reject code changes natively inside the chat
    thread before applying them to files.

## 3. Dynamic Artifacts & Preview Engine

- **Interactive Artifact Viewer:** Similar to Claude/V0, whenever UI code is
  written, a panel dynamically renders a live React/HTML preview of the
  component.
- **Component Versioning Navigation:** Arrows (<, >) above the artifact to
  iterate and step back through design states.

## 4. Context & Knowledge Management

- **Workspace Context Pane:**
  - Visual list of attached/pinned folders and files to strictly bound the LLM's
    context.
  - **Context Saturation Bar:** A real-time token counter / progress bar showing
    how much of the context window is full.
- **Knowledge Base Ingestion:** UI buttons to ingest documentation URLs, repos,
  or PDFs into the vector DB for RAG.

## 5. Extensibility & Orchestration Dashboard

- **Agent Swarm Visualizer:** A specific panel monitoring background sub-agents
  (e.g., checking test runners, analyzing codebase, executing deployment).
- **MCP Tools Connectivity Menu:** An interactive list of connected MCP servers
  with toggles to enable/disable specific skills on the fly.
- **Terminal & Processes Viewer:** Read-only output of live build processes,
  logs, or linting results cleanly isolated into a bottom panel.

## Implementation Next Steps

To begin replicating these components for the TNF frontend, we should
systematically build out:

1. `ChatInteractionPanel` (with rich @-mentions and multi-tool attachments).
2. `ModelSelectionHeader` (for hot-swapping routing).
3. `ArtifactPreviewPane` (to stream execution results).

_If Kilo AI Claw has a specific, unique button or layout quirk not mentioned
here, feel free to paste a screenshot or snippet, and I will integrate it
directly into this map!_
