# The New Fuse: Market Dominance Roadmap (Project "Overkill")

**Status:** DRAFT  
**Target:** Global Market Dominance  
**Competitors:** OpenClaw (Moltbot), MoltBook  
**Philosophy:** "Good enough is NOT good enough."

---

## 1. Executive Summary & Strategy

We have analyzed the recent surge of **OpenClaw** (a local, CLI-based autonomous
agent) and **MoltBook** (a Reddit-style social network for agents).

**The Verification:** The New Fuse (TNF) _already_ possesses 95% of these
capabilities:

- **Local Autonomy:** Our `UnifiedAgent` + `clawd-bot-integration` (Local
  Browser/Shell control).
- **Social Coordination:** Our `agent-discovery-protocol` (DACC) +
  `packages/resource-registry`.
- **UI/UX:** Our `apps/frontend` with `Three.js` and `Framer Motion`.

**The Gap:** Our capabilities are hidden behind "Enterprise" complexity.
OpenClaw wins on _simplicity_ (CLI Wizard). MoltBook wins on _social
visibility_.

**The Winning Strategy: "FuseOS"** (The Unified Command Center) We will package
our superior technology into a **Single Glassmorphic Operating System** that
feels like the future. We will not just "match" them; we will assimilate their
best features into our ecosystem.

---

## 2. Departmental Action Plan (Delegateable Tasks)

Assign the following tasks to specific subagents to execute in parallel.

### 🎨 Frontend Department (UI/UX)

**Objective:** Create the "Golden Moment" of presentation. Shift from "Admin
Panel" to "Sci-Fi Command Center".

- [ ] **Task F-1: The "Holographic" Dashboard (SystemObservatory)**
  - **Target:** `apps/frontend/src/pages/SystemObservatory.tsx`
  - **Directive:** Upgrade the 2D node graph to a **3D Interactive Galaxy**
    using `@react-three/fiber` (already installed). Agents should be pulsating
    stars; connections should be neon lasers.
  - **Style:** Dark mode, Glassmorphism (backdrop-blur-xl), Neon accents
    (`index.css` variables).
  - **Reference:** Iron Man's JARVIS interface.

- [ ] **Task F-2: The "Agent Social" Feed (MoltBook Killer)**
  - **Target:** `apps/frontend/src/pages/Community/CommunityHub.tsx`
  - **Directive:** Transform this from a static page to a **Live Agent Feed**.
  - **Features:**
    - "Sub-Fuse" Channels (Topic-based).
    - Agent Upvotes (Karma system).
    - "Agent-Only" mode (Humans can view, only Agents can post).

- [ ] **Task F-3: The "Fusion" Onboarding Wizard (OpenClaw Killer)**
  - **Target:** `apps/frontend/src/pages/OnboardingFlow.tsx`
  - **Directive:** Create a step-by-step, highly animated "Initialization"
    sequence.
  - **Steps:** "Scanning System" -> "Detecting Agents" -> "Establishing Secure
    Link" -> "Ready".
  - **Visuals:** Terminal-like typing effects combined with glass cards.

### 🧠 Backend & Protocol Department

**Objective:** Activation of the `agent-discovery-protocol` (DACC).

- [ ] **Task B-1: The "Karma" Protocol**
  - **Target:** `packages/backend/src/modules/agency` & `packages/database`
  - **Directive:** Add `reputationScore` to the `Agent` schema. Implement logic
    where successful tasks = +Karma.
  - **Goal:** Gamify the agent experience to rival MoltBook's social validation.

- [ ] **Task B-2: Local Device Bridge (OpenClaw Assimilation)**
  - **Target:** `apps/electron-desktop` + `skills/clawd-bot-integration`
  - **Directive:** Ensure the "Local Bridge" is enabled by default. Securely
    expose shell commands to the Unified Agent via the `Sandbox` interface so
    the agent can _control the user's machine_ (safely) just like OpenClaw.

### 🛠️ Platform & CLI Department

**Objective:** Developer Experience (DevEx) Dominance.

- [ ] **Task C-1: The `fuse init` Wizard**
  - **Target:** `packages/cli` (or root scripts)
  - **Directive:** Create an interactive CLI tool using `prompts` or `inquirer`.
  - **Flow:**
    1. "Welcome to The New Fuse."
    2. "Select your Persona (Developer / Creator / Enterprise)."
    3. "Auto-detecting API Keys..."
    4. "Deploying Agents..."
  - **Goal:** Match OpenClaw's `onboard` command but make it feel "Premium".

- [ ] **Task C-2: Daemon Management**
  - **Target:** `scripts/daemon-manager.ts`
  - **Directive:** Create a script to run the Agent Loop in the background
    (`pm2` or `systemd` wrapper), identical to `openclaw gateway start`.

---

## 3. Implementation Logic (Form Factors)

To rival the competition's form factors, we will unify ours:

| Structure     | Competitor Implementation     | **The New Fuse Implementation**                   |
| :------------ | :---------------------------- | :------------------------------------------------ |
| **CLI**       | `openclaw` (Go/Node)          | `tnf` (Unified Node CLI wrapper for all packages) |
| **Web UI**    | MoltBook (Next.js Social App) | `FuseOS` (Vite + React Glassmorphic Dashboard)    |
| **Local App** | Moltbot (Basic Local Server)  | `Electron Desktop` (Full Native App + Menubar)    |

---

## 4. Immediate Next Steps

1.  **Run Protocol Alignment:** `/alignment` to ensure all agents are aware of
    this roadmap.
2.  **Dispatch Frontend Agent:** "Take Task F-1 and F-3. creating the
    Glassmorphic Onboarding Flow."
3.  **Dispatch Backend Agent:** "Take Task B-1. Implement the Agent Reputation
    System in the DB."

_Prepared by: Antigravity_ _Date: 2026-02-02_
