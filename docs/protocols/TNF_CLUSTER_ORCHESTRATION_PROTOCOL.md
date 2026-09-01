`[CLUSTER_BINDING: SYNTHESIS]` `[CLASS:PRIME] [STATUS:PENDING]`
`[DOC_AUDIT_BACKFILL:2026-07-14]` — header restored for Gate 3 compliance;
reclassify on next vetting pass.

# 🕸️ TNF Cluster Orchestration Protocol

**Status:** ACTIVE **Scope:** System-Wide Cluster Orchestration **Location:**
/The-New-Fuse/docs/protocols/

This manual expands the TNF Core Architecture into actionable, distinct
Clusters. It defines agent assignments, execution directives, inbox/outbox
handoffs, and long-tail project tracking to ensure all AI agents and traditional
enterprise tools orchestrate together in a logically cohesive whole.

---

## 1. Cluster: Scouting & Acquisition (The Intake)

**Role:** The vanguard of information gathering. This department constantly
surveys external environments for new data, tools, and trends.

- **Agent Requirements:** `Scout Agents`, `Web Scrapers`, `API Listeners`.
- **Execution Directives:**
  - Monitor predefined YouTube playlists, RSS feeds, and Github repositories.
  - Execute the **Capture Phase** of the Distill-and-Purge Protocol.
  - Download raw verbatim data (e.g., transcripts) without analyzing or
    summarizing it.
- **Inbox (Receivables):** Target lists, URL watchlists, API keys for external
  services.
- **Outbox (Handoffs):** Raw verbatim text files routed directly to the
  `MemPalace Router`.
- **Traditional Tooling Integration:** Enterprise RSS readers, automated
  webhooks, Zapier/n8n funnels triggering Scout Agents.

---

## 2. Cluster: the Library & Archives (The Librarians)

**Role:** The curators of deep memory. They organize, categorize, and preserve
information for long-time horizons, ensuring the "Raw Truth" is never lost.

- **Agent Requirements:** `Librarian Agents`, `Chronology Specialists`,
  `Vector Database Managers`.
- **Execution Directives:**
  - Manage the **MemPalace Spatial Architecture** (Wings/Halls/Rooms).
  - Maintain the `MASTER_CHRONOLOGICAL_INDEX.md` and ensure absolute
    chronological integrity (preventing alphabetical drift).
  - Link Executable Intelligence Artifacts back to their verbatim origins (The
    Attribution Overrule).
- **Inbox (Receivables):** Raw data from the Scouting Cluster; Distilled
  artifacts from Engineering.
- **Outbox (Handoffs):** Clean, categorized RAG vaults; Indexed Wiki entries
  ready for active context loading.
- **Traditional Tooling Integration:** Vector DBs (Chroma/Pinecone), traditional
  SQL databases for index management, enterprise content management systems
  (CMS).

---

## 3. Cluster: Engineering & Forge (The Execution)

**Role:** The builders. They consume raw data and turn it into actionable logic,
code, and system improvements.

- **Agent Requirements:** `Forge Agents`, `Code Distillers`, `QA Testers`.
- **Execution Directives:**
  - Execute the **Cherry-Pick Phase** of the Distill-and-Purge Protocol.
  - Read verbatim data from the Library and extract Procedural, Strategic, and
    Governance components.
  - Compile JIT native code (C++/Rust) based on extracted playbooks.
- **Inbox (Receivables):** Notifications from Librarians that new Raw Data is
  ready for distillation; Bug reports from the Governance Cluster.
- **Outbox (Handoffs):** Executable Intelligence Artifacts (JSON Schema);
  Compiled native binaries.
- **Traditional Tooling Integration:** CI/CD pipelines (GitHub Actions), Docker
  registries, IDE automation (Theia/Cursor/Windsurf).

---

## 4. Cluster: Governance & Operations (The Overseers)

**Role:** The rule enforcers. They audit the system, manage resources, and
ensure all departments adhere to the master tenets.

- **Agent Requirements:** `Protocol Growth Blocker Auditor`,
  `Agent Assignment Director Agent`, `LLM API Runner`.
- **Execution Directives:**
  - Enforce the **Multi-Gate Adoption Protocol** for any new tool or method.
  - Execute the **Purge Phase** of the Distill-and-Purge Protocol (eliminating
    raw data once distillation is verified).
  - Manage LLM API quotas and orchestrate provider failovers.
- **Inbox (Receivables):** Executable Intelligence Artifacts awaiting
  verification; System error logs.
- **Outbox (Handoffs):** Approved protocols published to `/docs/protocols/`;
  Purge commands to the Library.
- **Traditional Tooling Integration:** Enterprise APM tools (Datadog/New Relic),
  centralized logging, access control matrices (RBAC).

---

## 5. Cluster: Connective Journaling (The Historians)

**Role:** The connective tissue of the system. They track the "Long-Tail Story"
and ensure that the "Customer Journey" and "Product Pipeline" are aligned
through rigorous reporting and classification.

- **Agent Requirements:** `Journaling Agents`, `Reviewer Agents`,
  `Tagging/Classification Specialists`, `Librarians`.
- **Specialized Roles for Merkle Traversal:**
  - **Strategic Analyst:** Traverses the
    `Library:Intelligence -> Class:Strategic` branch. Updates
    `TNF_RESOURCE_STRATEGY.md` and identifies architectural shifts.
  - **Procedural Forge:** Traverses the
    `Library:Intelligence -> Class:Procedural` branch. Extracts executable
    payloads into `.skill` files and updates technical implementation docs.
  - **Governance Auditor:** Traverses the
    `Library:Intelligence -> Class:Governance` branch. Updates
    `TNF_GOVERNANCE_TENETS.md` based on failure archaeology.
  - **Librarian:** Manages the **TNF Brain Survival** protocol. Responsible for
    Merkle Tree generation, Git synchronization, and Deep Snapshot vaulting.
- **Execution Directives:**
  - **Post-Conversation Auditing:** Review completed chat sessions (JSON) to
    determine the actual chain of events and extract productive vs.
    counter-productive communication patterns.
  - **Thru-Point Tracking:** Maintain standardized dossiers on critical
    recurring entities (e.g., new LLM model releases: Who, Where, How,
    Differentiation).
  - **Connective Journaling:** Catalog and tag distilled artifacts to ensure
    they are searchable across different time horizons.
  - **Brain Survival:** Execute `brain_sync.sh` to ensure the integrity and
    recoverability of the TNF Brain.

---

## 6. The Unified Orchestration Protocol (The Assembly Line)

To prevent these departments from becoming desperate, siloed entities, TNF
enforces strict **Task Tracing and Handoffs**.

1. **The Unified Ledger:** Every time a file moves from Scouting's Outbox to the
   Library's Inbox, or a Journal is updated, a transaction is recorded in the
   Unified Ledger.
2. **Project Tracing:** Long-tail stories (e.g., "Implement a new AI Voice
   Protocol") are tracked via unique Project IDs. The Scout tags the raw data;
   the Forge Agent tags the compiled code; and the Journaling Agent documents
   the "Through-Points" of the project's evolution.
3. **Traditional Application Bridging:** For tasks that do not require an LLM
   (e.g., scheduled cron jobs moving files, or webhooks triggering a database
   update), TNF utilizes Enterprise-level hard-coded applications. Agents are
   strictly reserved for tasks requiring cognitive reasoning (distillation,
   coding, auditing, journaling), preserving the "Least-Among-Us Barometer."
