# TNF Master Framework

Generated from repository structure for continuous architecture visibility.

```mermaid
flowchart LR
  subgraph Surface[User Surface]
    Web[apps/frontend]
    Router[React Router + Route Catalog]
    Flow[ReactFlow Workflow UI]
  end
  subgraph Backend[Backend Systems]
    Gateway[apps/api-gateway (NestJS)]
    Core[Core APIs + Services]
    Data[(Postgres + Redis + VectorDB)]
  end
  subgraph Ops[Continuous Assurance]
    CI[GitHub Actions live-link-monitor]
    Audits[Link/Semantic/Auth audits]
    Scorecard[Self-improvement scorecard]
  end
  Web --> Router
  Router --> Gateway
  Flow --> Gateway
  Gateway --> Core
  Core --> Data
  CI --> Audits
  Audits --> Scorecard
  Scorecard --> Web

  subgraph Apps[Detected apps/*]
    app_api[api]
    app_api_gateway[api-gateway]
    app_backend[backend]
    app_chrome_extension[chrome-extension]
    app_extensions[extensions]
    app_frontend[frontend]
    app_mcp_servers[mcp-servers]
    app_relay_server[relay-server]
    app_tauri_desktop[tauri-desktop]
    app_vscode_extension[vscode-extension]
  end
  subgraph Packages[Detected packages/*]
    pkg_@the_new_fuse[@the-new-fuse]
    pkg_a2a_core[a2a-core]
    pkg_a2a_protocol[a2a-protocol]
    pkg_a2a_react[a2a-react]
    pkg_ag_ui_core[ag-ui-core]
    pkg_agent[agent]
    pkg_agent_coordination[agent-coordination]
    pkg_agent_evaluation_framework[agent-evaluation-framework]
    pkg_agentic_rag_search[agentic-rag-search]
    pkg_ai_security_bridge[ai-security-bridge]
    pkg_ap2_protocol[ap2-protocol]
    pkg_api[api]
    pkg_api_client[api-client]
    pkg_api_gateway[api-gateway]
    pkg_api_optimization[api-optimization]
    pkg_api_types[api-types]
    pkg_auth[auth]
    pkg_backend[backend]
    pkg_build_optimization[build-optimization]
    pkg_cache[cache]
    pkg_claude_skills[claude-skills]
    pkg_claw_skills[claw-skills]
    pkg_cli[cli]
    pkg_client[client]
    pkg_common[common]
    pkg_compounding_memory[compounding-memory]
    pkg_contracts[contracts]
    pkg_contracts_legacy[contracts-legacy]
    pkg_control_plane_contracts[control-plane-contracts]
    pkg_core[core]
    pkg_core_auth[core-auth]
    pkg_core_error_handling[core-error-handling]
    pkg_core_monitoring[core-monitoring]
    pkg_core_vector_db[core-vector-db]
    pkg_crypto_agent_framework[crypto-agent-framework]
    pkg_data[data]
    pkg_database[database]
    pkg_debugging[debugging]
    pkg_deployment_core[deployment-core]
    pkg_docs[docs]
    pkg_eslint_config_custom[eslint-config-custom]
    pkg_extension_core[extension-core]
    pkg_extension_system[extension-system]
    pkg_fairtable_adapters[fairtable-adapters]
    pkg_fairtable_components[fairtable-components]
    pkg_fairtable_core[fairtable-core]
    pkg_fairtable_utils[fairtable-utils]
    pkg_feature_suggestions[feature-suggestions]
    pkg_feature_tracker[feature-tracker]
    pkg_features[features]
    pkg_gemini_browser_skill[gemini-browser-skill]
    pkg_google_sheets_mcp_server[google-sheets-mcp-server]
    pkg_governance_gate[governance-gate]
    pkg_hardware_bridge[hardware-bridge]
    pkg_hooks[hooks]
    pkg_infrastructure[infrastructure]
    pkg_integration_tests[integration-tests]
    pkg_job_queue[job-queue]
    pkg_jules_integration[jules-integration]
    pkg_jules_skill[jules-skill]
    pkg_logger[logger]
    pkg_lpm_native[lpm-native]
    pkg_mcp_cloud_redis_bridge[mcp-cloud-redis-bridge]
    pkg_mcp_concordance_server[mcp-concordance-server]
    pkg_mcp_core[mcp-core]
    pkg_mcp_skills_server[mcp-skills-server]
    pkg_mcp_tar_bridge[mcp-tar-bridge]
    pkg_messaging_bridge[messaging-bridge]
    pkg_n8n_workflows[n8n-workflows]
    pkg_port_management[port-management]
    pkg_prompt_templating[prompt-templating]
    pkg_proto_definitions[proto-definitions]
    pkg_protocol_contracts[protocol-contracts]
    pkg_relay_core[relay-core]
    pkg_resource_registry[resource-registry]
    pkg_security[security]
    pkg_shared[shared]
    pkg_shared_utils[shared-utils]
    pkg_sync_core[sync-core]
    pkg_telegram_bot_service[telegram-bot-service]
    pkg_test_utils[test-utils]
    pkg_testing[testing]
    pkg_tnf_browser[tnf-browser]
    pkg_tnf_cli[tnf-cli]
    pkg_tnf_core[tnf-core]
    pkg_tnf_note_taking[tnf-note-taking]
    pkg_tnf_orchestrator_go[tnf-orchestrator-go]
    pkg_types[types]
    pkg_ui_consolidated[ui-consolidated]
    pkg_utils[utils]
    pkg_web_scraping[web-scraping]
    pkg_websocket[websocket]
    pkg_websocket_infrastructure[websocket-infrastructure]
    pkg_workflow_engine[workflow-engine]
  end
  subgraph Workflows[Detected .github/workflows]
    wf_agent_registry_ubiquity_gate_yml[agent-registry-ubiquity-gate.yml]
    wf_build_electron_yml[build-electron.yml]
    wf_build_yml[build.yml]
    wf_ci_build_yml[ci-build.yml]
    wf_claude_code_review_yml[claude-code-review.yml]
    wf_claude_yml[claude.yml]
    wf_deploy_yml[deploy.yml]
    wf_framework_consciousness_nightly_yml[framework-consciousness-nightly.yml]
    wf_framework_master_graph_monitor_yml[framework-master-graph-monitor.yml]
    wf_frontload_nightly_yml[frontload-nightly.yml]
    wf_gcp_rollout_yml[gcp-rollout.yml]
    wf_github_history_timeline_sync_yml[github-history-timeline-sync.yml]
    wf_gitlink_integrity_yml[gitlink-integrity.yml]
    wf_honest_failure_gate_yml[honest-failure-gate.yml]
    wf_integration_train_gate_yml[integration-train-gate.yml]
    wf_keyword_mentions_monitor_yml[keyword-mentions-monitor.yml]
    wf_live_link_monitor_yml[live-link-monitor.yml]
    wf_module_fixer_yml[module-fixer.yml]
    wf_openapi_drift_gate_yml[openapi-drift-gate.yml]
    wf_pi_bridge_gate_yml[pi-bridge-gate.yml]
    wf_poker_qa_yml[poker-qa.yml]
    wf_pr_automation_yml[pr-automation.yml]
    wf_privacy_security_gate_yml[privacy-security-gate.yml]
    wf_protocol_schema_gate_yml[protocol-schema-gate.yml]
    wf_quality_yml[quality.yml]
    wf_release_readiness_yml[release-readiness.yml]
    wf_repo_boundary_gate_yml[repo-boundary-gate.yml]
    wf_repo_sync_yml[repo-sync.yml]
    wf_route_surface_parity_gate_yml[route-surface-parity-gate.yml]
    wf_skills_governance_gate_yml[skills-governance-gate.yml]
    wf_tauri_desktop_dmg_yml[tauri-desktop-dmg.yml]
    wf_tauri_desktop_qa_yml[tauri-desktop-qa.yml]
    wf_test_yml[test.yml]
    wf_traits_intelligence_nightly_yml[traits-intelligence-nightly.yml]
  end
  Web -.maps.-> app_api
  Web -.maps.-> app_api_gateway
  Web -.maps.-> app_backend
  Web -.maps.-> app_chrome_extension
  Web -.maps.-> app_extensions
  Web -.maps.-> app_frontend
  Web -.maps.-> app_mcp_servers
  Web -.maps.-> app_relay_server
  Web -.maps.-> app_tauri_desktop
  Web -.maps.-> app_vscode_extension
  Gateway -.depends on.-> pkg_@the_new_fuse
  Gateway -.depends on.-> pkg_a2a_core
  Gateway -.depends on.-> pkg_a2a_protocol
  Gateway -.depends on.-> pkg_a2a_react
  Gateway -.depends on.-> pkg_ag_ui_core
  Gateway -.depends on.-> pkg_agent
  Gateway -.depends on.-> pkg_agent_coordination
  Gateway -.depends on.-> pkg_agent_evaluation_framework
  Gateway -.depends on.-> pkg_agentic_rag_search
  Gateway -.depends on.-> pkg_ai_security_bridge
  Gateway -.depends on.-> pkg_ap2_protocol
  Gateway -.depends on.-> pkg_api
  Gateway -.depends on.-> pkg_api_client
  Gateway -.depends on.-> pkg_api_gateway
  Gateway -.depends on.-> pkg_api_optimization
  Gateway -.depends on.-> pkg_api_types
  Gateway -.depends on.-> pkg_auth
  Gateway -.depends on.-> pkg_backend
  Gateway -.depends on.-> pkg_build_optimization
  Gateway -.depends on.-> pkg_cache
  Gateway -.depends on.-> pkg_claude_skills
  Gateway -.depends on.-> pkg_claw_skills
  Gateway -.depends on.-> pkg_cli
  Gateway -.depends on.-> pkg_client
  Gateway -.depends on.-> pkg_common
  Gateway -.depends on.-> pkg_compounding_memory
  Gateway -.depends on.-> pkg_contracts
  Gateway -.depends on.-> pkg_contracts_legacy
  Gateway -.depends on.-> pkg_control_plane_contracts
  Gateway -.depends on.-> pkg_core
  Gateway -.depends on.-> pkg_core_auth
  Gateway -.depends on.-> pkg_core_error_handling
  Gateway -.depends on.-> pkg_core_monitoring
  Gateway -.depends on.-> pkg_core_vector_db
  Gateway -.depends on.-> pkg_crypto_agent_framework
  Gateway -.depends on.-> pkg_data
  Gateway -.depends on.-> pkg_database
  Gateway -.depends on.-> pkg_debugging
  Gateway -.depends on.-> pkg_deployment_core
  Gateway -.depends on.-> pkg_docs
  Gateway -.depends on.-> pkg_eslint_config_custom
  Gateway -.depends on.-> pkg_extension_core
  Gateway -.depends on.-> pkg_extension_system
  Gateway -.depends on.-> pkg_fairtable_adapters
  Gateway -.depends on.-> pkg_fairtable_components
  Gateway -.depends on.-> pkg_fairtable_core
  Gateway -.depends on.-> pkg_fairtable_utils
  Gateway -.depends on.-> pkg_feature_suggestions
  Gateway -.depends on.-> pkg_feature_tracker
  Gateway -.depends on.-> pkg_features
  Gateway -.depends on.-> pkg_gemini_browser_skill
  Gateway -.depends on.-> pkg_google_sheets_mcp_server
  Gateway -.depends on.-> pkg_governance_gate
  Gateway -.depends on.-> pkg_hardware_bridge
  Gateway -.depends on.-> pkg_hooks
  Gateway -.depends on.-> pkg_infrastructure
  Gateway -.depends on.-> pkg_integration_tests
  Gateway -.depends on.-> pkg_job_queue
  Gateway -.depends on.-> pkg_jules_integration
  Gateway -.depends on.-> pkg_jules_skill
  Gateway -.depends on.-> pkg_logger
  Gateway -.depends on.-> pkg_lpm_native
  Gateway -.depends on.-> pkg_mcp_cloud_redis_bridge
  Gateway -.depends on.-> pkg_mcp_concordance_server
  Gateway -.depends on.-> pkg_mcp_core
  Gateway -.depends on.-> pkg_mcp_skills_server
  Gateway -.depends on.-> pkg_mcp_tar_bridge
  Gateway -.depends on.-> pkg_messaging_bridge
  Gateway -.depends on.-> pkg_n8n_workflows
  Gateway -.depends on.-> pkg_port_management
  Gateway -.depends on.-> pkg_prompt_templating
  Gateway -.depends on.-> pkg_proto_definitions
  Gateway -.depends on.-> pkg_protocol_contracts
  Gateway -.depends on.-> pkg_relay_core
  Gateway -.depends on.-> pkg_resource_registry
  Gateway -.depends on.-> pkg_security
  Gateway -.depends on.-> pkg_shared
  Gateway -.depends on.-> pkg_shared_utils
  Gateway -.depends on.-> pkg_sync_core
  Gateway -.depends on.-> pkg_telegram_bot_service
  Gateway -.depends on.-> pkg_test_utils
  Gateway -.depends on.-> pkg_testing
  Gateway -.depends on.-> pkg_tnf_browser
  Gateway -.depends on.-> pkg_tnf_cli
  Gateway -.depends on.-> pkg_tnf_core
  Gateway -.depends on.-> pkg_tnf_note_taking
  Gateway -.depends on.-> pkg_tnf_orchestrator_go
  Gateway -.depends on.-> pkg_types
  Gateway -.depends on.-> pkg_ui_consolidated
  Gateway -.depends on.-> pkg_utils
  Gateway -.depends on.-> pkg_web_scraping
  Gateway -.depends on.-> pkg_websocket
  Gateway -.depends on.-> pkg_websocket_infrastructure
  Gateway -.depends on.-> pkg_workflow_engine
  wf_agent_registry_ubiquity_gate_yml --> Audits
  wf_build_electron_yml --> Audits
  wf_build_yml --> Audits
  wf_ci_build_yml --> Audits
  wf_claude_code_review_yml --> Audits
  wf_claude_yml --> Audits
  wf_deploy_yml --> Audits
  wf_framework_consciousness_nightly_yml --> Audits
  wf_framework_master_graph_monitor_yml --> Audits
  wf_frontload_nightly_yml --> Audits
  wf_gcp_rollout_yml --> Audits
  wf_github_history_timeline_sync_yml --> Audits
  wf_gitlink_integrity_yml --> Audits
  wf_honest_failure_gate_yml --> Audits
  wf_integration_train_gate_yml --> Audits
  wf_keyword_mentions_monitor_yml --> Audits
  wf_live_link_monitor_yml --> Audits
  wf_module_fixer_yml --> Audits
  wf_openapi_drift_gate_yml --> Audits
  wf_pi_bridge_gate_yml --> Audits
  wf_poker_qa_yml --> Audits
  wf_pr_automation_yml --> Audits
  wf_privacy_security_gate_yml --> Audits
  wf_protocol_schema_gate_yml --> Audits
  wf_quality_yml --> Audits
  wf_release_readiness_yml --> Audits
  wf_repo_boundary_gate_yml --> Audits
  wf_repo_sync_yml --> Audits
  wf_route_surface_parity_gate_yml --> Audits
  wf_skills_governance_gate_yml --> Audits
  wf_tauri_desktop_dmg_yml --> Audits
  wf_tauri_desktop_qa_yml --> Audits
  wf_test_yml --> Audits
  wf_traits_intelligence_nightly_yml --> Audits
```
