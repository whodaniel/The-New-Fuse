# The New Fuse - Protocol Alignment & Skill Sequencing Framework

**Last Updated**: 2026-01-17 **Status**: Comprehensive Alignment **Purpose**:
Unified framework for presenting protocols, policies, and concepts as procedural
skill matrices

---

## Executive Summary

This document aligns all protocols, policies, and conceptual purposes into
prioritized, sequenced skill matrices for both AI and human users. It provides
the definitive guide for how information should be presented, consumed, and
actualized within The New Fuse ecosystem.

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Protocol Hierarchy](#protocol-hierarchy)
3. [Skill Prioritization Matrix](#skill-prioritization-matrix)
4. [Procedural Sequences](#procedural-sequences)
5. [User Journey Maps](#user-journey-maps)
6. [Implementation Roadmap](#implementation-roadmap)

---

## System Architecture Overview

### Core Components Stack

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                        │
│            (AI Agents & Human Developers)                │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              SKILL PRESENTATION LAYER                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Information  │  │  Procedural  │  │  Validation  │  │
│  │  Sequencing  │  │   Matrices   │  │   Feedback   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│           PROTOCOL ORCHESTRATION LAYER                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Master       │  │ Agent        │  │ Workflow     │  │
│  │ Orchestrator │  │ Communication│  │ Coordination │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              AGENT EXECUTION LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 115+         │  │  17+ Skills  │  │ Multi-Agent  │  │
│  │ Specialized  │  │  & Commands  │  │  Swarms      │  │
│  │ Agents       │  └──────────────┘  └──────────────┘  │
│  └──────────────┘                                        │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│            INFRASTRUCTURE LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ NestJS       │  │  PostgreSQL  │  │   Redis      │  │
│  │ Backend      │  │  Database    │  │   Caching    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Protocol Hierarchy

### Level 1: Meta-Protocols (Highest Priority)

These protocols govern HOW other protocols are used:

```yaml
1. Information Sequencing Protocol
   Priority: CRITICAL
   Purpose: Defines optimal order for presenting information
   Applies To: All sessions, all agents, all humans
   Location: docs/INFORMATION_SEQUENCING_PROTOCOL.md

   Key Concepts:
   - Phase 1: Orientation (ALWAYS FIRST)
   - Phase 2: Protocol Loading (Task-based)
   - Phase 3: Deep Context (Specific work)
   - Handoff Cycle (Session continuity)

2. Master Orchestrator Coordination Protocol
   Priority: CRITICAL
   Purpose: Coordinates multi-agent task delegation
   Applies To: Master Orchestrator, Jules, VS Code agents
   Location: docs/MASTER_ORCHESTRATOR_COORDINATION_PROTOCOLS.md

   Key Concepts:
   - Jules GitHub coordination
   - Agent delegation efficiency matrix
   - Bottleneck identification
   - Success metrics tracking

3. Agent Framework Protocols
   Priority: HIGH
   Purpose: Handoff procedures and session continuity
   Applies To: All AI agents working on TNF
   Location: docs/agents-and-protocols/AGENT_FRAMEWORK_PROTOCOLS.md

   Key Concepts:
   - Context preservation
   - Status verification
   - Priority assessment
   - Framework adherence
```

### Level 2: Communication Protocols (High Priority)

These protocols enable agent-to-agent interaction:

```yaml
1. Agent Communication Protocol
   Priority: HIGH
   Purpose: Standardized inter-agent messaging
   Applies To: All agents in the ecosystem
   Location: docs/agents-and-protocols/AGENT_COMMUNICATION_GUIDE.md

   Message Types:
   - System Messages (REGISTER, HEARTBEAT, STATUS)
   - Task Messages (REQUEST, RESPONSE, DELEGATE)
   - Coordination Messages (SWARM_JOIN, COORDINATION_REQUEST)
   - Data Messages (SHARE, REQUEST, SYNC)

   Protocols:
   - WebSocket (real-time bidirectional)
   - HTTP REST (request-response)
   - MCP (Model Context Protocol)

2. Relay Communication System
   Priority: HIGH
   Purpose: Cross-environment agent messaging
   Applies To: Browser agents, VS Code agents, Terminal agents
   Status: ACTIVE (ws://localhost:3001/ws)
   Location: packages/relay-core/src/standalone-relay.ts

   Features:
   - 6 agents connected
   - 2 channels active
   - Stall detection implemented
   - Self-prompting enabled
```

### Level 3: Architectural Patterns (Medium-High Priority)

These define HOW agents organize and collaborate:

```yaml
1. Orchestrator-Worker Pattern
   Use Case: Centralized task distribution
   Benefits: Clear coordination, efficient delegation
   Drawbacks: Single point of failure

2. Hierarchical Agent Pattern
   Use Case: Complex problem decomposition
   Benefits: Natural task breakdown, specialized roles
   Drawbacks: Potential bottlenecks at higher levels

3. Supervisor Model
   Use Case: Workflow control and decision-making
   Benefits: Explicit control, easy management
   Drawbacks: Single point of failure

4. Network Model
   Use Case: Peer-to-peer collaboration
   Benefits: High flexibility, resilient
   Drawbacks: Coordination complexity

5. Custom Multi-Agent Workflow
   Use Case: Tailored communication pathways
   Benefits: Optimized for specific needs
   Drawbacks: Requires careful design
```

### Level 4: Development Protocols (Medium Priority)

These guide implementation and code quality:

```yaml
1. NestJS Conventions - All backend code follows NestJS patterns - Module-based
architecture - Dependency injection

2. TypeScript Strict Mode - All code must be type-safe - No implicit any -
Proper interface definitions

3. Monorepo Structure - pnpm workspaces - Turbo for build orchestration -
Package interdependencies

4. Testing Requirements - Tests for all new features - E2E tests must pass -
Type checking before commit

5. Security Best Practices - No secrets in code - Environment variables for
config - Input validation - Database query sanitization
```

---

## Skill Prioritization Matrix

### Priority Levels Defined

```
P0 (BLOCKING): Must be completed before ANY work
P1 (CRITICAL): Required for most tasks
P2 (HIGH): Beneficial for complex tasks
P3 (MEDIUM): Helpful for specific scenarios
P4 (LOW): Nice-to-have, optional
```

### Skills Matrix - Organized by User Type

#### For AI Agents (New Session Startup)

| Priority | Skill                         | Time     | Purpose                | Location                                                 |
| -------- | ----------------------------- | -------- | ---------------------- | -------------------------------------------------------- |
| P0       | Read Handoff Notes            | 2 min    | Session continuity     | `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`     |
| P0       | Load Information Sequencing   | 5 min    | Understand methodology | `docs/INFORMATION_SEQUENCING_PROTOCOL.md`                |
| P0       | Review System Architecture    | 5 min    | Mental model           | See orientation phase                                    |
| P1       | Load Agent Communication      | 10 min   | Inter-agent messaging  | `docs/agents-and-protocols/AGENT_COMMUNICATION_GUIDE.md` |
| P1       | Master Orchestrator Protocol  | 8 min    | Task delegation        | `docs/MASTER_ORCHESTRATOR_COORDINATION_PROTOCOLS.md`     |
| P2       | Load Agent Framework          | 8 min    | Handoff procedures     | `docs/agents-and-protocols/AGENT_FRAMEWORK_PROTOCOLS.md` |
| P2       | Review Architectural Patterns | 15 min   | Design patterns        | `docs/concepts/COMPLETE-CONCEPTS-GUIDE.md`               |
| P3       | Load Specific Protocols       | Variable | Task-dependent         | See protocol hierarchy                                   |

**Total Time for Standard Session Start**: ~30-45 minutes

#### For Human Developers (Onboarding)

| Priority | Skill                  | Time   | Purpose              | Path                                          |
| -------- | ---------------------- | ------ | -------------------- | --------------------------------------------- |
| P0       | Read README            | 10 min | Project overview     | Path 1: New Developer Onboarding              |
| P0       | Quick Start Guide      | 20 min | Environment setup    | `QUICK_START_GUIDE.md`                        |
| P0       | Architecture Standards | 15 min | System design        | `docs/architecture/ARCHITECTURE_STANDARDS.md` |
| P1       | Development Guide      | 20 min | Dev workflow         | `docs/development/GETTING_STARTED.md`         |
| P1       | Build Guide            | 15 min | Build system         | `docs/development/BUILD_GUIDE.md`             |
| P2       | Testing Setup          | 20 min | Quality assurance    | `docs/testing/TESTING_SETUP_COMPLETE.md`      |
| P2       | Agent System Overview  | 30 min | Multi-agent concepts | `docs/agents/COMPLETE-AGENT-GUIDE.md`         |
| P3       | Workflow System        | 20 min | Workflow design      | `docs/workflows/WORKFLOW_QUICKSTART.md`       |

**Total Time for Standard Onboarding**: ~2-3 hours core, 1 day full

#### For Specific Task Types

**Development Tasks:**

```yaml
Required Skills:
  1. PRD Review (if exists) 2. Source File Reading 3. Test File Reading 4.
  Integration Point Analysis

Protocol Sequence:
  1. Read PRD or create one 2. Review handoff notes 3. Load source files (use
  outlines first) 4. Read related tests 5. Implement with TodoWrite tracking 6.
  Update handoff notes
```

**Debugging Tasks:**

```yaml
Required Skills:
  1. Error Log Analysis 2. Source Code Reading 3. Test Execution 4. Stack Trace
  Analysis

Protocol Sequence:
  1. Review error logs/output 2. Identify affected source files 3. Review test
  files 4. Apply fixes 5. Verify with tests 6. Document learnings in handoff
```

**Self-Improvement Tasks:**

```yaml
Required Skills:
  1. Self-Improve Slash Command 2. Swarm Orchestration 3. Metrics Analysis 4.
  Director Service

Protocol Sequence:
  1. Run /self-improve with scope 2. Analyze identified improvements 3.
  Prioritize by impact 4. Implement top improvements 5. Measure results 6.
  Document insights
```

---

## Procedural Sequences

### Master Sequence Template

Every task should follow this meta-sequence:

```
┌─────────────────────────────────────────────────┐
│           STEP 1: ORIENTATION                   │
│  ◆ Read handoff notes                           │
│  ◆ Load information sequencing protocol         │
│  ◆ Understand current system state              │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│      STEP 2: PROTOCOL LOADING                   │
│  ◆ Identify task type                           │
│  ◆ Load appropriate protocols                   │
│  ◆ Review architectural patterns                │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│       STEP 3: CONTEXT GATHERING                 │
│  ◆ Read source files (outlines first)           │
│  ◆ Review tests                                 │
│  ◆ Analyze integration points                   │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│         STEP 4: PLANNING                        │
│  ◆ Create/review PRD                            │
│  ◆ Break into subtasks                          │
│  ◆ Use TodoWrite for tracking                   │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│        STEP 5: EXECUTION                        │
│  ◆ Implement with quality standards             │
│  ◆ Update TodoWrite progress                    │
│  ◆ Run tests continuously                       │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│        STEP 6: VERIFICATION                     │
│  ◆ Full test suite                              │
│  ◆ Type checking                                │
│  ◆ Build validation                             │
│  ◆ Assumption Challenge Protocol                │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│         STEP 7: HANDOFF                         │
│  ◆ Summarize accomplishments                    │
│  ◆ Document learnings                           │
│  ◆ List remaining work                          │
│  ◆ Update docs/protocols/reports/SESSION_HANDOFF_LATEST.json │
└─────────────────────────────────────────────────┘
```

### Specialized Sequences

#### Sequence A: Agent Development

```yaml
1. Review Agent Communication Guide (10 min)
2. Study existing agent examples (15 min)
3. Define agent capabilities (20 min)
4. Implement agent class (60 min)
5. Register with agent registry (15 min)
6. Test communication protocols (30 min)
7. Document in .agent/ directory (20 min)

Total: ~2.5 hours
Success Criteria:
  - Agent registers successfully
  - Can send/receive messages
  - Documented capabilities
  - Integration tests pass
```

#### Sequence B: Workflow Creation

```yaml
1. Review Workflow Architecture (15 min)
2. Identify workflow triggers (20 min)
3. Define workflow steps (30 min)
4. Design data flow (25 min)
5. Implement workflow nodes (90 min)
6. Test execution paths (45 min)
7. Add error handling (30 min)
8. Document workflow (20 min)

Total: ~4.5 hours
Success Criteria:
  - Workflow executes successfully
  - Error handling works
  - Documentation complete
  - Integration tests pass
```

#### Sequence C: Protocol Implementation

```yaml
1. Study protocol specification (20 min)
2. Review related protocols (30 min)
3. Design implementation (40 min)
4. Implement protocol layer (120 min)
5. Add validation (30 min)
6. Write tests (60 min)
7. Update documentation (30 min)
8. Integration testing (45 min)

Total: ~6 hours
Success Criteria:
  - Protocol spec followed
  - All tests pass
  - Documentation updated
  - Integration verified
```

---

## User Journey Maps

### Journey 1: New AI Agent First Session

```
START
  │
  ├─→ [P0] Read docs/protocols/reports/SESSION_HANDOFF_LATEST.json
  │         ↓
  │    Understand: What was accomplished last session?
  │         ↓
  ├─→ [P0] Read docs/INFORMATION_SEQUENCING_PROTOCOL.md
  │         ↓
  │    Understand: How to approach this session?
  │         ↓
  ├─→ [P1] Review current system status
  │         ↓
  │    Check: Build status, services, blocking issues
  │         ↓
  ├─→ [P1] Load Agent Communication Guide
  │         ↓
  │    Learn: How to message other agents
  │         ↓
  ├─→ [P2] Identify task type (development/debugging/etc)
  │         ↓
  │    Load: Appropriate task-specific protocols
  │         ↓
  ├─→ [EXECUTE] Perform work following master sequence
  │         ↓
  │    Track: Progress with TodoWrite
  │         ↓
  └─→ [HANDOFF] Update docs/protocols/reports/SESSION_HANDOFF_LATEST.json
            ↓
         COMPLETE
```

**Estimated Time to Productive Work**: 30-45 minutes

### Journey 2: Human Developer First Day

```
START (Day 1)
  │
  ├─→ [P0] Read README.md (10 min)
  │         ↓
  │    Understand: What is The New Fuse?
  │         ↓
  ├─→ [P0] Follow QUICK_START_GUIDE.md (30 min)
  │         ↓
  │    Setup: Environment, dependencies, services
  │         ↓
  ├─→ [P0] Read ARCHITECTURE_STANDARDS.md (20 min)
  │         ↓
  │    Learn: System design principles
  │         ↓
  ├─→ [P1] Run build and tests (15 min)
  │         ↓
  │    Verify: Everything works
  │         ↓
  ├─→ [P1] Explore codebase (60 min)
  │         ↓
  │    Navigate: Key packages and modules
  │         ↓
  ├─→ [P2] Read Agent System Overview (30 min)
  │         ↓
  │    Understand: Multi-agent architecture
  │         ↓
  ├─→ [P2] Try a simple task (90 min)
  │         ↓
  │    Practice: Make a small change
  │         ↓
  └─→ [REVIEW] With team member (30 min)
            ↓
         END DAY 1 (Total: ~4.5 hours productive)
```

### Journey 3: Multi-Agent Orchestration Task

```
START (Master Orchestrator receives task)
  │
  ├─→ Analyze task complexity
  │         ↓
  │    Determine: Single agent or multi-agent?
  │         ↓
  ├─→ Check agent registry for capabilities
  │         ↓
  │    Find: Agents with required skills
  │         ↓
  ├─→ [IF MULTI-AGENT] Select orchestration pattern
  │         ↓
  │    Choose: Hierarchical, Swarm, or Custom
  │         ↓
  ├─→ Create task delegation plan
  │         ↓
  │    Define: Agent assignments, dependencies
  │         ↓
  ├─→ [CRITICAL] Apply Jules coordination protocol
  │         ↓
  │    If Jules: Check git, create branch strategy
  │         ↓
  ├─→ Dispatch tasks via relay system
  │         ↓
  │    Send: Messages through ws://localhost:3001/ws
  │         ↓
  ├─→ Monitor progress
  │         ↓
  │    Track: Agent responses, completion status
  │         ↓
  ├─→ Handle errors and stalls
  │         ↓
  │    Recover: Using stall detection, retry logic
  │         ↓
  ├─→ Aggregate results
  │         ↓
  │    Synthesize: Outputs from multiple agents
  │         ↓
  └─→ Document in coordination log
            ↓
         COMPLETE
```

---

## Implementation Roadmap

### Phase 1: Foundation (COMPLETED ✓)

- [x] Agent Communication Protocol defined
- [x] Relay system operational (ws://localhost:3001/ws)
- [x] 115+ agents documented
- [x] 17+ slash commands/skills loaded
- [x] Stall detection implemented
- [x] Self-prompting enabled

### Phase 2: Orchestration (CURRENT)

- [x] Task protocol defined
- [x] State machine implemented
- [x] Subscription registry created
- [ ] **End-to-end orchestration test** (10+ minute conversation)
- [ ] **Task dispatch logic fully tested**
- [ ] **Performance metrics collected**

### Phase 3: Skill Presentation Layer (NEXT)

```yaml
Priority: HIGH
Timeline: 1-2 weeks
Goal: Make protocols discoverable and consumable

Tasks: 1. Create skill discovery interface - Search by task type - Filter by
  priority - View dependencies

  2. Build procedural matrix UI - Visual workflow representation - Progress
  tracking - Time estimates

  3. Implement adaptive learning - Track skill completion times - Identify
  bottlenecks - Suggest optimizations

  4. Generate personalized sequences - Based on user history - Optimized for
  user's role - Context-aware recommendations
```

### Phase 4: Advanced Features (FUTURE)

```yaml
Priority: MEDIUM
Timeline: 1-2 months
Goal: Intelligent system that learns and adapts

Features: 1. Auto-generated skill sequences - AI analyzes task - Recommends
  optimal path - Adapts based on feedback

  2. Cross-protocol optimization - Identify redundancies - Merge related
  protocols - Simplify complexity

  3. Multi-modal skill delivery - Interactive tutorials - Video walkthroughs -
  Hands-on exercises

  4. Continuous improvement loop - Collect usage metrics - Identify pain points
  - Auto-update protocols
```

---

## Quick Reference Tables

### Task Type → Protocol Loading Map

| Task Type               | Priority Protocols                              | Secondary Protocols                | Time   |
| ----------------------- | ----------------------------------------------- | ---------------------------------- | ------ |
| New Feature Development | Information Sequencing, Agent Framework         | Workflow Architecture, Testing     | 45 min |
| Bug Fixing              | Error Handling, Testing                         | Source Code Reading, Git History   | 20 min |
| Agent Development       | Agent Communication, Registry                   | Swarm Orchestration, MCP           | 30 min |
| Workflow Creation       | Workflow Architecture, Data Flow                | Agent Coordination, Error Handling | 40 min |
| Documentation           | Information Sequencing, Documentation Standards | API Reference, Examples            | 15 min |
| Deployment              | Deployment Guide, CloudRuntime, Docker               | Monitoring, Security               | 30 min |
| Testing                 | Testing Setup, Best Practices                   | Performance Testing, E2E           | 25 min |
| Self-Improvement        | Self-Improve Command, Swarm                     | Metrics Analysis, Learning         | 35 min |

### Priority Abbreviations

| Code | Level    | When to Use                    |
| ---- | -------- | ------------------------------ |
| P0   | BLOCKING | Must complete before ANY work  |
| P1   | CRITICAL | Required for most tasks        |
| P2   | HIGH     | Beneficial for complex tasks   |
| P3   | MEDIUM   | Helpful for specific scenarios |
| P4   | LOW      | Nice-to-have, optional         |

---

## Success Metrics

### For AI Agents

```yaml
Efficiency:
  - Time to productive work: <30 minutes
  - Context loading completeness: >95
  - Protocol adherence rate: >90
  - Session handoff quality: >85

Quality:
  - Code quality consistency: >90
  - Test pass rate: >95
  - Build success rate: >90
  - Documentation completeness: >80

Collaboration:
  - Multi-agent task success: >85
  - Communication protocol compliance: >95
  - Coordination overhead: <15%
  - Conflict resolution time: <5 minutes
```

### For Human Developers

```yaml
Onboarding:
  - Time to first commit: <1 day
  - Environment setup success: >95%
  - Documentation clarity rating: >4/5
  - Confidence level after week 1: >3.5/5

Productivity:
  - Tasks completed per week: >5
  - Code review approval rate: >80%
  - Build break frequency: <5%
  - Test coverage: >70%

Growth:
  - Architecture understanding: Progressive
  - Protocol fluency: Increasing
  - Agent development capability: Growing
  - System contribution: Meaningful
```

---

## Appendix: Protocol Cross-Reference

### Primary Protocol Locations

```
Meta-Protocols:
  - docs/INFORMATION_SEQUENCING_PROTOCOL.md
  - docs/MASTER_ORCHESTRATOR_COORDINATION_PROTOCOLS.md
  - docs/agents-and-protocols/AGENT_FRAMEWORK_PROTOCOLS.md

Communication:
  - docs/agents-and-protocols/AGENT_COMMUNICATION_GUIDE.md
  - docs/AGENT_COMMUNICATION_PROTOCOL.md (redirects to guide)
  - packages/relay-core/src/standalone-relay.ts

Architecture:
  - docs/concepts/COMPLETE-CONCEPTS-GUIDE.md
  - docs/architecture/ARCHITECTURE_STANDARDS.md
  - docs/architecture/MONOREPO_ARCHITECTURE.md

Development:
  - CLAUDE.md (project rules)
  - docs/development/BUILD_GUIDE.md
  - docs/development/GETTING_STARTED.md

Testing:
  - docs/testing/TESTING_SETUP_COMPLETE.md
  - docs/testing/BEST_PRACTICES.md
  - docs/testing/E2E_TEST_SUMMARY.md

Deployment:
  - docs/guides/deployment-guide.md
  - docs/deployment/CLOUD_RUNTIME_DEPLOYMENT_GUIDE.md
  - docs/DOCKER.md
```

---

**This framework is living documentation. It should be updated as new protocols
are added, patterns emerge, and the system evolves.**
