`[CLASS:PRIME] [STATUS:PENDING]` `[DOC_AUDIT_BACKFILL:2026-07-14]` — header
restored for Gate 3 compliance; reclassify on next vetting pass.

┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ▗▄▄▄ ▗▄▄▖ ▗▖ ▗▖ ▗▄▄▖ ▗▄▄▖ ▗▄▖ ▗▄▄▄▖ v2.0 - COMPLETE │ │ ▐▌ ▐▌ ▐▌ ▐▌▐▌ ▐▌ ▐▌
▐▌▐▌ │ │ ▐▌ ▐▌ ▐▛▀▜▌▝▚▖ ▐▌ ▐▌ ▐▌▐▛▀▘ │ │ ▝▚▘ ▝▚▘ ▐▌ ▐▌ ▝▘ ▝▚▘ ▝▚▘▐▌▐▘ │ │ │ │ │
│┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
││ SUMMARY OF CHANGES │ ││ • Federated Governance with Core Tenets rooted in
least-privilege, zero-trust, and HITL. These │ ││ principles drive enforcement
across the system (Loop breakers, Budget Sentinels, JVM Wallet │ ││ Scoping,
Merkle consistency, etc.), rather than remaining philosophical or legal. │ ││ •
Three distinct federation patterns—Relayed, Staged, and Local—to ensure the
Orchestrator │ ││ dispatches to other agents or external APIs without leaking
credentials or context. │ ││ • Status Ledger & LIVING_STATE.md with
cryptographic signatures and Merkle tree roots. Status │ ││ transitions require
a signature from the Orchestrator or a majority-approved “Triumvirate” if │ ││
the Orchestrator is compromised, avoiding single points of failure. │ ││ • Agent
lifecycle (Registration → Provisioning → Execution → Retirement/Recycling)
enforced by │ ││ mandatory `agent-init` and `agent-terminate` checkpoints in
every workflow. │ ││ • Targeted Handoff Protocol v1.1 with at-least-once
delivery, idempotent acks, and required │ ││ Merkle verification on every
handoff. │ ││ • Authentication & Access Control updated to use JWT for
perspective agents with capability- │ ││ based claims, plus local API keys for
first-party microservices, and mandatory HITL for ROOT │ ││ level protocol
changes. │
│└──────────────────────────────────────────────────────────────────────────────────────────────────┘
│ │ TABLE OF CONTENTS │ │ 1. Core Governance Tenets & Enforcement 6. Status
Tracking, Ledgering & State │ │ 2. Human-in-the-Loop (HITL) Drain 7. Targeted
Handoff Protocol v1.1 │ │ 3. Federation Patterns & Synthesis 8. Authentication &
Access Control │ │ 4. Orchestrator Role & Controls 9. Security & Sandbox
Controls │ │ 5. Agent Lifecycle & Onboarding 10. Governance Diagrams & Visual
Flows │ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

▗▖▗▄▄▄▖▗▖ ▗▄▄▖▗▖ ▗▖▗▄▄▖▗▄▄▄▖▗▄▄▖ 1. CORE GOVERNANCE TENETS & ENFORCEMENT ▌ ▐▌▐▌
▐▌ ▐▌ ▝▚▖▗▛ ▐▌ ▐▌ ▐▌ ▐▌▐▛▀▀▘▐▌ ▐▌ ▝▐▌▛ ▐▛▀▀▘▐▛▀▀▘ ▐▌ ▐▌ ▐▌▐▌ ▐▙▄▄▖▝▚▘ ▐▌ ▐▌ ▐▘
▐▌

▌ [PRIME] TNF Governance Tenets (v2.0) ▌ ▌
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐ ▌
│ AXIOM │ RULE │ ENFORCEMENT │ CLASS │ ▌
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤ ▌
│ ATTRIBUTION │ Every artifact │ Must bear │ Every output │ ▌ │ OVER-RULE │ MUST
link to │ resource_pointer │ link, plus │ ▌ │ │ verbatim source │ in all │
Merkle proof │ ▌ │ │ │ generated docs │ │ ▌
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤ ▌
│ RESOURCE │ Select most │ Benchmark & │ Resource │ ▌ │ EFFICIENCY │ performant,
│ justify; C++/ │ Scoping; │ ▌ │ DIRECTIVE │ least costly │Rust/LLVM valid │
rejection if │ ▌ │ │ resource │ when superior │ spend > limit. │ ▌ │ │ ab │ caps
spend. │ │ ▌
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤ ▌
│ RADICAL │ Every thought │ Persistent JSON- │ Immutable play- │ ▌ │
TRANSPARENCY │ stream & tool │ RPC log; agent │ back; all state │ ▌ │ AXIOM │
call recorded │ status posted │ diffs logged. │ ▌ │ │ │ to shared │ │ ▌ │ │ │
ledger │ │ ▌
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤ ▌
│ LOOP & RESOURCE │ >50 recursive │ Process killed; │ Historian- │ ▌ │
GOVERNANCE │ steps or 2 │ handed to │ Auditor board │ ▌ │ │ failures │ Historian
for │ review. │ ▌ │ │ triggers kill & │ root-cause │ │ ▌ │ │ audit │ analysis │
│ ▌
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤ ▌
│ BUDGET SENTINEL │ Hard cap on │ Script throws │ If breached, │ ▌ │ │ total API
│ exception; all │ only Orchestrator│ ▌ │ │ spend per agent │ agent lanes stop │
(Super Admin) │ ▌ │ │ / project │ instantly. │ can unfreeze. │ ▌
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤ ▌
│ GPU THERMAL │ Pause if T > │ Auto-throttle; │ Hardware safety │ ▌ │ GATING │
safety threshold │ Historian │ supervision │ ▌ │ │ │ alerted │ │ ▌
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤ ▌
│ DISPOSABLE │ All agentic code │ Docker/E2B │ No host access │ ▌ │ RUNTIMES │
must run │ isolation; │ without explicit │ ▌ │ │ isolated │ Lateral Lock │ HITL
│ ▌ │ │ │ prevents root │ │ ▌
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤ ▌
│ LATERAL LOCK │ Task-specific │ Namespaces for │ Swarm failures │ ▌ │ │
namespaces only │ each agent; no │ isolated to 1 │ ▌ │ │ │ cross-lane read │
lane │ ▌
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤ ▌
│ VISUAL INTEGRITY │ UI must match │ Design-token │ Automated CI │ ▌ │ GATE │
design system │ linter; visual │ gate on deploy │ ▌ │ │ │ diff check for │ │ ▌ │
│ │ all PRs │ │ ▌
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤ ▌
│ SYNTHETICS │ All AI media │ Watermark │ Content │ ▌ │ LABELLING │ watermarked
│ detector; │ provenance audit │ ▌ │ │ "Synthetic" │ removal triggers │ │ ▌ │ │
│ kill switch │ │ ▌
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤ ▌
│ MERKLE TREE │ Turn Zero sync │ Root hash │ Pre-flight │ ▌ │ CONSISTENCY │
verification on │ must equal │ check before │ ▌ │ │ all starts │ stored value │
any work begins │ ▌
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤ ▌
│ DOSSIER │ Any │ Logs in │ Connective │ ▌ │ REQUIREMENT │ solidification │
interpreted │ Journal │ ▌ │ │ of understanding │ knowledge bank; │ indexed; │ ▌
│ │ must be journaled│ all decisions │ searchable in │ ▌ │ │ │ auditable │
pgvector │ ▌
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘ ▌
▌ Enforcement Matrix ▌ ▌ Every rule is enforced by a triad: (1) AUTOMATED CHECK
→ (2) SUPERVISOR NOTIFICATION → (3) HUMAN ESCALATION ▌ ▌
┌──────────────────┬──────────────────┬──────────────────────────┬──────────────────────────┐
▌ │ TENANT │ AUTOMATED CHECK │ SUPERVISOR NOTIFY │ HUMAN ESCALATION │ ▌
├──────────────────┼──────────────────┼──────────────────────────┼──────────────────────────┤
▌ │ Loop / Budget │ Step counter │ Orchestrator alert; │ Historian audit if │ ▌
│ │ & cost calculator│ killswitch on limit │ /audit log flag set │ ▌
├──────────────────┼──────────────────┼──────────────────────────┼──────────────────────────┤
▌ │ GPU / Health │ Hardware sensor │ EventBus telemetry │ SysAdmin page if │ ▌ │
│ daemon │ dashboard alert │ >2 agents affected │ ▌
├──────────────────┼──────────────────┼──────────────────────────┼──────────────────────────┤
▌ │ Lateral Lock │ Namespace scoping│ Swarm incident stream │ Security board if
│ ▌ │ │ runtime flag │ (Orchestrator + Admin) │ breach persists │ ▌
└──────────────────┴──────────────────┴──────────────────────────┴──────────────────────────┘

▗▖▗▄▄▄▖▗▖ ▗▄▄▖▗▖ ▗▖▗▄▄▖▗▄▄▄▖▗▄▄▖ 2. HUMAN-IN-THE-LOOP (HITL) DRAIN ▌ ▐▌▐▌ ▐▌ ▐▌
▝▚▖▗▛ ▐▌ ▐▌ ▐▌ ▐▌▐▛▀▀▘▐▌ ▐▌ ▝▐▌▛ ▐▛▀▀▘▐▛▀▀▘ ▐▌ ▐▌ ▐▌▐▌ ▐▙▄▄▖▝▚▘ ▐▌ ▐▌ ▐▘ ▐▌

▌ Three-tier HITL model, split by Risk Class ▌ ▌
┌──────────────────┬──────────────────┬──────────────────────────┬──────────────────────────┐
▌ │ Class │ Triggers │ HITL Pattern │ Decision Authority │ ▌
├──────────────────┼──────────────────┼──────────────────────────┼──────────────────────────┤
▌ │ EXECUTIVE │ Financial tx, │ Mandatory human "Go" │ Super Admin (ONLY) │ ▌ │
( irreversible ) │ public post, │ coded key; dual-key │ No agent bypass
possible; │ ▌ │ │ root system mod │ co-sign for safety │ Tabula rasa if missing
│ ▌
├──────────────────┼──────────────────┼──────────────────────────┼──────────────────────────┤
▌ │ OPERATIONAL │ Workflow │ Human confirmation │ Admin / Lead Developer │ ▌ │ (
high-risk ) │ branch point, │ dialog; Slack/Telegram │ Override limited to 1 │ ▌
│ │ agent >50 steps │ DM; 5 min timeout │ lane; kill if timeout │ ▌
├──────────────────┼──────────────────┼──────────────────────────┼──────────────────────────┤
▌ │ TACTICAL │ High-frequency │ Approval by logical │ Agent can apply for │ ▌ │
( routine ) │ micro-actions, │ next checker agent; │ override, but if granted, │
▌ │ │ low-stakes tool │ audit trail written; │ enforces retroactive │ ▌ │ │
calls │ HITL only if >N flags │ human review in 24h │ ▌
└──────────────────┴──────────────────┴──────────────────────────┴──────────────────────────┘
▌ ▌ High-Risk Approval Gate Flow ▌ ▌ Agent Sends Intent ──▶ Risk Classifier
(automated) ┌──────────┐ ▌ │ │ │ H │ ▌ │ ┌────────┴────────┐
┌───────────────────────┐ │ I │ ▌ │ │ │ │ Voice / Text Parrot │ │ T │ ▌ │ [Risk

> 0.9] [Risk 0.3-0.9] │ Back to User │ │ E │ ▌ │ │ │ │ │ │ N │ ▌ │ ┌────▼────┐
> ┌───▼───┐ │ "Execute X; confirm?" │ │ │ ▌ │ │ BLOCK │ │ OP │ │ │ │ │ ▌ │ │
> Absolute│ │ Review│ │ Human ──Yes──▶ Execute│ │ │ ▌ │ │ HITL │ │ Branch│ │
> Confirms │ │ │ ▌ │ │ Required│ │ 5 min │ └───────────────────────┘ │ │ ▌ │
> └────┬────┘ └───┬───┘ │ │ ▌ │ │ No: Auto-pilot Safe track │ │ ▌ │ │ kill
> switch (No human needed) │ │ ▌ └──────────────┴───────────────────────▶ Logged
> to: Merkle Tree + Status Ledger │ ▌ ▌ Voice Confirmation Pattern ▌ ▌ When
> voice commands are the input channel, the system MUST parrot the parsed intent
> ▌ back to the user verbatim before any high-risk execution. The confirmation
> token is then ▌ stored in the Merkle tree with a timestamp and the voice-ID
> hash, so it cannot be replayed.

▗▖▗▄▄▄▖▗▖ ▗▄▄▖▗▖ ▗▖▗▄▄▖▗▄▄▄▖▗▄▄▖ 3. FEDERATION PATTERNS & SYNTHESIS ▌ ▐▌▐▌ ▐▌ ▐▌
▝▚▖▗▛ ▐▌ ▐▌ ▐▌ ▐▌▐▛▀▀▘▐▌ ▐▌ ▝▐▌▛ ▐▛▀▀▘▐▛▀▀▘ ▐▌ ▐▌ ▐▌▐▌ ▐▙▄▄▖▝▚▘ ▐▌ ▐▌ ▐▘ ▐▌

▌ Primary Patterns extracted from FEDERATED_INTELLIGENCE_SYNTHESIS.md +
FEDERATION_IMPROVEMENTS.md ▌ ▌
┌──────────────────────┬────────────────────────────────────────┬──────────────┬──────────┐
▌ │ Pattern │ Description │ Priority │ Status │ ▌
├──────────────────────┼────────────────────────────────────────┼──────────────┼──────────┤
▌ │ Redis Pub/Sub │ UniversalBridge fallback from │ HIGH │ Phase 1,│ ▌ │
Transport │ in-process MemoryTransportAdapter │ │ Pending │ ▌ │ │ to true
cross-container dispatch │ │ │ ▌
├──────────────────────┼────────────────────────────────────────┼──────────────┼──────────┤
▌ │ Binary Serialization │ MsgPack / Protobuf replacing │ MEDIUM │ Phase 2,│ ▌ │
│ JSON.stringify for message payloads │ │ Future │ ▌
├──────────────────────┼────────────────────────────────────────┼──────────────┼──────────┤
▌ │ JWT Identity & HS │ Signed agent tokens, capability- │ HIGH │ Phase 1,│ ▌ │
│ based claims, handshake enforcement │ │ Active │ ▌
├──────────────────────┼────────────────────────────────────────┼──────────────┼──────────┤
▌ │ Response Correlation │ `correlationId` + `pendingRequests` │ MEDIUM │ Phase
│ ▌ │ │ map for end-to-end request tracking │ │ DONE │ ▌
├──────────────────────┼────────────────────────────────────────┼──────────────┼──────────┤
▌ │ Channel Auto-Join │ Batch channel joins vs. sequential │ MEDIUM │ Phase 3,│
▌ │ │ to prevent race conditions │ │ Future │ ▌
├──────────────────────┼────────────────────────────────────────┼──────────────┼──────────┤
▌ │ Heartbeat Batching │ Bulk heartbeat with all agent IDs │ LOW │ Phase 4,│ ▌ │
│ instead of per-agent heartbeats │ │ Future │ ▌
└──────────────────────┴────────────────────────────────────────┴──────────────┴──────────┘
▌ ▌ Synthesis Matrix (Federated Intelligence v2.0) ▌ ▌
┌────────────────────────┬────────────────────────┬──────────────────────────────┐
▌ │ Recommendation │ Orchestrator Analysis │ Status │ ▌
├────────────────────────┼────────────────────────┼──────────────────────────────┤
▌ │ Redis Pub/Sub │ Agent Registry │ ✅ ALIGNED │ ▌ │ Transport │ Persistence
plan │ Execute Phase 1 │ ▌
├────────────────────────┼────────────────────────┼──────────────────────────────┤
▌ │ JWT Authn + Cap │ Capability Verify │ ✅ ALIGNED │ ▌ │ handshake │
Conformance │ Execute Phase 1 │ ▌
├────────────────────────┼────────────────────────┼──────────────────────────────┤
▌ │ MsgPack Serialization │ NEW - accepted │ ✅ ADOPTED for Phase 2 │ ▌ │
(Gemini discovery) │ (performance win) │ Future sprint │ ▌
└────────────────────────┴────────────────────────┴──────────────────────────────┘

▗▖▗▄▄▄▖▗▖ ▗▄▄▖▗▖ ▗▖▗▄▄▖▗▄▄▄▖▗▄▄▖ 4. ORCHESTRATOR ROLE & CONTROLS ▌ ▐▌▐▌ ▐▌ ▐▌
▝▚▖▗▛ ▐▌ ▐▌ ▐▌ ▐▌▐▛▀▀▘▐▌ ▐▌ ▝▐▌▛ ▐▛▀▀▘▐▛▀▀▘ ▐▌ ▐▌ ▐▌▐▌ ▐▙▄▄▖▝▚▘ ▐▌ ▐▌ ▐▘ ▐▌

▌ The Orchestrator (Super Admin persona) is the ONLY entity with: ▌ ▌ 1.
Authority to dispatch `AGENT-INIT` commands to create new agent lanes. ▌ 2.
Authority to freeze / unfreeze the entire swarm via the Budget Sentinel kill
switch. ▌ 3. Authority to override loop-breakers >50 steps (rare; recorded as
artifact). ▌ 4. Authority to change system-level governance constants (risk
thresholds, cost caps). ▌ 5. Authority to retire agents and recycle their
credentials & context. ▌ ▌ Orchestrator Controller Hierarchy ▌ ▌
┌──────────────┐ ▌ │ Orchestrator│ ▌ │ (Super Admin)│ ▌ └──────┬─────┘ ▌
┌───────────┼───────────┐ ▌ ▼ ▼ ▼ ▌ ┌──────┐ ┌─────────┐ ┌──────────┐ ▌ │Admin │
│ Historian│ │ Developer│ ▌ │ Lane │ │ -Auditor │ │ Lane │ ▌ └──────┘
└─────────┘ └──────────┘ ▌ │ │ │ ▌ └───────────┼───────────┘ ▌ ▼ ▌ ┌──────────┐
▌ │ Budget │ ▌ │ Sentinel │ ▌ └────┬─────┘ ▌ │ ▌ ┌─────┴─────┐ ▌ ▼ ▼ ▌
┌─────────┐ ┌─────────┐ ▌ │ Swarm 1 │ │ Swarm 2 │ ▌ │ (Dev) │ │ (Test) │ ▌
└─────────┘ └─────────┘

▗▖▗▄▄▄▖▗▖ ▗▄▄▖▗▖ ▗▖▗▄▄▖▗▄▄▄▖▗▄▄▖ 5. AGENT LIFECYCLE & ONBOARDING PATTERNS ▌ ▐▌▐▌
▐▌ ▐▌ ▝▚▖▗▛ ▐▌ ▐▌ ▐▌ ▐▌▐▛▀▀▘▐▌ ▐▌ ▝▐▌▛ ▐▛▀▀▘▐▛▀▀▘ ▐▌ ▐▌ ▐▌▐▌ ▐▙▄▄▖▝▚▘ ▐▌ ▐▌ ▐▘
▐▌

▌ 1. REGISTRATION ▌ • Agent entity created in MCP Registry with: ▌ – name, type
{developer, filesystem, assistant, researcher, creator, technician} ▌ –
capabilities array ▌ – metadata: version, provider, model, etc. ▌ • JWT or API
Key issued; agent must authenticate on first connect.

▌ 2. TURN ZERO SYNC ▌ • On every start, agent MUST verify Merkle Root Hash
against GitHub Snapshot Vault. ▌ • Mismatch = stop; escalate to Historian for
audit.

▌ 3. PROVISIONING ▌ • Namespaced to a Lane (e.g., `dev-lane-1`) via Lateral
Lock. ▌ • Budget cap & wallet scoping assigned by Project ID.

▌ 4. EXECUTION ▌ • Agent follows Targeted Handoff v1.1 (see Section 7). ▌ •
Heartbeat / status updates posted to the shared Agent Status Ledger. ▌ • Tool
calls recorded in persistent JSON-RPC log.

▌ 5. RETIREMENT / RECYCLING ▌ • Agent deregistered from MCP Registry. ▌ •
Context window flushed (no memory leakage). ▌ • Credentials invalidated; any JWT
blacklisted. ▌ • Final compliance artifact generated.

▗▖▗▄▄▄▖▗▖ ▗▄▄▖▗▖ ▗▖▗▄▄▖▗▄▄▄▖▗▄▄▖ 6. STATUS TRACKING, LEDGERING & STATE ▌ ▐▌▐▌ ▐▌
▐▌ ▝▚▖▗▛ ▐▌ ▐▌ ▐▌ ▐▌▐▛▀▀▘▐▌ ▐▌ ▝▐▌▛ ▐▛▀▀▘▐▛▀▀▘ ▐▌ ▐▌ ▐▌▐▌ ▐▙▄▄▖▝▚▘ ▐▌ ▐▌ ▐▘ ▐▌

▌ Status Registry in AGENT_STATUS_LEDGER.md ▌ ▌
┌──────────────┬──────────────────────────────────────────────────────────────────┐
▌ │ Field │ Meaning │ ▌
├──────────────┼──────────────────────────────────────────────────────────────────┤
▌ │ Active Agents │ Currently registered, have heartbeat within last N minutes.
│ ▌ │ Standing By │ No assigned task; ready for handoff. │ ▌ │ Busy │ Executing
task; will not accept new handoff. │ ▌ │ Blocked │ Waiting for HITL, external
dependency, or resource. │ ▌ │ Retired │ Deregistered; credentials revoked. │ ▌
└──────────────┴──────────────────────────────────────────────────────────────────┘
▌ ▌ LIVING_STATE.md — Active Session Synchronization ▌ ▌ • Serves as the live
"brain sync" of the entire project. ▌ • Tracks active directives, project IDs,
session keys, and Merkle root. ▌ • Must be committed to GitHub at session
boundaries. ▌ • Any out-of-sync root triggers the "Turn Zero" hard-stop.

▗▖▗▄▄▄▖▗▖ ▗▄▄▖▗▖ ▗▖▗▄▄▖▗▄▄▄▖▗▄▄▖ 7. TARGETED HANDOFF PROTOCOL v1.1 ▌ ▐▌▐▌ ▐▌ ▐▌
▝▚▖▗▛ ▐▌ ▐▌ ▐▌ ▐▌▐▛▀▀▘▐▌ ▐▌ ▝▐▌▛ ▐▛▀▀▘▐▛▀▀▘ ▐▌ ▐▌ ▐▌▐▌ ▐▙▄▄▖▝▚▘ ▐▌ ▐▌ ▐▘ ▐▌

▌ HandoffPacket Fields (cloud-first) ▌ ▌ • fromAgentId – Source of handoff. ▌ •
targets.agentIds – Explicit recipient list (avoids broadcast storms). ▌ • scope
– tenantId, sessionKey, workflowId (replay/audit correlation). ▌ • payload –
prompt, acceptanceCriteria, nextActions. ▌ • cumulativeId – Mandatory
cross-protocol lineage (v1.1). ▌ • gateDecisions – Federation gate attestations
(v1.1). ▌ ▌ Delivery Semantics (Redis-backed) ▌ ▌ • `packet:{packetId}` → stores
packet JSON ▌ • `inbox:agent:{agentId}` → list of packet IDs (at-least-once
delivery) ▌ • `ack:{packetId}` → hash of `agentId → ack JSON` (idempotent) ▌ •
`index:session:{sessionKey}` → packet IDs by session ▌ ▌ Verification Rule ▌
Every receiving agent MUST verify the Merkle Hash in the Handoff-Header before
accepting work. ▌ Failure to verify = immediate rejection, escalation to
Historian.

▗▖▗▄▄▄▖▗▖ ▗▄▄▖▗▖ ▗▖▗▄▄▖▗▄▄▄▖▗▄▄▖ 8. AUTHENTICATION & ACCESS CONTROL ▌ ▐▌▐▌ ▐▌ ▐▌
▝▚▖▗▛ ▐▌ ▐▌ ▐▌ ▐▌▐▛▀▀▘▐▌ ▐▌ ▝▐▌▛ ▐▛▀▀▘▐▛▀▀▘ ▐▌ ▐▌ ▐▌▐▌ ▐▙▄▄▖▝▚▘ ▐▌ ▐▌ ▐▘ ▐▌

▌ Authentication Levels ▌ ▌
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐ ▌
│ Method │ Pattern │ Enforcement │ Escalation │ ▌
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤ ▌
│ Dual Auth │ JWT + API Key │ Bearer token + │ If both fail: │ ▌ │ │ │ X-API-Key
header │ Orchestrator │ ▌ │ │ │ │ alert + lock │ ▌
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤ ▌
│ Agent Auth Guard │ Validate agentId │ agentId, type: │ Invalidated = │ ▌ │ │ &
capabilities │ 'agent', roles │ immediate kill │ ▌
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤ ▌
│ Rate Limiting │ Per-agent caps │ Max 100 msg/min │ Breach = │ ▌ │ │ │ burst
limit 20 │ HITL review │ ▌
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤ ▌
│ Gateway CORS │ Whitelist only │ lockdown to │ Open wildcard │ ▌ │ │ │ specific
origins │ = high-risk │ ▌
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘ ▌
▌ Role-based Access Control ▌ ▌ SUPER_ADMIN – Governance Tenets, kill switch,
orchestrator command override. ▌ ADMIN – Agent lane freeze/thaw, budget cap
changes, HITL overrides. ▌ DEVELOPER – Standard agent creation, tool calls, but
no system-level changes.

▗▖▗▄▄▄▖▗▖ ▗▄▄▖▗▖ ▗▖▗▄▄▖▗▄▄▄▖▗▄▄▖ 9. SECURITY & SANDBOX CONTROLS ▌ ▐▌▐▌ ▐▌ ▐▌
▝▚▖▗▛ ▐▌ ▐▌ ▐▌ ▐▌▐▛▀▀▘▐▌ ▐▌ ▝▐▌▛ ▐▛▀▀▘▐▛▀▀▘ ▐▌ ▐▌ ▐▌▐▌ ▐▙▄▄▖▝▚▘ ▐▌ ▐▌ ▐▘ ▐▌

▌ • Disposable Runtimes – Docker / E2B sandbox mandatory. No host execution
without ▌ explicit, dual-signed HITL. ▌ • Lateral Lock – Cross-lane namespace
isolation. Failure in one lane cannot ▌ cascade to another. ▌ • Node-Level
Isolation – Hardware sensor checks; GPU thermal gating. ▌ • Synthetics Labelling
– All AI media labeled with "Synthetic" watermark. Removal triggers ▌ immediate
kill. ▌ • Budget Sentinel – Hard script monitoring spend. If limit hit, all
agent lanes stop.

▗▖▗▄▄▄▖▗▖ ▗▄▄▖▗▖ ▗▖▗▄▄▖▗▄▄▄▖▗▄▄▖ 10. GOVERNANCE DIAGRAMS & VISUAL FLOWS ▌ ▐▌▐▌
▐▌ ▐▌ ▝▚▖▗▛ ▐▌ ▐▌ ▐▌ ▐▌▐▛▀▀▘▐▌ ▐▌ ▝▐▌▛ ▐▛▀▀▘▐▛▀▀▘ ▐▌ ▐▌ ▐▌▐▌ ▐▙▄▄▖▝▚▘ ▐▌ ▐▌ ▐▘
▐▌

▌ [1] HIGH-LEVEL SYSTEM ARCHITECTURE ▌ ▌
┌──────────────────────────────────────────────────────────────────────────────────┐
▌ │ HUMAN INTERFACE LAYER │ ▌ │ ┌──────────────┐ ┌──────────────┐
┌──────────────┐ ┌──────────────┐ │ ▌ │ │ Super Admin │ │ Admin │ │ Developer │
│ Operator │ │ ▌ │ │ (HITL Gate) │ │ (Lane Mgmt) │ │ (Agent User) │ │
(Monitoring) │ │ ▌ │ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
└──────┬───────┘ │ ▌
└──────────┼──────────────────┼──────────────────┼──────────────────┼───────────┘
▌ │ │ │ │ ▌ ▼ ▼ ▼ ▼ ▌
┌──────────────────────────────────────────────────────────────────────────────────┐
▌ │ ORCHESTRATOR / AGENCY HUB │ ▌ │ ┌──────────────┐ ┌──────────────┐
┌──────────────┐ ┌──────────────┐ │ ▌ │ │ Loop Breaker │ │ Budget Sent │ │
Merkle Sync │ │ HITL Gate │ │ ▌ │ │ (>50stop) │ │ (Hard cap) │ │ (Turn Zero) │ │
(Risk Gate) │ │ ▌ │ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
└──────┬───────┘ │ ▌
└──────────┼──────────────────┼──────────────────┼──────────────────┼───────────┘
▌ │ │ │ │ ▌ ▼ ▼ ▼ ▼ ▌
┌──────────────────────────────────────────────────────────────────────────────────┐
▌ │ AGENT SWARM / FEDERATION LAYER │ ▌ │ ┌──────────────┐ ┌──────────────┐
┌──────────────┐ ┌──────────────┐ │ ▌ │ │ Developer │ │ Historian │ │ Forge
Agent │ │ Researcher │ │ ▌ │ │ Lane │ │ Auditor │ │ Lane │ │ Lane │ │ ▌ │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ │ ▌
└──────────┼──────────────────┼──────────────────┼──────────────────┼───────────┘
▌ │ │ │ │ ▌ ▼ ▼ ▼ ▼ ▌
┌──────────────────────────────────────────────────────────────────────────────────┐
▌ │ INFRASTRUCTURE / MESSAGING │ ▌ │ Redis Pub/Sub ◄────► Handoff Packets v1.1
◄────► Merkle Vault (GitHub) │ ▌
└──────────────────────────────────────────────────────────────────────────────────┘
▌ ▌ ▌ [2] HITL RISK GATE FLOW ▌ ▌ ┌─────────────────┐ ▌ │ Agent Request │ ▌
└───────┬─────────┘ ▌ │ ▌ ▼ ▌ ┌───────────────┐ ▌ │ Risk Analyzer │ ▌ │
(Automated) │ ▌ └───────┬───────┘ ▌ │ ▌
┌─────────────┼─────────────┬───────────────┐ ▌ │ │ │ │ ▌ ▼ ▼ ▼ ▼ ▌ [Risk <0.3]
[Risk 0.3-0.9] [Risk >0.9] [Risk >0.95 + Critical] ▌ │ │ │ │ ▌ ▼ ▼ ▼ ▼ ▌
┌────────┐ ┌─────────────┐ ┌──────────┐ ┌─────────────┐ ▌ │ Auto │ │ HITL Review
│ │ Hard HITL│ │ Full Stop + │ ▌ │ Permit │ │ (Admin Gate)│ │ (Super) │ │
Executive │ ▌ │ │ │ 5 min timeout│ │ │ │ Dual-Sign │ ▌ └────────┘
└─────────────┘ └──────────┘ └─────────────┘ ▌ ▌ ▌ [3] FEDERATION MESSAGE
LIFECYCLE ▌ ▌ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ▌
│ Compose │ ──▶ │ Dispatch │ ──▶ │ Deliver │ ──▶ │ Acknowledge│ ▌ │ Message │ │
(Redis PS) │ │ (Agent │ │ (Idempotent│ ▌ │ │ │ / WS │ │ Inbox) │ │ Ack) │ ▌
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ ▌ │ │ │ │ ▌
gateDecision: tenantId, agentId: at-least-once ack stored in ▌ allow/deny
sessionKey, inbox list `ack:{pid}` ▌ validation workflowId ▌ ▌ ▌ [4] AGENT
LIFECYCLE DIAGRAM ▌ ▌ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
┌──────────┐ ▌ │ │ │ │ │ │ │ │ │ │ ▌ │ NEW │────▶│ TURN ZERO│────▶│PROVISION
│────▶│ EXECUTE │────▶│ RETIRE │ ▌ │ │ │ SYNC │ │ (Lane) │ │ │ │ │ ▌
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ ▌ │ │ │ │ │ ▌ ▼
▼ ▼ ▼ ▼ ▌
┌──────────────────────────────────────────────────────────────────────────────────┐
▌ │ Registration: │ Merkle Sync: │ Lateral Lock: │ Handoff/Work: │ Deregister: │
▌ │ MCP Registry │ GitHub Vault │ Namespaced │ Status Ledger │ Credentials │ ▌ │
Dual Auth │ Root Compare │ Budget Caps │ Logging │ Revoked │ ▌
└──────────────────────────────────────────────────────────────────────────────────┘
▌ ▌ ▌
─────────────────────────────────────────────────────────────────────────────────────────────────
▌ DOCUMENT METADATA ▌
─────────────────────────────────────────────────────────────────────────────────────────────────
▌ ▌ Generated By: OpenCode (Claude / Anthropic interface) ▌ Source Files:
TNF_GOVERNANCE_TENETS.md, AGENT_STATUS_LEDGER.md, AGENT_TARGETED_HANDOFF_V1.md,
▌ LIVING_STATE.md, FEDERATED_INTELLIGENCE_SYNTHESIS.md,
FEDERATION_IMPROVEMENTS.md, ▌ AGENT_COMMUNICATION_PROTOCOL_SETUP_REPORT.md,
AGENT_COMMUNICATION_ARCHITECTURE.md ▌ Classification: [CLASS:PRIME]
[STATUS:LOCKED] ▌ Version: v2.0 - Comprehensive Synthesis ▌ ▌
─────────────────────────────────────────────────────────────────────────────────────────────────
