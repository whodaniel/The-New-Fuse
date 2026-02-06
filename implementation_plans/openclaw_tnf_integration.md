# OpenClaw + TNF Integration Plan (Antigravity Integration Complete)

## Executive Summary

**Good news**: TNF has already assimilated the core ClawdBot protocols! The
integration exists in `packages/agent/` with:

- `ClawdEngine` - Central controller for skill orchestration
- `ClawdScheduler` - Distributed scheduling via Bull/Redis
- `ClawdSandbox` - Secure execution environment
- `ClawdAssimilationService` - Skill management

**Antigravity Integration Status**: ✅ COMPLETE (2026-02-04)

- OAuth credentials synced from `~/.gemini/oauth_creds.json`
- Default model: `google-antigravity/gemini-2.5-pro`
- Session isolation enabled (`per-channel-peer`)
- Telegram group allowlist configured
- Two agents configured: `main` + `tnf-bridge`

This document focuses on **security hardening updates** based on recent
OpenClaw/MoltBook news and preparing TNF for incoming AI agents.

---

## Background: OpenClaw History & Name Changes

| Date     | Name     | Reason                                               |
| -------- | -------- | ---------------------------------------------------- |
| Nov 2025 | Clawdbot | Initial launch by Peter Steinberger                  |
| Dec 2025 | Moltbot  | Trademark dispute with Anthropic (Claude similarity) |
| Jan 2026 | OpenClaw | Permanent rebrand for distinct identity              |

**MoltBook**: A separate Reddit-style social platform by Matt Schlicht designed
for AI agents to interact. It has attracted millions of AI agent registrations,
primarily running OpenClaw.

---

## Existing TNF Integration (Already Done!)

### What We Have in `packages/agent/`

| Component                | File                                         | Purpose                                         |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| ClawdEngine              | `src/implementations/ClawdEngine.ts`         | Central coordinator, delegates to Cloud Sandbox |
| ClawdScheduler           | `src/implementations/ClawdScheduler.ts`      | Distributed scheduling via Bull/Redis           |
| ClawdSandbox             | `src/implementations/ClawdSandbox.ts`        | Secure execution with bridged APIs              |
| ClawdAssimilationService | `src/services/ClawdAssimilationService.ts`   | Skill parsing and management                    |
| RemoteSandboxClient      | `src/implementations/RemoteSandboxClient.ts` | WebSocket/JSON-RPC to Cloud Sandbox             |

### Architecture (Current)

```
┌─────────────────────────────────────────────────────────────┐
│                      TNF Backend                             │
│              (AgentExecutionProcessor)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │ Bull/Redis Queue
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      ClawdEngine                             │
│   • Skill Orchestration                                      │
│   • Proactive Scheduling                                     │
│   • API Bridging                                             │
└─────────────────────────┬───────────────────────────────────┘
                          │ WebSocket/JSON-RPC
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Cloud Sandbox                              │
│   (apps/cloud-sandbox)                                       │
│   • Browser Automation (Playwright)                          │
│   • Shell Execution                                          │
│   • File Operations                                          │
│   • RBAC & Audit Logging                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Vulnerabilities & Applied Mitigations

### Critical Vulnerabilities Discovered in OpenClaw Ecosystem

| CVE                 | Severity | Description                                 | TNF Status                |
| ------------------- | -------- | ------------------------------------------- | ------------------------- |
| CVE-2026-25253      | CRITICAL | RCE via attacker-controlled web content     | ✅ Cloud Sandbox isolates |
| Prompt Injection    | HIGH     | External content manipulates agent behavior | ⚠️ Need hardening         |
| Credential Exposure | HIGH     | API keys exposed via unsecured endpoints    | ✅ Using env vars         |
| Malicious Skills    | MEDIUM   | Community skills may contain malware        | ⚠️ Need vetting           |

### Applied Mitigations in TNF

#### 1. Cloud Sandbox Isolation ✅

Our `apps/cloud-sandbox` already provides:

- Containerized execution environment
- RBAC enforcement
- Audit logging
- Resource quotas

#### 2. Secure API Bridging ✅

```typescript
// ClawdEngine bridges API calls to remote sandbox
browser: {
  navigate: (url) => this.sandboxClient.callTool('browser_navigate', { url }),
  // ... remote execution
},
shell: {
  exec: (cmd) => this.sandboxClient.callTool('run_command', { command: cmd }),
}
```

#### 3. Distributed Scheduling Security ✅

```typescript
// ClawdScheduler fallback behavior
this.scheduler = new ClawdScheduler({
  redisUrl: process.env.REDIS_URL, // Secure env var
  nodeId: this.nodeId,
});
```

---

## Security Hardening Tasks

### High Priority

- [ ] **Add skill signature verification** - Validate skills before execution
- [ ] **Implement rate limiting** on Cloud Sandbox endpoints
- [ ] **Add prompt injection detection** in ClawdEngine
- [ ] **Audit existing skills** in `~/.clawd/skills/` for malicious patterns

**Status Update:** Skill signature verification enforcement added via:
`OPENCLAW_SKILL_SIGNATURE_REQUIRED` and `OPENCLAW_SKILL_SIGNING_KEY`.

### Medium Priority

- [x] **Add credential isolation** - Session scope set to `per-channel-peer` ✅
- [ ] **Implement sandbox timeout enforcement**
- [ ] **Add network egress filtering** in Cloud Sandbox

### Low Priority

- [ ] **Rename Clawd → OpenClaw** across codebase for consistency
- [ ] **Update SKILL.md** documentation with security guidelines
- [ ] **Add MoltBook integration** (optional for testing)

---

## MoltBook Integration Considerations

### Potential Uses for TNF Dogfooding

1. **Agent Social Testing**: Test TNF agents interacting on MoltBook
2. **Protocol Validation**: Validate A2A protocols against real-world usage
3. **Community Insights**: Learn from AI agent behaviors

### Security Concerns

⚠️ **MoltBook has reported credential exposure issues**:

- Exposed human API keys
- Unencrypted credential storage
- Prompt injection vulnerabilities

**Recommendation**: Use **dedicated test accounts only** if integrating with
MoltBook.

---

## Next Steps

### Immediate Actions

1. **Run security audit** on existing ClawdEngine implementation
2. **Add signature verification** for skill files
3. **Document security guidelines** for skill authors

### Phase 2: OpenClaw Name Update

The project renamed from ClawdBot → OpenClaw. Consider updating:

- File names (ClawdEngine → OpenClawEngine)
- Config keys (CLAWD_SANDBOX_URL → OPENCLAW_SANDBOX_URL)
- Documentation references

This is **low priority** as the existing code works correctly.

### Phase 3: Dogfooding

Once security hardening is complete:

1. Run TNF agents through our ClawdEngine
2. Test multi-agent orchestration via ClawdScheduler
3. Validate Cloud Sandbox under production-like load

---

## References

- **Existing Integration**: `/packages/agent/CLAWD_INTEGRATION_SUMMARY.md`
- **Skill Template**: `/.agent/skills/clawd-bot-integration/SKILL.md`
- **Cloud Sandbox**: `/apps/cloud-sandbox/`
- [OpenClaw Docs](https://docs.openclaw.ai)
- [OpenClaw Security Guide](https://docs.openclaw.ai/gateway/security)

---

_Updated: 2026-02-03_ _Author: Antigravity AI Agent_
