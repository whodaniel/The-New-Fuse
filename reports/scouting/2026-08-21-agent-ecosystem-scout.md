# Agent Ecosystem Scout Receipt — 2026-08-21

## Scope

Official/current agent capability and interoperability refresh covering OpenAI ChatGPT/Codex, Anthropic Claude/Cowork/Claude Code, Google Gemini/Spark and developer agent surfaces, Cursor, GitHub Copilot, and emerging cross-agent protocols/harnesses.

## Material findings

### OpenAI

- The July 9, 2026 Plugin Directory migration is operationally important: plugins are now the primary discoverability/container unit across ChatGPT and Codex and may package skills, apps, and app templates. App permissions and source-system permissions remain authoritative.
- Codex continues to expose worktrees, parallel agents, skills, automations/background work, MCP/tool connections and role-specific knowledge-work plugins.

TNF action: model OpenAI plugin inventory separately from connected app credentials/permissions; ingest plugin/skill/app identifiers and task receipts, never OAuth material.

### Anthropic

- Claude Code / Claude Agent SDK deserves a first-class ledger record separate from Cowork. Official Anthropic material confirms subagents, hooks, background tasks, checkpoints/rewind, MCP integrations, and the Agent SDK as the reusable harness behind Claude Code.
- Enterprise Claude surfaces expose managed policies/spend controls and a Compliance API for programmatic usage/content governance.

TNF action: add a Claude Code adapter that exports session/task receipts, subagent topology, MCP/tool grants, hook-config digests, checkpoint/artifact references, and spend-policy state where authorized. Prefer SDK/Compliance API surfaces over scraping chat history.

### Google

- Gemini Spark has expanded materially since its initial record: Chrome integration can perform authenticated web errands with permission and hand sensitive actions such as payments back to the user; Spark has also expanded to Google AI Pro users in many regions.
- Spark schedules remain distinct from Gemini Scheduled Actions. Spark documents time schedules, Gmail monitors, topic monitors, reusable skills, custom MCP Connected Apps, and a 15-concurrent-task limit.
- Managed Agents in the Gemini API now provide background execution, remote MCP integration, custom functions, and credential refresh across interactions.
- Google Agents CLI / ADK now represents a meaningful interoperability surface: current Python ADK templates expose A2A agent cards/JSON-RPC by default, and the CLI can run/register A2A agents.

TNF action: prioritize a TNF MCP Connected App for Spark; add separate Managed Agents API and A2A adapters rather than treating all Google agent surfaces as Spark. Activity receipts should capture browser-action outcomes without cookies/passwords.

### Cursor

- Background Agents API remains beta with up to 256 active agents per API key. Official pricing documents model-API-price usage, explicit Background Agent spend limits, and possible future VM compute pricing.

TNF action: retain MeteredExecutionCostAuthority in front of all TNF-triggered Cursor background runs and record both model usage and future VM-compute receipts separately.

### GitHub Copilot

- GitHub Copilot now warrants a first-class platform record. Current official docs describe repository/org/enterprise custom agents, subagents with isolated context, parallel delegation, built-in CLI specialist agents, skills, hooks, MCP tool scoping, plugins, programmatic CLI agent selection, and Copilot SDK lifecycle/subagent APIs.

TNF action: support `.github/agents/*.md` as a portable agent-definition source, map Copilot SDK subagent lifecycle events into TNF AgentActivityReceipt records, and preserve the source agent-profile Git SHA for reproducibility.

### Emerging interoperability

- A2A is now a practical cross-framework target in addition to MCP. Google ADK/Agents CLI exposes A2A by default for current Python templates, and Microsoft Agent Framework documentation describes A2A agent discovery, tasks, and cross-platform communication.

TNF action: treat MCP and A2A as complementary: MCP for tool/context exposure, A2A for agent discovery/task exchange. Build adapters behind TNF capability/activity contracts rather than binding orchestration to either protocol.

## Pricing / limits implications

- Cursor Background Agents: model API pricing; spend limit required; VM compute may become separately priced.
- Gemini Spark: qualifying Google AI plan required; 15 concurrent tasks; schedules approximate and can be delayed under load.
- Gemini Scheduled Actions: up to 10 active actions and results may be prepared in advance, so they should not be used for time-critical monitoring.
- OpenAI plugin availability depends on plan, workspace role, region, supported surface, and underlying app permissions.

## Privacy / retention implications

No scout finding justifies copying raw cross-provider histories. The existing TNF distinction remains correct: platform capability, user-instance enabled capability, and attributable activity history are separate records. Browser/session integrations make secret rejection and narrow action receipts more important, not less.

## Canonical records changed

- `data/agent-ecosystem/platform-capabilities.json`
  - refreshed OpenAI plugin terminology and MCP surface;
  - added Claude Code / Claude Agent SDK;
  - expanded Gemini Spark with Chrome/browser-agent capability;
  - added Gemini API Managed Agents;
  - added Google Agents CLI / ADK / A2A;
  - refreshed Cursor cost/limit notes;
  - added GitHub Copilot agent platform.

## Related work

- #119 — revenue intelligence + cross-agent ecosystem awareness
- #121 — provider adapters / activity ledger interoperability
- #118 — metered execution cost authority

## Source set

Primary sources inspected include OpenAI product/help/academy pages, Anthropic product/webinar/admin pages, Google Gemini Help and Google AI developer/product announcements, Cursor official docs, GitHub Copilot official docs, Google Agents CLI documentation, and Microsoft Agent Framework A2A documentation.

Scout cost: no paid provider execution required for the research control plane.
