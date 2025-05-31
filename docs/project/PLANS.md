# The New Fuse: Implementation Plans

## Overview

This document records approved implementation plans for significant features or changes within The New Fuse project. Documenting plans **before** starting implementation is a required step as outlined in `docs/AI_DOCUMENTATION_GUIDE.md`.

**Purpose:**
- Ensure clarity and alignment on the scope and approach.
- Provide a reference point during implementation.
- Facilitate review and feedback before significant effort is invested.
- Maintain a record of intended changes separate from the historical `DEVELOPMENT_LOG.md`.

**Process:**
1. Define the goal or feature.
2. Outline the proposed implementation steps (the "plan").
3. Add the plan to this document under a relevant heading.
4. Obtain approval or consensus (if required by project workflow).
5. Once implementation begins, reference this plan in the `DEVELOPMENT_LOG.md` entry.
6. Update this plan if significant deviations occur during implementation.

---

## Current Plans

### Plan: MCP-Based Agent Self-Registration & Management (2025-05-01)

**Goal:** Enable agents (running as MCP servers) to autonomously register themselves with the system, update their profiles, and allow other agents/services to discover them via MCP, leveraging existing backend infrastructure where possible.

**Implementation Steps:**

1.  **Verify Backend & Environment:**
    *   Confirm `apps/api` (agent registration/repository modules) and the database are running correctly (likely via Docker Compose).
2.  **Explore Existing Services & Concepts:**
    *   Analyze `AgentCapabilityDiscoveryService`, `MCPMarketplace`, agent registration logic in `apps/api`, and the `Director Agent` concept to identify leverage points.
3.  **Design MCP Tools (Leveraging Existing):**
    *   Determine the best location for MCP tools (`registerAgent`, `updateAgentProfile`, `getAgentProfile`, `findAgentsByCapability`).
    *   Define tool schemas, integrating with existing backend APIs/services.
4.  **Implement MCP Tools:**
    *   Build the MCP server/tools as designed, bridging to backend services.
5.  **Develop Agent Self-Management Logic:**
    *   Define standard procedures/instructions for agents to use the new MCP tools for self-management (e.g., on startup). Document in `MCP-GUIDE.md`. (Done)
5.5. **Demonstrate Agent Self-Management Implementation (New Step):**
    *   Create a minimal example agent (or modify an existing simple one).
    *   Implement the MCP client logic within the agent to connect to `MCPRegistryServer`.
    *   Implement the startup sequence (connect, `registerAgent`, store ID, `updateAgentStatus`).
    *   Implement the shutdown sequence (`updateAgentStatus`, disconnect).
    *   This serves as a practical example and validation.
6.  **Implement External Entity Registration:**
    *   Assign responsibility (e.g., to `Director Agent`) for cataloging external entities (e.g., AI models, VS Code extensions) using the MCP tools.
7.  **Update Documentation:**
    *   Update `AGENT_MAP.md`, `NETWORK_MAP.md`, `MCP-GUIDE.md`, `AI_DOCUMENTATION_GUIDE.md`, and relevant READMEs.

**Related Requirement (Requires Separate Plan/Investigation):**
*   Integrate with existing Feature Suggestion and Kanban systems. Agents should be able to query tasks, update task status, and submit feature suggestions, likely via dedicated MCP tools that interact with these systems' APIs. The design and implementation of these tools are TBD.

*(Add new plans above this line)*
