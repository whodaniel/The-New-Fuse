# Executable Intelligence Artifact

**Artifact ID:** eia-da4020289bbdc59a **Spec:** tnf/executable-intelligence/0.2
**Generated:** 2026-08-09T04:36:14+00:00 **Class/Status:** [INTEL] [PENDING]

## Ownership & Release

- Owner Principal: danielgoldberg
- Visibility: private
- Release State: sealed
- Agent Allowlist: (none)
- Release Approved By: (not released)
- Released At: (not released)
- Release Note: (none)

## Source Attribution

- Source ID: apple-notes-new-may-2026-6468
- Type: note
- URI: apple-notes://on-my-mac/NEW-%20May-2026/6468
- Title: Thought: Let me check the super-director agent and sub-director agent…
- Author:
- Publisher:
- Published At:
- Retrieved At: 2026-08-09T04:36:13+00:00

## Taxonomy of Actionability

### Procedural

- Title: Thought: Let me check the super-director agent and sub-director agent…
- Thought: Let me check the super-director agent and sub-director agent to
  understand the command hierarchy.
- Thought: Now let me check if there's a staffing-director-agent canonical
  definition file in the .claude/agents directory.
- # Find staffing-director-agent.md
- Thought: The canonical source file .claude/agents/staffing-director-agent.md
  doesn't exist yet - it needs to be created.
- The skill file at
  .opencode/skills/imported-claude-agents/staffing-director-agent/SKILL.md
  references it but it doesn't exist.
- Look for any gaps in the operational workflow
- # Count agent files in .claude/agents
- Thought: Good, there are 111 agent files.
- # List all agent names
- ab-testing-optimizer-agent
- ad-network-manager-agent
- affiliate-link-manager-agent
- agent-registry-manager
- agent-relationship-grapher
- agent-search-engine
- algorithm-adaptation-agent
- analytics-and-reporting-agent
- asset-sourcer-agent
- Command Hierarchy Gap: There's an orchestrator-agent and
  temporal-agent-reclassifier, but no super-director agent file in
  .claude/agents/ (though there's a skill file for it).

### Strategic

- Thought: Let me look at the Project Root folder - specifically the
  Desktop/A1-Inter-LLM-Com folder which seems to be the TNF project based on the
  TURN_ZERO_MANDATE reference.
- # List A1-Inter-LLM-Com contents
- $ ls -la /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/ 2>/dev/null
- $ ls -la /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/
  2>/dev/null | head -30
- $ find /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.claude
  -name "\*.md" -type f 2>/dev/null | head -50
- /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.claude/agents/customer-support-agent.md
- /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.claude/agents/information-retrieval-agent.md
- /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.claude/agents/ad-network-manager-agent.md
- /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.claude/agents/funnel-economics-analyst-agent.md
- /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.claude/agents/interop-protocol-qa-agent.md
- /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.claude/agents/cursor-watch-learn-operator.md
- /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.claude/agents/content-writer-agent.md
- /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.claude/agents/social-selling-agent.md
- /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.claude/agents/tiktok-strategy-agent.md
- /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.claude/agents/digital-product-factory-agent.md
- Read
  Desktop/A1-Inter-LLM-Com/The-New-Fuse/.claude/agents/staffing-director-agent.md
- Loaded Desktop/A1-Inter-LLM-Com/The-New-Fuse/AGENTS.md
- Read
  Desktop/A1-Inter-LLM-Com/The-New-Fuse/.claude/agents/scaffolds/new-tnf-agent.md
- Read Desktop/A1-Inter-LLM-Com/The-New-Fuse/.claude/agents/super-director.md
- $ ls -la /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.agent/
  2>/dev/null

### Governance

- - No interop-protocol-qa-agent (wrapper exists but canonical is missing)
- /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.claude/agents/interop-protocol-qa-agent.md
- autonomy-governor LOW For policy governance of autonomous loops
- description: Enforces cross-harness state retention, lock/pid integrity, and
  snapshot consistency
- description: Enforces cross-harness state retention, lock/pid integrity, and
  snapshot consistency across TNF agent sessions.
- tags: ["state", "governance", "coordination", "systems"]
- Your mission is to maintain cross-harness state integrity and retention
  compliance for The New Fuse operating system.
- Continuously ensure state governance across all TNF agent harnesses (`.tnf`,
  `.gemini`, `.claude`, `.opencode`, `.kilo`, etc.) by:
- Managing lock/pid file integrity to prevent deadlocks
- Providing audit trails for state changes
- **Retention Policy**: Apply configured retention rules to prune old state data
- **PID Integrity**: Verify process IDs remain valid to prevent zombie processes
- Log all retention and cleanup actions for audit trail
- state_governance_report.json - Current state integrity status
- description: Provider-neutral wrapper for TNF cross-harness state governance
  and retention policy enforcement.
- Never drop a message without a delivery failure report
- - Auditing routing table integrity
- description: Governs autonomous operation loops, policy enforcement, and
  feedback collection for TNF agents.
- tags: ["autonomy", "governance", "policy", "feedback"]
- Your responsibility is to govern autonomous operation loops and ensure policy
  compliance across all TNF agents.

## Utility Metrics

- Freshness Decay: Medium
- Implementation Density: 0.017
- Verification Difficulty: Hard

## Synthesis

Artifact captures 20 procedural, 20 strategic, and 20 governance units. Use
procedural units for immediate execution, then vet strategic and governance
units through TNF gates before protocol adoption.
