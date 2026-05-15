# PII Classification Audit (Sanitized)

Generated: 2026-05-07T18:31:02.684Z

- Scope: files matched against identity markers (`<owner_full_name>`,
  `Daniel Who`, `whodaniel`, `bizsynth`, personal-provider email domains, local
  absolute paths).
- Files reviewed: 78
- public-allowed: 63
- internal-only: 15
- private-restrict: 0

## private-restrict

## internal-only

- apps/api/src/controllers/**tests**/workspace.controller.spec.ts
  - reasons: contains bizsynth identity token
  - action: keep in internal/private docs set; avoid mirroring to public docs
    repos
- apps/api/src/controllers/workspace.controller.ts
  - reasons: contains private narrative project label
  - action: keep in internal/private docs set; avoid mirroring to public docs
    repos
- apps/api/src/modules/unified-ledger/unified-ledger.service.ts
  - reasons: contains private narrative project label; contains public GitHub
    handle/repository reference; contains bizsynth identity token
  - action: keep in internal/private docs set; avoid mirroring to public docs
    repos
- apps/api/src/services/auth.service.spec.ts
  - reasons: contains bizsynth identity token
  - action: keep in internal/private docs set; avoid mirroring to public docs
    repos
- docs/\_archive/2024-deployment-reports/DOCKER_HUB_DEPLOYMENT.md
  - reasons: contains public GitHub handle/repository reference; contains
    bizsynth identity token
  - action: keep in internal/private docs set; avoid mirroring to public docs
    repos
- docs/HERMES_FEATURE_PARITY_PLAN.md
  - reasons: contains absolute local filesystem path
  - action: keep in internal/private docs set; avoid mirroring to public docs
    repos
- docs/hermes_tnf_env.sh
  - reasons: contains absolute local filesystem path
  - action: keep in internal/private docs set; avoid mirroring to public docs
    repos
- docs/library/COURSEFORGE_MANUSCRIPT_MAP_2026-05-05.md
  - reasons: contains absolute local filesystem path; contains public GitHub
    handle/repository reference
  - action: keep in internal/private docs set; avoid mirroring to public docs
    repos
- docs/library/LIBRARIAN_INTEGRITY_CHECKPOINT_2026-05-05.md
  - reasons: contains private narrative project label; contains public GitHub
    handle/repository reference
  - action: keep in internal/private docs set; avoid mirroring to public docs
    repos
- docs/library/LIBRARIAN_RESUME_MAP.md
  - reasons: contains private narrative project label; contains absolute local
    filesystem path; contains public GitHub handle/repository reference
  - action: keep in internal/private docs set; avoid mirroring to public docs
    repos
- docs/operations/TNF_AUDIT_DIRECTOR_HANDOFF.md
  - reasons: contains absolute local filesystem path
  - action: keep in internal/private docs set; avoid mirroring to public docs
    repos
- docs/roadmaps/TNF_FEDERATED_CONTROL_PLANE_OUTLINE_2026-03-18.md
  - reasons: contains bizsynth identity token
  - action: keep in internal/private docs set; avoid mirroring to public docs
    repos
- docs/roadmaps/TNF_FEDERATED_ORCHESTRATION_GTM_PLAN_2026-03-18.md
  - reasons: contains bizsynth identity token
  - action: keep in internal/private docs set; avoid mirroring to public docs
    repos
- docs/TNF_HERMES_FEATURE_PARITY_REPORT.md
  - reasons: contains absolute local filesystem path
  - action: keep in internal/private docs set; avoid mirroring to public docs
    repos
- docs/TNF_HERMES_FEATURE_PARITY_SUMMARY.md
  - reasons: contains absolute local filesystem path
  - action: keep in internal/private docs set; avoid mirroring to public docs
    repos

## public-allowed

- apps/api/src/agents/implementer.service.ts
  - reasons: contains public GitHub handle/repository reference
- apps/api/src/modules/unified-ledger/unified-ledger.controller.spec.ts
  - reasons: contains only low-risk public references
- apps/api/src/modules/unified-ledger/unified-ledger.service.spec.ts
  - reasons: contains public GitHub handle/repository reference
- docs/\_archive/2024-pre-restructure/migration-docs/SETUP_INSTRUCTIONS.md
  - reasons: contains public GitHub handle/repository reference
- docs/\_archive/redundant-near/2026-03-24/security/SECURITY-FIXES-SUMMARY.md
  - reasons: contains public GitHub handle/repository reference
- docs/\_archives/2024-migration/CLEANUP_COMPLETE_REPORT.md
  - reasons: contains public GitHub handle/repository reference
- docs/agents-and-protocols/AGENT_DEVELOPMENT_GUIDE.md
  - reasons: contains public GitHub handle/repository reference
- docs/agents/\_archive/development-guide.md
  - reasons: contains public GitHub handle/repository reference
- docs/agents/AGENT_COMMUNICATION_PROTOCOL_SETUP_REPORT.md
  - reasons: contains public GitHub handle/repository reference
- docs/API_DOCUMENTATION_README.md
  - reasons: contains public GitHub handle/repository reference
- docs/architecture/MONOREPO_ARCHITECTURE.md
  - reasons: contains public GitHub handle/repository reference
- docs/archive/comprehensive_improvement_report.md
  - reasons: contains public GitHub handle/repository reference
- docs/archive/DEPLOYMENT_STATUS.md
  - reasons: contains public GitHub handle/repository reference
- docs/archive/deployment/DEPLOY_API_FIX.md
  - reasons: contains public GitHub handle/repository reference
- docs/archive/EMERGENCY_FIXES_COMPLETE.md
  - reasons: contains public GitHub handle/repository reference
- docs/archive/FINAL_VICTORY_REPORT.md
  - reasons: contains public GitHub handle/repository reference
- docs/archive/HANDOFF_NEXT_SESSION.md
  - reasons: contains public GitHub handle/repository reference
- docs/archive/jules/JULES_DELEGATION_SUMMARY.md
  - reasons: contains public GitHub handle/repository reference
- docs/archive/PR_MERGE_DECISIONS.md
  - reasons: contains public GitHub handle/repository reference
- docs/archive/PULL_REQUEST_REVIEW.md
  - reasons: contains public GitHub handle/repository reference
- docs/archive/PUSH_INSTRUCTIONS.md
  - reasons: contains public GitHub handle/repository reference
- docs/archive/session-reports/EXECUTION_SUMMARY.md
  - reasons: contains public GitHub handle/repository reference
- docs/audits/CLOUD_RUNTIME_TNF_SERVICE_INSPECTION_2026-03-09.md
  - reasons: contains public GitHub handle/repository reference
- docs/core/SECURITY.md
  - reasons: contains only low-risk public references
- docs/deployment/DEPLOYMENT_STATUS.md
  - reasons: contains public GitHub handle/repository reference
- docs/deployment/DEPLOYMENT.md
  - reasons: contains public GitHub handle/repository reference
- docs/deployment/MANUAL_SETUP_REQUIRED.md
  - reasons: contains public GitHub handle/repository reference
- docs/deployment/CLOUD_RUNTIME_DEPLOYMENT_GUIDE.md
  - reasons: contains public GitHub handle/repository reference
- docs/deployment/CLOUD_RUNTIME_DEPLOYMENT_INSTRUCTIONS.md
  - reasons: contains public GitHub handle/repository reference
- docs/deployment/CLOUD_RUNTIME_FAILURE_ANALYSIS.md
  - reasons: contains public GitHub handle/repository reference
- docs/development/BACKGROUND_JOBS_IMPLEMENTATION_SUMMARY.md
  - reasons: contains only low-risk public references
- docs/development/guide.md
  - reasons: contains public GitHub handle/repository reference
- docs/FRONTEND_PRODUCTION_READINESS_STATUS.md
  - reasons: contains public GitHub handle/repository reference
- docs/getting-started/\_archive/installation.md
  - reasons: contains public GitHub handle/repository reference
- docs/guides/setup-instructions.md
  - reasons: contains public GitHub handle/repository reference
- docs/IMPLEMENTATION_COMPLETE_JULES_INTEGRATION.md
  - reasons: contains public GitHub handle/repository reference
- docs/integrations/API_DOCUMENTATION_SUMMARY.md
  - reasons: contains public GitHub handle/repository reference
- docs/integrations/github-timeline-sync.md
  - reasons: contains only low-risk public references
- docs/JULES_AGENT_INTEGRATION.md
  - reasons: contains public GitHub handle/repository reference
- docs/JULES_AUTONOMOUS_LOOP.md
  - reasons: contains public GitHub handle/repository reference
- docs/JULES_PR_FOLLOWUP_PLAYBOOK.md
  - reasons: contains public GitHub handle/repository reference
- docs/JULES_SESSIONS_SUMMARY.md
  - reasons: contains public GitHub handle/repository reference
- docs/operations/tnf-self-improvement-run-log.md
  - reasons: contains only low-risk public references
- docs/project-management/DELIVERABLES.md
  - reasons: contains public GitHub handle/repository reference
- docs/project-management/PR_CREATION_GUIDE.md
  - reasons: contains public GitHub handle/repository reference
- docs/protocols/storage/tnf-virtual-library-surface-map.json
  - reasons: contains public GitHub handle/repository reference
- docs/README.md
  - reasons: contains public GitHub handle/repository reference
- docs/reels_purchase_report.md
  - reasons: contains public GitHub handle/repository reference
- docs/REPO_SEPARATION.md
  - reasons: contains public GitHub handle/repository reference
- docs/security/PRIVACY_HISTORY_AUDIT_2026-05-06.md
  - reasons: contains only low-risk public references
- docs/security/SECURITY_INCIDENT_RESPONSE.md
  - reasons: contains public GitHub handle/repository reference
- docs/security/SECURITY-CLEANUP-SUMMARY.md
  - reasons: contains public GitHub handle/repository reference
- docs/SKIDEANCER_DEPLOYMENT.md
  - reasons: contains public GitHub handle/repository reference
- docs/specifications/\_archive/MCP_TROUBLESHOOTING.md
  - reasons: contains public GitHub handle/repository reference
- docs/STRATEGIC_ANTHROPIC_INTEGRATION_PLAN.md
  - reasons: contains public GitHub handle/repository reference
- docs/THEIA_502_FIX.md
  - reasons: contains public GitHub handle/repository reference
- docs/THEIA_INTEGRATION_SUMMARY.md
  - reasons: contains public GitHub handle/repository reference
- docs/THEIA_ISOLATION_STRATEGY.md
  - reasons: contains public GitHub handle/repository reference
- docs/THEIA_CLOUD_RUNTIME_FIX.md
  - reasons: contains public GitHub handle/repository reference
- docs/TNF_LEGACY_AND_CURRENT_STATE_SYNTHESIS.md
  - reasons: contains public GitHub handle/repository reference
- docs/TNF_LEGACY_TO_PRESENT_SYNTHESIS_v1.0.md
  - reasons: contains public GitHub handle/repository reference
- docs/TNF_MASTER_MANIFESTO.md
  - reasons: contains public GitHub handle/repository reference
- docs/WEBSITE_QA_TESTING_LOG.md
  - reasons: contains public GitHub handle/repository reference
