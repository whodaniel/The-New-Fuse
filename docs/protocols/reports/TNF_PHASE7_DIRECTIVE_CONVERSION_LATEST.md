# TNF Phase 7 Directive Conversion

- Generated: `2026-06-16T02:44:24.498679Z`
- Source Queue: `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/ingestion-runs/ai5-new-may-2026-action-queue.json`
- Total Directives: `689`
- Ready: `0`
- Claimed/Running: `15`
- Verified/Landed: `32`
- Conversion Rate: `4.64%`
- Blocked/Non-dispatchable: `642`

## Tight Loop Batch 001

- Batch ID: `ai5-phase7-batch-001`
- Size: `10`
- Owner: `local-subdirector`
- Objective: `Convert the first top-priority AI5 directives into verified work with evidence.`

1. `critical` `backend-contracts` [AI5] Input Telegram Credentials and Start Bot Service
   - Target: `v2-extracted`
   - Source Hints: `Running bot setup script in terminal`
   - Repo Surface: `packages/protocol-contracts/src/envelope.ts, apps/api/src/controllers/orchestration.controller.ts, apps/api/src/controllers/workspace.controller.ts`
2. `critical` `security-audit` [AI5] Integrate Versa Labs for AI Security Testing
   - Target: `v2-extracted`
   - Source Hints: `AI pipelines`
   - Repo Surface: `scripts/protocols/validate-local-runtime-boundary.cjs, scripts/protocols/validate-cleanroom-boundary.cjs, scripts/security/supabase-rls-audit.cjs`
3. `high` `backend-contracts` [AI5] Implement Agentic RAG by Replacing Fixed Retrieval
   - Target: `v2-extracted`
   - Source Hints: `RAG Pipeline, Agent orchestration module, Search Tool module, Database integration`
   - Repo Surface: `packages/protocol-contracts/src/envelope.ts, apps/api/src/controllers/orchestration.controller.ts, apps/api/src/controllers/workspace.controller.ts`
4. `high` `orchestration-runtime` [AI5] Implement Agent Output Evaluation Based on Business Rules
   - Target: `v2-extracted`
   - Source Hints: `evaluation_suite.py or business_rules_engine.py`
   - Repo Surface: `packages/protocol-contracts/scripts/stress-test-contracts.mjs, scripts/platform-readiness-orchestrator.js, validation-results/post-change-report.json, packages/relay-core/src/redis-relay-bridge.ts`
5. `high` `backend-contracts` [AI5] Integrate Hermes Agent with Messaging Platforms
   - Target: `v2-extracted`
   - Source Hints: `Hermes Agent/Messaging Connectors Module`
   - Repo Surface: `scripts/hermes-gateway-bridge.cjs, scripts/agents/hermes-tnf-a2a-bridge.py, data/mcp.clients/hermes.mcp.json, packages/protocol-contracts/src/envelope.ts`
6. `high` `orchestration-runtime` [AI5] Implement Code Evals for Deterministic Checks
   - Target: `v2-extracted`
   - Source Hints: `eval_suite/deterministic_code_evals.py`
   - Repo Surface: `packages/protocol-contracts/scripts/stress-test-contracts.mjs, scripts/platform-readiness-orchestrator.js, validation-results/post-change-report.json, packages/relay-core/src/redis-relay-bridge.ts`
7. `high` `orchestration-runtime` [AI5] Implement Multi-Step Evaluation for Agent Tool Calls
   - Target: `v2-extracted`
   - Source Hints: `agent_framework/tool_call_evaluator.py`
   - Repo Surface: `packages/protocol-contracts/scripts/stress-test-contracts.mjs, scripts/platform-readiness-orchestrator.js, validation-results/post-change-report.json, packages/relay-core/src/redis-relay-bridge.ts`
8. `high` `orchestration-runtime` [AI5] Integrate New MCP Server with Agent TAR
   - Target: `v2-extracted`
   - Source Hints: `Agent TAR Configuration / Runtime Environment`
   - Repo Surface: `src/mcp/server.ts, src/mcp/enhanced-tnf-mcp-server.ts, src/mcp/complete-api-mcp-server.ts, packages/relay-core/src/redis-relay-bridge.ts`
9. `high` `orchestration-runtime` [AI5] Develop and Integrate Multiple Evaluation Methods
   - Target: `v2-extracted`
   - Source Hints: `Evaluation Framework / Evaluation Scripts`
   - Repo Surface: `packages/protocol-contracts/scripts/stress-test-contracts.mjs, scripts/platform-readiness-orchestrator.js, validation-results/post-change-report.json, packages/relay-core/src/redis-relay-bridge.ts`
10. `high` `backend-contracts` [AI5] Implement LM Judges for Semantic Understanding
   - Target: `v2-extracted`
   - Source Hints: `eval_suite/lm_judges.py`
   - Repo Surface: `packages/protocol-contracts/scripts/stress-test-contracts.mjs, scripts/platform-readiness-orchestrator.js, validation-results/post-change-report.json, packages/protocol-contracts/src/envelope.ts`

## Next Autonomous Command

```bash
python3 scripts/autonomy/phase7_directive_conversion_loop.py --claim-batch --adopt-claimed --batch-size 10
```
