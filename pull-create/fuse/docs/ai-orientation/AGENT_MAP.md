# The New Fuse Agent Map

## Overview

This document provides a high-level visualization and description of the different types of AI agents within The New Fuse ecosystem, their core capabilities, and their primary relationships.

**Purpose:**
- Understand the different roles and specializations of agents.
- Visualize how agents might interact or collaborate.
- Identify available capabilities within the agent network.
- Assist in planning agent development and integration.

**Maintenance:**
This map should be updated whenever significant changes are made to:
- Agent registration or discovery mechanisms.
- Core capabilities provided by standard agent types.
- Introduction or removal of major agent types or roles.
- Significant changes in how agents interact (e.g., direct communication vs. broker-mediated).

*(Update this document according to the guidelines in `docs/AI_DOCUMENTATION_GUIDE.md`)*

---

## Agent Categories / Types

*(Use subsections for different categories or specific types of agents)*

### Core System Agents

**Description:** Agents fundamental to the operation of The New Fuse framework.

```mermaid
graph LR
    subgraph Core System
        Broker(MCP Broker)
        Director(Director Agent)
        Marketplace(MCP Marketplace)
    end

    Broker -- Manages --> Director;
    Broker -- Manages --> Marketplace;
    Director -- Coordinates --> AgentX(General Agent); %% Example Interaction
    Marketplace -- Provides Info --> AgentY(General Agent); %% Example Interaction

```
**Components:**
- **MCP Broker:** Central communication hub.
- **Director Agent:** Task coordination and lifecycle management.
- **MCP Marketplace:** Agent/Tool discovery service.

*(Add more details as needed)*

### Capability-Specific Agents

**Description:** Agents designed to provide specific, focused capabilities (e.g., file system access, code execution, database interaction).

*(Add subsections for specific agents like FileSystemAgent, CodeExecutionAgent, etc., potentially with diagrams showing their primary interactions or dependencies)*

#### Filesystem Agent
**Capabilities:** Read, write, list files/directories.
**Primary Interaction:** Via MCP Broker, often invoked by Director or other agents.

#### Code Execution Agent
**Capabilities:** Execute code snippets in various languages within sandboxed environments.
**Primary Interaction:** Via MCP Broker.

*(Add more agent types)*

### Application-Specific Agents

**Description:** Agents tailored for specific applications or workflows built on The New Fuse.

*(Add subsections for application-specific agents)*

---

## Key Agent Relationships & Interactions

- **Discovery:** Agents typically register with the `MCP Broker` and/or `MCP Marketplace`. Other agents query the `Marketplace` to find needed capabilities.
- **Task Execution:** The `Director Agent` often receives high-level tasks, breaks them down, and coordinates execution by invoking tools on specific capability agents via the `MCP Broker`.
- **Direct vs. Brokered:** Define whether certain agent types are expected to communicate directly or always through the broker.

*(Add more details on standard interaction patterns)*
