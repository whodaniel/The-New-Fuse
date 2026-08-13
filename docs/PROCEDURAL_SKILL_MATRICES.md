# The New Fuse - Procedural Skill Matrices

**Last Updated**: 2026-01-17 **Purpose**: Interactive, actionable skill
sequences for all user types **Companion To**:
[Protocol Alignment Framework](./PROTOCOL_ALIGNMENT_FRAMEWORK.md)

---

## How to Use This Document

This document contains **procedural matrices** - step-by-step checklists that
guide you through complex tasks. Each matrix is:

- **Priority-ordered**: Most critical steps first
- **Time-estimated**: Know how long each step takes
- **Dependency-aware**: Steps build on previous completion
- **Outcome-focused**: Clear success criteria
- **Role-specific**: Tailored for your user type

---

## Table of Contents

1. [AI Agent Skill Matrices](#ai-agent-skill-matrices)
2. [Human Developer Skill Matrices](#human-developer-skill-matrices)
3. [Task-Specific Skill Matrices](#task-specific-skill-matrices)
4. [Advanced Orchestration Matrices](#advanced-orchestration-matrices)

---

## AI Agent Skill Matrices

### Matrix 1: New Session Initialization

**Purpose**: Start a new session with full context **Time**: 30-45 minutes
**Priority**: P0 (BLOCKING)

#### Checklist

```
Phase 1: Context Recovery (10 minutes)
─────────────────────────────────────────
[ ] Step 1.1: Read docs/protocols/reports/SESSION_HANDOFF_LATEST.json
    ├─ Location: /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/docs/protocols/reports/SESSION_HANDOFF_LATEST.json
    ├─ Purpose: Understand what was done in last session
    ├─ Extract: Accomplishments, blockers, next steps
    └─ Time: 2 minutes

[ ] Step 1.2: Check git status
    ├─ Command: git status && git log --oneline -5
    ├─ Purpose: Verify current code state
    ├─ Note: Look for uncommitted changes
    └─ Time: 1 minute

[ ] Step 1.3: Review TODO_CHECKLIST.md (if exists)
    ├─ Location: Root directory or .agent/
    ├─ Purpose: See outstanding tasks
    └─ Time: 2 minutes

[ ] Step 1.4: Check service health
    ├─ Relay: curl http://localhost:3001/health
    ├─ Backend: Check if services are running
    ├─ Purpose: Verify infrastructure
    └─ Time: 2 minutes

[ ] Step 1.5: Review recent commits
    ├─ Command: git log --oneline -10
    ├─ Purpose: Understand recent changes
    └─ Time: 3 minutes

Phase 2: Protocol Loading (15 minutes)
─────────────────────────────────────────
[ ] Step 2.1: Read Information Sequencing Protocol
    ├─ Location: docs/INFORMATION_SEQUENCING_PROTOCOL.md
    ├─ Purpose: Learn optimal information flow
    ├─ Key Sections: Master Sequence, Handoff Cycle
    └─ Time: 5 minutes

[ ] Step 2.2: Read Agent Framework Protocols
    ├─ Location: docs/agents-and-protocols/AGENT_FRAMEWORK_PROTOCOLS.md
    ├─ Purpose: Understand handoff procedures
    ├─ Key Sections: Handoff checklist, startup checklist
    └─ Time: 5 minutes

[ ] Step 2.3: Review current task type
    ├─ From: docs/protocols/reports/SESSION_HANDOFF_LATEST.json or user request
    ├─ Options: Development, Debugging, Documentation, etc.
    ├─ Purpose: Load appropriate protocols
    └─ Time: 2 minutes

[ ] Step 2.4: Load task-specific protocols
    ├─ For Development: PRD, source files, tests
    ├─ For Debugging: error logs, stack traces
    ├─ For Self-Improvement: /self-improve docs
    └─ Time: 3 minutes

Phase 3: System Understanding (10-15 minutes)
─────────────────────────────────────────
[ ] Step 3.1: Read Protocol Alignment Framework
    ├─ Location: docs/PROTOCOL_ALIGNMENT_FRAMEWORK.md
    ├─ Purpose: Understand overall system structure
    ├─ Key Sections: Protocol hierarchy, skill matrix
    └─ Time: 10 minutes (first time), 3 minutes (refresh)

[ ] Step 3.2: Review architectural patterns
    ├─ Location: docs/concepts/COMPLETE-CONCEPTS-GUIDE.md
    ├─ Purpose: Understand design patterns in use
    ├─ Sections: Based on task (agent systems, workflows, etc.)
    └─ Time: 5-10 minutes (selective reading)

[ ] Step 3.3: Identify dependencies
    ├─ Question: What code/systems will I interact with?
    ├─ Action: Note key packages and modules
    └─ Time: 2 minutes

Phase 4: Readiness Verification (5 minutes)
─────────────────────────────────────────
[ ] Step 4.1: Self-assessment
    ├─ Question: Do I understand the goal?
    ├─ Question: Do I know the approach?
    ├─ Question: Do I have all context needed?
    └─ Time: 2 minutes

[ ] Step 4.2: Create TodoWrite plan
    ├─ Break down task into subtasks
    ├─ Estimate complexity
    ├─ Identify potential blockers
    └─ Time: 3 minutes

[ ] Step 4.3: Ready to proceed
    └─ If yes: Begin work
    └─ If no: Ask clarifying questions
```

**Success Criteria**:

- ✓ Full understanding of session context
- ✓ All protocols loaded
- ✓ Task plan created
- ✓ No blocking questions

---

### Matrix 2: Session Completion and Handoff

**Purpose**: End session with proper knowledge transfer **Time**: 15-20 minutes
**Priority**: P0 (BLOCKING)

#### Checklist

```
Phase 1: Work Review (5 minutes)
─────────────────────────────────────────
[ ] Step 1.1: Summarize accomplishments
    ├─ What was completed?
    ├─ What tests were run?
    ├─ What files were modified?
    └─ Time: 3 minutes

[ ] Step 1.2: Identify learnings
    ├─ What did you discover about the codebase?
    ├─ What patterns did you observe?
    ├─ What surprised you?
    └─ Time: 2 minutes

Phase 2: Status Documentation (5-10 minutes)
─────────────────────────────────────────
[ ] Step 2.1: Update docs/protocols/reports/SESSION_HANDOFF_LATEST.json
    ├─ Location: docs/protocols/reports/SESSION_HANDOFF_LATEST.json
    ├─ Format: Use handoff template
    ├─ Include: Accomplishments, learnings, next steps
    └─ Time: 5 minutes

[ ] Step 2.2: Update TodoWrite if needed
    ├─ Mark completed tasks
    ├─ Add new discovered tasks
    ├─ Update estimates
    └─ Time: 2 minutes

[ ] Step 2.3: Document blockers
    ├─ What is preventing progress?
    ├─ What decisions are needed?
    ├─ What external dependencies exist?
    └─ Time: 2 minutes

Phase 3: Code Quality (5 minutes)
─────────────────────────────────────────
[ ] Step 3.1: Commit changes (if applicable)
    ├─ git add <files>
    ├─ git commit with meaningful message
    ├─ Include "Co-Authored-By: Claude Sonnet 4.5"
    └─ Time: 3 minutes

[ ] Step 3.2: Run final checks
    ├─ pnpm run type-check (if code changes)
    ├─ pnpm run lint (if code changes)
    ├─ Verify builds still work
    └─ Time: 2 minutes

Phase 4: Handoff Preparation (5 minutes)
─────────────────────────────────────────
[ ] Step 4.1: Recommend next steps
    ├─ What should the next agent do?
    ├─ What is the priority?
    ├─ What context will they need?
    └─ Time: 3 minutes

[ ] Step 4.2: Prepare context files
    ├─ Ensure docs/protocols/reports/SESSION_HANDOFF_LATEST.json is complete
    ├─ Update PRD if task ongoing
    ├─ Create TODO_CHECKLIST.md if needed
    └─ Time: 2 minutes
```

**Success Criteria**:

- ✓ All work documented
- ✓ Learnings captured
- ✓ Next steps clear
- ✓ Code committed (if applicable)
- ✓ Handoff notes updated

---

### Matrix 3: Multi-Agent Task Orchestration

**Purpose**: Coordinate multiple agents on a complex task **Time**: Variable
(depends on task) **Priority**: P1 (CRITICAL for multi-agent work)

#### Checklist

```
Phase 1: Task Analysis (10 minutes)
─────────────────────────────────────────
[ ] Step 1.1: Decompose the task
    ├─ Break into independent subtasks
    ├─ Identify dependencies between subtasks
    ├─ Estimate complexity of each
    └─ Time: 5 minutes

[ ] Step 1.2: Determine orchestration pattern
    ├─ Options: Orchestrator-Worker, Hierarchical, Swarm, Custom
    ├─ Consider: Task complexity, agent capabilities
    ├─ Refer to: docs/concepts/COMPLETE-CONCEPTS-GUIDE.md
    └─ Time: 3 minutes

[ ] Step 1.3: Check agent availability
    ├─ Command: curl http://localhost:3001/agents
    ├─ Purpose: See which agents are online
    ├─ Note: Capabilities of each agent
    └─ Time: 2 minutes

Phase 2: Agent Selection (10 minutes)
─────────────────────────────────────────
[ ] Step 2.1: Review Master Orchestrator Protocol
    ├─ Location: docs/MASTER_ORCHESTRATOR_COORDINATION_PROTOCOLS.md
    ├─ Focus: Agent delegation efficiency matrix
    └─ Time: 5 minutes

[ ] Step 2.2: Match agents to subtasks
    ├─ Consider: Agent capabilities, availability, load
    ├─ For Jules: CRITICAL - Follow Jules coordination protocol
    ├─ For VS Code agents: Check local file access
    └─ Time: 3 minutes

[ ] Step 2.3: Create delegation plan
    ├─ Document: Which agent does what
    ├─ Document: Dependencies and order
    ├─ Document: Expected completion time
    └─ Time: 2 minutes

Phase 3: Coordination Setup (15 minutes)
─────────────────────────────────────────
[ ] Step 3.1: If using Jules - Git coordination
    ├─ Command: git status && git log --oneline -10
    ├─ Action: Document current HEAD
    ├─ Action: Create branch strategy (jules/feature-name)
    ├─ Update: .coordination-log file
    └─ Time: 5 minutes

[ ] Step 3.2: Setup communication channels
    ├─ Relay: ws://localhost:3001/ws
    ├─ Create channel if needed
    ├─ Ensure agents can join
    └─ Time: 3 minutes

[ ] Step 3.3: Define success criteria
    ├─ For each subtask: What does done look like?
    ├─ For overall task: How to integrate results?
    └─ Time: 3 minutes

[ ] Step 3.4: Setup monitoring
    ├─ How will you track progress?
    ├─ What metrics matter?
    ├─ When to intervene?
    └─ Time: 2 minutes

[ ] Step 3.5: Review Agent Communication Protocol
    ├─ Location: docs/agents-and-protocols/AGENT_COMMUNICATION_GUIDE.md
    ├─ Focus: Message types, protocols
    └─ Time: 2 minutes

Phase 4: Task Dispatch (Variable)
─────────────────────────────────────────
[ ] Step 4.1: Send initial tasks
    ├─ Via: Relay system or direct tool calls
    ├─ Include: Clear instructions, context, success criteria
    ├─ Format: Follow message protocol
    └─ Time: 5-15 minutes depending on complexity

[ ] Step 4.2: Monitor execution
    ├─ Check: Agent responses
    ├─ Watch: For stalls or errors
    ├─ Intervene: When needed
    └─ Time: Continuous during execution

[ ] Step 4.3: Handle errors
    ├─ Use: Stall detection system
    ├─ Apply: Retry logic
    ├─ Escalate: If agent fails repeatedly
    └─ Time: As needed

Phase 5: Result Aggregation (10-20 minutes)
─────────────────────────────────────────
[ ] Step 5.1: Collect agent outputs
    ├─ From: Each agent's response
    ├─ Validate: Against success criteria
    └─ Time: 5 minutes

[ ] Step 5.2: Synthesize results
    ├─ Combine: Agent outputs into coherent whole
    ├─ Resolve: Any conflicts or inconsistencies
    └─ Time: 5-10 minutes

[ ] Step 5.3: If using Jules - Fetch changes
    ├─ Command: git fetch --all
    ├─ Command: git branch -r | grep jules
    ├─ Review: Jules commits
    ├─ Update: .coordination-log
    └─ Time: 5 minutes

[ ] Step 5.4: Document coordination
    ├─ What worked well?
    ├─ What bottlenecks occurred?
    ├─ How to improve next time?
    └─ Time: 5 minutes
```

**Success Criteria**:

- ✓ All subtasks completed
- ✓ Results integrated successfully
- ✓ No agent conflicts
- ✓ Coordination documented
- ✓ Git state clean (if Jules used)

---

## Human Developer Skill Matrices

### Matrix 4: New Developer Onboarding - Day 1

**Purpose**: Get productive on first day **Time**: 4-5 hours **Priority**: P0
(BLOCKING)

#### Checklist

```
Morning Session (2 hours)
─────────────────────────────────────────
[ ] Step 1.1: Read README.md
    ├─ Location: Root directory
    ├─ Understand: What is The New Fuse?
    ├─ Note: Key features and architecture
    └─ Time: 10 minutes

[ ] Step 1.2: Environment setup
    ├─ Verify Node.js: node --version (need 22.16.0+)
    ├─ Verify Bun: bun --version (need 1.1.38+)
    ├─ Install pnpm: npm install -g pnpm
    ├─ Clone repo (if not done)
    └─ Time: 15 minutes

[ ] Step 1.3: Follow QUICK_START_GUIDE.md
    ├─ Location: Root directory
    ├─ Run: pnpm install
    ├─ Setup: Environment variables (.env files)
    ├─ Start: Docker services (pnpm run docker:start)
    └─ Time: 30 minutes

[ ] Step 1.4: Verify setup
    ├─ Run: pnpm run build
    ├─ Run: pnpm run test
    ├─ Start: pnpm run dev
    ├─ Check: All services start successfully
    └─ Time: 20 minutes

[ ] Step 1.5: Read ARCHITECTURE_STANDARDS.md
    ├─ Location: docs/architecture/
    ├─ Understand: Monorepo structure
    ├─ Understand: Key architectural decisions
    └─ Time: 20 minutes

[ ] Step 1.6: Read CLAUDE.md
    ├─ Location: Root directory
    ├─ Understand: Project rules and conventions
    ├─ Note: NestJS patterns, TypeScript requirements
    └─ Time: 10 minutes

[ ] BREAK: 15 minutes

Afternoon Session (2-3 hours)
─────────────────────────────────────────
[ ] Step 2.1: Explore codebase structure
    ├─ Navigate: apps/ directory
    ├─ Navigate: packages/ directory
    ├─ Identify: Main applications and shared packages
    └─ Time: 30 minutes

[ ] Step 2.2: Read Protocol Alignment Framework
    ├─ Location: docs/PROTOCOL_ALIGNMENT_FRAMEWORK.md
    ├─ Understand: How protocols are organized
    ├─ Understand: Skill matrices concept
    └─ Time: 15 minutes

[ ] Step 2.3: Read Agent System Overview
    ├─ Location: docs/agents/COMPLETE-AGENT-GUIDE.md
    ├─ Understand: Multi-agent architecture
    ├─ Skim: Available agent types
    └─ Time: 30 minutes

[ ] Step 2.4: Try a simple task
    ├─ Goal: Make a trivial change
    ├─ Example: Add a console.log, update a comment
    ├─ Process: Make change, test, commit
    ├─ Learn: Git workflow, commit conventions
    └─ Time: 45 minutes

[ ] Step 2.5: Review with team
    ├─ Share: What you learned
    ├─ Ask: Questions about architecture
    ├─ Discuss: Next learning goals
    └─ Time: 30 minutes

End of Day Review (15 minutes)
─────────────────────────────────────────
[ ] Step 3.1: Reflect
    ├─ What went well?
    ├─ What was confusing?
    ├─ What questions remain?
    └─ Time: 5 minutes

[ ] Step 3.2: Plan tomorrow
    ├─ Pick a small feature or bug
    ├─ Identify relevant documentation
    ├─ Set learning goals
    └─ Time: 10 minutes
```

**Success Criteria**:

- ✓ Environment working
- ✓ Build and tests pass
- ✓ Basic architecture understood
- ✓ First commit made
- ✓ Knows where to find help

---

## Task-Specific Skill Matrices

### Matrix 5: Feature Development (Full Cycle)

**Purpose**: Implement a new feature from PRD to deployment **Time**: Variable
(hours to days) **Priority**: P1 (CRITICAL)

#### Checklist

```
Phase 1: Planning (30-60 minutes)
─────────────────────────────────────────
[ ] Step 1.1: Read/Create PRD
    ├─ Location: .agent/artifacts/prd-[feature-name].md
    ├─ If exists: Read thoroughly
    ├─ If not: Create using template
    ├─ Template: docs/INFORMATION_SEQUENCING_PROTOCOL.md
    └─ Time: 20-40 minutes

[ ] Step 1.2: Understand requirements
    ├─ Goals: What should this feature accomplish?
    ├─ Non-goals: What is explicitly out of scope?
    ├─ Success criteria: How to measure success?
    └─ Time: 10 minutes

[ ] Step 1.3: Review existing code
    ├─ Identify: Similar features
    ├─ Identify: Integration points
    ├─ Read: Relevant source files (use outlines)
    └─ Time: 15-30 minutes

[ ] Step 1.4: Create implementation plan
    ├─ Break into: Subtasks
    ├─ Identify: Dependencies
    ├─ Estimate: Time for each
    ├─ Use: TodoWrite tool
    └─ Time: 15 minutes

Phase 2: Implementation (Variable)
─────────────────────────────────────────
[ ] Step 2.1: Setup feature branch
    ├─ git checkout -b feature/[name]
    ├─ Ensure: Clean starting point
    └─ Time: 2 minutes

[ ] Step 2.2: Implement core logic
    ├─ Follow: NestJS conventions
    ├─ Use: TypeScript strict mode
    ├─ Write: Type definitions
    ├─ Add: Proper error handling
    └─ Time: Variable (1-4 hours typical)

[ ] Step 2.3: Update TodoWrite progress
    ├─ Mark: Completed subtasks
    ├─ Note: Any blockers
    └─ Time: 2 minutes per update

[ ] Step 2.4: Write tests
    ├─ Unit tests: For business logic
    ├─ Integration tests: For API endpoints
    ├─ E2E tests: For user flows
    └─ Time: 30-60 minutes

[ ] Step 2.5: Run tests locally
    ├─ pnpm run test
    ├─ Fix: Any failures
    └─ Time: 10-20 minutes

Phase 3: Integration (30-60 minutes)
─────────────────────────────────────────
[ ] Step 3.1: Update related code
    ├─ API endpoints: If needed
    ├─ Database schema: If needed
    ├─ Frontend components: If needed
    └─ Time: Variable

[ ] Step 3.2: Add documentation
    ├─ Code comments: For complex logic
    ├─ README updates: For new packages/modules
    ├─ API docs: For new endpoints
    └─ Time: 15-30 minutes

[ ] Step 3.3: Type checking
    ├─ pnpm run type-check
    ├─ Fix: Any type errors
    └─ Time: 10 minutes

[ ] Step 3.4: Linting
    ├─ pnpm run lint
    ├─ Fix: Any lint errors
    └─ Time: 10 minutes

Phase 4: Verification (30 minutes)
─────────────────────────────────────────
[ ] Step 4.1: Full build
    ├─ pnpm run build
    ├─ Ensure: No build errors
    └─ Time: 10 minutes

[ ] Step 4.2: Manual testing
    ├─ Start: Development servers
    ├─ Test: Feature end-to-end
    ├─ Verify: Success criteria met
    └─ Time: 15 minutes

[ ] Step 4.3: Review changes
    ├─ git diff
    ├─ Review: All modifications
    ├─ Ensure: No unintended changes
    └─ Time: 5 minutes

Phase 5: Commit and Review (20 minutes)
─────────────────────────────────────────
[ ] Step 5.1: Commit changes
    ├─ git add [files]
    ├─ git commit with meaningful message
    ├─ Follow: Conventional commits
    ├─ Include: Co-authored-by if AI assisted
    └─ Time: 5 minutes

[ ] Step 5.2: Push to remote
    ├─ git push origin feature/[name]
    ├─ Create: Pull request
    ├─ Fill: PR template
    └─ Time: 10 minutes

[ ] Step 5.3: Request review
    ├─ Assign: Reviewers
    ├─ Label: Appropriately
    └─ Time: 2 minutes

[ ] Step 5.4: Update handoff notes
    ├─ Document: What was implemented
    ├─ Document: Any learnings
    ├─ Document: Next steps
    └─ Time: 5 minutes
```

**Success Criteria**:

- ✓ Feature implements PRD requirements
- ✓ All tests pass
- ✓ Code follows conventions
- ✓ Documentation updated
- ✓ PR created and reviewed

---

### Matrix 6: Debugging Production Issue

**Purpose**: Identify and fix a bug quickly **Time**: 30 minutes - 2 hours
**Priority**: P0 (BLOCKING if critical)

#### Checklist

```
Phase 1: Issue Identification (10 minutes)
─────────────────────────────────────────
[ ] Step 1.1: Gather information
    ├─ Error message: Exact text
    ├─ Stack trace: Full trace
    ├─ User actions: Steps to reproduce
    ├─ Environment: Where it occurred (dev, staging, prod)
    └─ Time: 5 minutes

[ ] Step 1.2: Assess severity
    ├─ Impact: How many users affected?
    ├─ Functionality: What is broken?
    ├─ Urgency: How quickly must it be fixed?
    └─ Time: 2 minutes

[ ] Step 1.3: Check known issues
    ├─ Review: Recent commits
    ├─ Search: Issue tracker
    ├─ Check: docs/guides/troubleshooting-guide.md
    └─ Time: 3 minutes

Phase 2: Root Cause Analysis (20-40 minutes)
─────────────────────────────────────────
[ ] Step 2.1: Reproduce locally
    ├─ Setup: Same environment/data
    ├─ Follow: Exact steps to reproduce
    ├─ Verify: Can consistently trigger bug
    └─ Time: 10-20 minutes

[ ] Step 2.2: Isolate the cause
    ├─ Add: Debug logging
    ├─ Use: Debugger breakpoints
    ├─ Narrow: To specific function/line
    └─ Time: 10-20 minutes

[ ] Step 2.3: Read relevant code
    ├─ File: Where bug occurs
    ├─ Dependencies: Called functions
    ├─ Data flow: How data reaches bug
    └─ Time: 5-10 minutes

Phase 3: Fix Implementation (20-60 minutes)
─────────────────────────────────────────
[ ] Step 3.1: Design fix
    ├─ Approach: What is the solution?
    ├─ Side effects: What might break?
    ├─ Alternatives: Are there better ways?
    └─ Time: 5-10 minutes

[ ] Step 3.2: Implement fix
    ├─ Make: Minimal changes
    ├─ Add: Defensive checks if needed
    ├─ Update: Related code if needed
    └─ Time: 15-30 minutes

[ ] Step 3.3: Write regression test
    ├─ Test: Exact scenario that failed
    ├─ Ensure: Test fails without fix
    ├─ Ensure: Test passes with fix
    └─ Time: 10-20 minutes

Phase 4: Verification (15-30 minutes)
─────────────────────────────────────────
[ ] Step 4.1: Test fix locally
    ├─ Run: Unit tests
    ├─ Run: Integration tests
    ├─ Run: Full test suite
    └─ Time: 10-15 minutes

[ ] Step 4.2: Manual verification
    ├─ Reproduce: Original issue
    ├─ Verify: Issue is resolved
    ├─ Test: Related functionality
    └─ Time: 10 minutes

[ ] Step 4.3: Check for side effects
    ├─ Run: Full application
    ├─ Test: Adjacent features
    ├─ Verify: Nothing else broke
    └─ Time: 10 minutes

Phase 5: Deployment (10-20 minutes)
─────────────────────────────────────────
[ ] Step 5.1: Commit fix
    ├─ Message: Clear description of bug and fix
    ├─ Include: Issue number if applicable
    └─ Time: 3 minutes

[ ] Step 5.2: Create PR or hotfix
    ├─ If critical: Hotfix branch
    ├─ If not: Regular PR
    ├─ Label: As bug fix
    └─ Time: 5 minutes

[ ] Step 5.3: Fast-track review (if critical)
    ├─ Request: Immediate review
    ├─ Deploy: To staging first
    ├─ Monitor: Staging for issues
    └─ Time: Variable

[ ] Step 5.4: Document
    ├─ Update: docs/guides/troubleshooting-guide.md
    ├─ Add: To known issues list
    ├─ Write: Post-mortem if major
    └─ Time: 5-10 minutes
```

**Success Criteria**:

- ✓ Bug no longer occurs
- ✓ Root cause identified
- ✓ Regression test added
- ✓ No new bugs introduced
- ✓ Documented for future reference

---

## Advanced Orchestration Matrices

### Matrix 7: Self-Improvement Cycle

**Purpose**: Systematically improve the codebase **Time**: 1-2 hours
**Priority**: P2 (HIGH for long-term quality)

#### Checklist

```
Phase 1: Analysis (20 minutes)
─────────────────────────────────────────
[ ] Step 1.1: Run /self-improve command
    ├─ Command: Use Skill tool with skill: "self-improve"
    ├─ Scope: Specify area (e.g., "agent-system")
    ├─ Mode: Set comprehensive: true or false
    └─ Time: 5 minutes

[ ] Step 1.2: Review generated report
    ├─ Read: All identified improvements
    ├─ Understand: Reasoning for each
    ├─ Note: Estimated impact
    └─ Time: 10 minutes

[ ] Step 1.3: Cross-reference with existing docs
    ├─ Check: Architecture standards
    ├─ Check: Best practices guides
    ├─ Ensure: Recommendations align
    └─ Time: 5 minutes

Phase 2: Prioritization (15 minutes)
─────────────────────────────────────────
[ ] Step 2.1: Categorize improvements
    ├─ Architecture: Structural changes
    ├─ Performance: Speed/efficiency
    ├─ Security: Vulnerability fixes
    ├─ Maintainability: Code quality
    ├─ Documentation: Knowledge gaps
    └─ Time: 5 minutes

[ ] Step 2.2: Score by impact
    ├─ High: Critical architectural improvements
    ├─ Medium: Quality of life improvements
    ├─ Low: Nice-to-have optimizations
    └─ Time: 5 minutes

[ ] Step 2.3: Select top 3-5
    ├─ Balance: Quick wins and long-term improvements
    ├─ Consider: Available time
    ├─ Create: TodoWrite plan
    └─ Time: 5 minutes

Phase 3: Implementation (30-60 minutes)
─────────────────────────────────────────
[ ] Step 3.1: Improvement #1
    ├─ Follow: Feature development matrix
    ├─ Implement: Change
    ├─ Test: Thoroughly
    └─ Time: Variable per improvement

[ ] Step 3.2: Improvement #2
    ├─ (Repeat process)
    └─ Time: Variable

[ ] Step 3.3: Improvement #3
    ├─ (Repeat process)
    └─ Time: Variable

Phase 4: Measurement (15 minutes)
─────────────────────────────────────────
[ ] Step 4.1: Define metrics
    ├─ Before: Baseline measurements
    ├─ After: Improvement measurements
    ├─ Examples: Build time, test time, bundle size
    └─ Time: 5 minutes

[ ] Step 4.2: Collect data
    ├─ Run: Benchmarks
    ├─ Run: Performance tests
    ├─ Record: Results
    └─ Time: 5 minutes

[ ] Step 4.3: Calculate improvement
    ├─ Compare: Before and after
    ├─ Calculate: Percentage improvement
    ├─ Document: Results
    └─ Time: 5 minutes

Phase 5: Documentation (15 minutes)
─────────────────────────────────────────
[ ] Step 5.1: Update handoff notes
    ├─ What: Was improved
    ├─ Why: It was improved
    ├─ Results: Metrics
    └─ Time: 5 minutes

[ ] Step 5.2: Update relevant docs
    ├─ Architecture: If structure changed
    ├─ Best practices: If patterns changed
    ├─ README: If significant
    └─ Time: 5 minutes

[ ] Step 5.3: Share learnings
    ├─ Team: Share what was learned
    ├─ Document: In self-improvement log
    └─ Time: 5 minutes
```

**Success Criteria**:

- ✓ 3-5 improvements implemented
- ✓ Measurable improvement in metrics
- ✓ All tests still pass
- ✓ Documentation updated
- ✓ Learnings shared

---

## Quick Reference Cheat Sheet

### Common Matrix Combinations

**Starting a new task?**

```
1. Matrix 1: New Session Initialization (30-45 min)
2. Matrix 5: Feature Development (Variable)
3. Matrix 2: Session Completion (15-20 min)
```

**Joining a complex project?**

```
1. Matrix 4: New Developer Onboarding (4-5 hours Day 1)
2. Matrix 1: Session Initialization (Day 2+)
3. Matrix 5: Feature Development (When ready)
```

**Production is down?**

```
1. Matrix 6: Debugging Production Issue (IMMEDIATE)
2. Matrix 2: Session Completion (Document fix)
```

**Want to improve quality?**

```
1. Matrix 1: Session Initialization
2. Matrix 7: Self-Improvement Cycle (1-2 hours)
3. Matrix 2: Session Completion
```

**Multi-agent coordination needed?**

```
1. Matrix 1: Session Initialization
2. Matrix 3: Multi-Agent Orchestration (Variable)
3. Matrix 2: Session Completion
```

---

## Success Tracking

### Metrics to Track

```yaml
For Each Matrix Completion:
  - Actual time vs estimated time
  - Steps skipped (and why)
  - Blockers encountered
  - Success criteria met (% complete)

Aggregate Metrics:
  - Average time to productivity (Matrix 1)
  - Feature cycle time (Matrix 5)
  - Bug fix time (Matrix 6)
  - Improvement ROI (Matrix 7)
  - Multi-agent coordination efficiency (Matrix 3)
```

### Continuous Improvement

After completing each matrix:

1. Note time variance
2. Identify bottlenecks
3. Suggest process improvements
4. Update matrices based on learnings

---

**Remember**: These matrices are templates. Adapt them to your specific needs
while maintaining the core structure and principles.
