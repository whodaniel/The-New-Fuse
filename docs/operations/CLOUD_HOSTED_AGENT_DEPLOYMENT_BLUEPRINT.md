# TNF Cloud-Hosted Agent Deployment Blueprint

> **Status:** Standard Reference Blueprint for Multi-Tenant Cloud-Hosted
> Agents  
> **Target Audience:** Open-Source Contributors, Platform Operators, and
> Integrators  
> **Canonical Implementation:** Cloudflare Edge + GCP Cloud Run Container
> Sandbox

---

## 1. Overview & Architectural Philosophy

When rolling out cloud-hosted agents for external customers, the architecture
must satisfy three non-negotiable constraints:

1. **Scale-to-Zero Economics:** Idle agents must cost $0. Dedicated always-on
   VMs per customer destroy SaaS unit economics.
2. **Strict Multi-Tenant Isolation:** Customer A's memory, prompt context, and
   execution sandbox must be strictly isolated from Customer B.
3. **Denial-of-Wallet Protection:** Agent execution loops must be bounded by
   pre-flight budget envelopes before calling model providers.

To achieve this without incurring massive infrastructure overhead, TNF uses a
**Two-Tier Hybrid Architecture**:

```text
               Customer Ingress (Web, Mobile, Telegram, API)
                                      │
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                     TIER 1: CLOUDFLARE EDGE PLANE                         │
│                                                                           │
│  • Edge Routing & Auth: Validates API keys & tenant headers.              │
│  • Hibernating Durable Objects: Stateful session actor per agent/room.    │
│    (Zero compute charges while waiting for customer input)                │
│  • Cloudflare AI Gateway: Model routing, prompt caching, token quotas.   │
│  • SharedState (D1 + R2): Cryptographic audit receipts for every step.    │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │
              Needs heavy tool execution? (Docker, Playwright, bash)
                                      │
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                   TIER 2: GCP CLOUD RUN CONTAINER SANDBOX                 │
│                                                                           │
│  • Real Linux OS / Container Environment (Node.js 20+, Python, Rust)      │
│  • Headless Browser Automation (Playwright / Chromium)                    │
│  • Scale-to-Zero: Min instances = 0, autoscaling up to concurrency limit  │
│  • Ephemeral disk & network sandboxing per tenant execution               │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Breakdown

### A. Edge Runtime (`cloudflare-openclaw-runtime`)

The edge worker handles ingress and coordinates interactions.

- **Telegram Ingress:** `POST /webhooks/telegram`
- **Customer Agent Ingress:** `POST /v1/agents/invoke` and
  `POST /v1/agents/chat`
  - Accepts:
    `{ "agentId": "...", "tenantId": "...", "prompt": "...", "context": {} }`
  - Automatically deposits an immutable audit receipt into
    `cloudflare-sharedstate`
  - Passes execution downstream to the agent gateway or Cloud Run runner.

### B. SharedState Audit Layer (`cloudflare-sharedstate`)

- Built on Cloudflare D1 (SQLite) and Cloudflare R2 object storage.
- Uses the `ReceiptSequencer` Durable Object to guarantee monotonically
  increasing sequence numbers and transaction integrity across distributed
  swarms.

### C. Containerized Agent Gateway (GCP Cloud Run)

- Defined in
  [`scripts/deployment/Dockerfile.api`](file:///Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/scripts/deployment/Dockerfile.api)
  and
  [`cloudbuild.yaml`](file:///Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse/scripts/deployment/cloudbuild.yaml).
- Configured with `--min-instances 0` and `--max-instances 10` (or higher) to
  scale strictly on demand.

---

## 3. Step-by-Step Deployment

All deployment commands are standardized in `package.json`:

### Step 1: Deploy Edge State and Ingress

```bash
# Deploy the SharedState D1/R2 receipt ledger
pnpm run deploy:cloudflare:sharedstate

# Deploy the Cloud-Hosted Agent Runtime Worker
pnpm run deploy:cloudflare:openclaw

# Deploy Cloudflare Edge Proxies (Relay & API proxies)
pnpm run deploy:cloudflare:proxies
```

### Step 2: Deploy Containerized Backend to GCP Cloud Run

```bash
# Submits Docker build directly to Google Cloud Build and updates Cloud Run
pnpm run deploy:gcp
```

### Step 3: Deploy Frontend to Cloudflare Pages

```bash
# Builds workspace packages, compiles Vite bundle, and uploads dist to Pages
pnpm run deploy:pages
```

---

## 4. Continuous Integration & Self-Hosted Runners

To avoid unexpected bills from GitHub Actions (especially the 10x cost
multiplier on macOS runners), automatic triggers in `.github/workflows/` are
commented out in favor of manual `workflow_dispatch` and self-hosted runners.

To run free, unlimited automated builds on your own Mac or Linux machine:

```bash
# Run the automated runner provisioning script
pnpm run setup:runner
```

This will:

1. Detect your platform (`osx-arm64`, `linux-x64`, etc.).
2. Fetch an active runner token from GitHub CLI `gh`.
3. Download, unpack, and register the runner with label `self-hosted`.
4. Provide instructions to run interactively or as a background service
   (`launchd` / `systemd`).

---

## 5. Standard Customer Invocation Contract

Clients (frontend applications, API integrations, third-party webhooks) invoke
hosted agents using standard JSON:

```bash
curl -X POST https://openclaw-runtime.bizsynth.workers.dev/v1/agents/invoke \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <CUSTOMER_API_KEY>" \
  -H "x-tenant-id: tenant_customer_123" \
  -d '{
    "agentId": "research",
    "prompt": "Analyze market opportunities for Q4",
    "context": {
      "focus": "enterprise"
    }
  }'
```

The response includes:

- `ok`: Execution success flag
- `requestId`: Unique trace identifier
- `tenantId`: Billed entity
- `receipt`: Immutable deposit confirmation in the SharedState ledger
- `gateway`: Execution output or streaming payload
