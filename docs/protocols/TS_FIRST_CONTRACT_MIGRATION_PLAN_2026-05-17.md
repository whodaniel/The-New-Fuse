# TS-First Contract Migration Plan (Aligned with TSGo + LLVM)

Date: 2026-05-17
Owner: TNF Core Platform
Status: Proposed for immediate execution

## 1. Decision
TNF should move to a TS-first contract system where:

1. TypeScript schemas are the canonical source of truth.
2. JSON Schema is generated from TS schemas.
3. Pydantic models are generated from JSON Schema for Python services.
4. Hand-authored Pydantic models are treated as transitional or legacy unless explicitly exempted.

This keeps architecture aligned with TSGo adoption and avoids dual-maintained schema systems.

## 2. Why This Is Needed
Current state shows split contract authority:

1. Protocol schema governance already exists in JSON Schema + AJV gates.
2. Core TS protocol surfaces already use Zod and TS types.
3. Relay still advertises a `pydantic-v1.0` protocol token, but runtime adapter wiring is not present.
4. Python services and crypto bridge still hold local/manual Pydantic definitions.

Net effect: strong local validation, weak global contract spine.

## 3. Principles for This Migration
Apply these hard rules:

1. Single contract authority: TS schemas only.
2. Generated artifacts only across language boundaries.
3. No runtime trust of upstream payloads without validation.
4. No manual edits in generated Python models.
5. CI fails on contract drift.

## 4. Target Architecture
Create a dedicated package for runtime contracts:

1. New package: `packages/protocol-contracts` (name can be adjusted, but must be non-blockchain and non-legacy).
2. Canonical source:
   - `src/<domain>/*.schema.ts` using Zod 4.
   - `src/<domain>/index.ts` exporting schemas and `z.infer` types.
3. Generated JSON schemas:
   - `generated/jsonschema/<domain>/*.schema.json`
   - Produced from `z.toJSONSchema()`.
4. Generated Python models:
   - `generated/python/<domain>/*.py`
   - Produced from JSON schemas using `datamodel-codegen` with Pydantic v2 output.
5. Optional Go artifacts for `packages/tnf-orchestrator-go`:
   - `generated/go/<domain>/*.go`
   - Generated from JSON Schema (optional in phase 1, recommended in phase 3).

## 5. Scope and Domain Order
Migrate in this order:

1. Domain A (protocol-critical): TWIP + SGP envelope/payload contracts.
2. Domain B (active Python service): ADK gateway request/response models.
3. Domain C (active Python service): web-scraping request/response models.
4. Domain D (crypto bridge): `7.0_crypto_operations_division` schemas currently imported by crypto executor/registry/tests.
5. Domain E (relay contract): remove or implement true `pydantic-v1.0` path in relay.

## 6. Execution Phases
### Phase 0 (1-2 days): Freeze and Baseline
Deliverables:

1. Mark `packages/extension-system/src/agents/pydantic/**` as legacy schema bank in docs.
2. Record active runtime importers and treat all other files as non-authoritative.
3. Add migration tracker file under `docs/protocols/reports/`.

Acceptance criteria:

1. Explicit list of authoritative domains and consumers exists.
2. Team agrees on non-goals and deprecation timeline.

### Phase 1 (3-5 days): Contract Package Bootstrap
Deliverables:

1. Scaffold `packages/protocol-contracts` with:
   - `build`, `type-check`, `type-check:tsgo`, `generate:jsonschema`, `generate:python`, `check:drift`.
2. Add first canonical schemas for TWIP/SGP + ADK + scraping.
3. Generate JSON Schema artifacts and Pydantic v2 artifacts.
4. Add root scripts:
   - `contracts:generate`
   - `contracts:check`
   - `contracts:check:drift`

Acceptance criteria:

1. Generated JSON Schema is deterministic.
2. Generated Python models import cleanly in target services.
3. CI can fail when generated files are stale.

### Phase 2 (5-8 days): Consumer Migration
Deliverables:

1. `apps/adk-gateway/main.py` switches to generated models.
2. `packages/web-scraping/python/server.py` switches to generated models.
3. `packages/crypto-agent-framework` imports generated models instead of hand-managed extension-system Pydantic files.
4. Add tests to validate generated-model parsing for all migrated endpoints.

Acceptance criteria:

1. No behavior regression in existing API tests.
2. No manual schema divergence in migrated services.

### Phase 3 (3-5 days): Relay and Governance Hardening
Deliverables:

1. Decide one of:
   - Implement true relay translation support for `pydantic-v1.0`.
   - Remove `pydantic-v1.0` from relay protocol type list until implemented.
2. Link `validate:protocol-schemas` to generated JSON Schema artifacts (no manual editing).
3. Add “no manual edits under generated/” lint/check rule.

Acceptance criteria:

1. Relay protocol list reflects runtime reality.
2. Contract gates are generated-source-driven.

## 7. TSGo and LLVM Positioning
TSGo and LLVM should influence this plan in specific ways:

1. TSGo:
   - Used for fast type-check loops in contract package (`npx tsgo --noEmit`).
   - `tsc` remains fallback until TSGo is primary across CI images.
2. LLVM:
   - Not used for schema generation.
   - Reserved for runtime-critical execution paths where profiling proves benefit.
3. Go runtime:
   - `packages/tnf-orchestrator-go` should consume generated schemas/models, not invent parallel contract formats.

## 8. CI and Drift Gates
Add contract gates to CI and local checks:

1. `contracts:generate` regenerates schema artifacts.
2. `contracts:check:drift` fails if git diff appears after generation.
3. `contracts:check` validates generated JSON schema shape and fixture conformance.
4. Existing `validate:protocol-schemas` must pass after generation.

Recommended gate order:

1. `pnpm contracts:generate`
2. `pnpm contracts:check:drift`
3. `pnpm validate:protocol-schemas`
4. Service-level tests (ADK, scraping, crypto)

## 9. Risks and Mitigations
Risk: Mixed Zod major versions.
Mitigation: Pin contract package to Zod 4 and isolate conversion logic there.

Risk: Generated Python names differ from legacy names.
Mitigation: Add compatibility wrappers or migration aliases for one release window.

Risk: Relay token mismatch (`pydantic-v1.0` declared but unsupported).
Mitigation: Explicitly choose implement-or-remove in phase 3.

Risk: Crypto framework path assumptions to extension-system files.
Mitigation: Route imports through generated artifacts package path and deprecate direct extension-system filesystem coupling.

## 10. Concrete Immediate Actions (Next 72 Hours)
1. Create `packages/protocol-contracts` scaffold and scripts.
2. Implement TWIP/SGP canonical schemas in Zod 4.
3. Generate JSON Schema artifacts and compare with current protocol schemas.
4. Implement ADK + scraping schemas and swap those two services first.
5. Add CI drift gate.

## 11. Definition of Done
Migration is done when:

1. TS schemas are the only authored contract source for active domains.
2. JSON schema + Python model artifacts are generated and drift-protected.
3. Relay protocol declarations match implemented adapters.
4. Legacy extension-system Pydantic tree is no longer required by runtime paths.

