--
-- PostgreSQL database dump
--

\restrict GFtaXNP4ZJPGiXPXkg58cwlhgdVSt1pg7BvIUTroOEYcqb3TvWVgC02fi6bJrgO

-- Dumped from database version 17.9 (Debian 17.9-1.pgdg13+1)
-- Dumped by pg_dump version 17.6 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: artifacts; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE ai_assets_marketplace.artifacts DISABLE TRIGGER ALL;

COPY ai_assets_marketplace.artifacts (filename, content_type, content_text, content_bytea, uploaded_at) FROM stdin;
\.


ALTER TABLE ai_assets_marketplace.artifacts ENABLE TRIGGER ALL;

--
-- Data for Name: categories; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ai_assets_marketplace.categories DISABLE TRIGGER ALL;

COPY ai_assets_marketplace.categories (id, name, description) FROM stdin;
\.


ALTER TABLE ai_assets_marketplace.categories ENABLE TRIGGER ALL;

--
-- Data for Name: crawl_runs; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ai_assets_marketplace.crawl_runs DISABLE TRIGGER ALL;

COPY ai_assets_marketplace.crawl_runs (id, status, started_at, finished_at, stats, error) FROM stdin;
\.


ALTER TABLE ai_assets_marketplace.crawl_runs ENABLE TRIGGER ALL;

--
-- Data for Name: mcp_categories; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ai_assets_marketplace.mcp_categories DISABLE TRIGGER ALL;

COPY ai_assets_marketplace.mcp_categories (id, name, description) FROM stdin;
\.


ALTER TABLE ai_assets_marketplace.mcp_categories ENABLE TRIGGER ALL;

--
-- Data for Name: mcp_links; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ai_assets_marketplace.mcp_links DISABLE TRIGGER ALL;

COPY ai_assets_marketplace.mcp_links (id, source_id, link_url, anchor) FROM stdin;
\.


ALTER TABLE ai_assets_marketplace.mcp_links ENABLE TRIGGER ALL;

--
-- Data for Name: mcp_servers; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ai_assets_marketplace.mcp_servers DISABLE TRIGGER ALL;

COPY ai_assets_marketplace.mcp_servers (id, source_id, server_name, server_url, repo_url, description, tags, maintainer, stars, license, transport, created_at) FROM stdin;
\.


ALTER TABLE ai_assets_marketplace.mcp_servers ENABLE TRIGGER ALL;

--
-- Data for Name: mcp_sources; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ai_assets_marketplace.mcp_sources DISABLE TRIGGER ALL;

COPY ai_assets_marketplace.mcp_sources (id, category_id, name, url, title, brief, source_type, created_at, updated_at) FROM stdin;
\.


ALTER TABLE ai_assets_marketplace.mcp_sources ENABLE TRIGGER ALL;

--
-- Data for Name: prompts; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ai_assets_marketplace.prompts DISABLE TRIGGER ALL;

COPY ai_assets_marketplace.prompts (id, source_id, title, prompt_text, prompt_hash, url, license, tags, created_at) FROM stdin;
\.


ALTER TABLE ai_assets_marketplace.prompts ENABLE TRIGGER ALL;

--
-- Data for Name: skill_marketplace_entries; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ai_assets_marketplace.skill_marketplace_entries DISABLE TRIGGER ALL;

COPY ai_assets_marketplace.skill_marketplace_entries (id, source, entry_url, title, brief, tags, discovered_at) FROM stdin;
\.


ALTER TABLE ai_assets_marketplace.skill_marketplace_entries ENABLE TRIGGER ALL;

--
-- Data for Name: source_links; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ai_assets_marketplace.source_links DISABLE TRIGGER ALL;

COPY ai_assets_marketplace.source_links (id, source_id, link_url, anchor) FROM stdin;
\.


ALTER TABLE ai_assets_marketplace.source_links ENABLE TRIGGER ALL;

--
-- Data for Name: sources; Type: TABLE DATA; Schema: ai_assets_marketplace; Owner: postgres
--

ALTER TABLE ai_assets_marketplace.sources DISABLE TRIGGER ALL;

COPY ai_assets_marketplace.sources (id, category_id, name, url, title, brief, source_type, created_at, updated_at) FROM stdin;
\.


ALTER TABLE ai_assets_marketplace.sources ENABLE TRIGGER ALL;

--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: postgres
--

ALTER TABLE drizzle.__drizzle_migrations DISABLE TRIGGER ALL;

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	80c35c76d37d8886e2e4af7162f7dca4e0077cc8f5ad6673b9bbe5d2b4f9c289	1767766635708
2	99e9a580bae2a01ca12fee1c7edafffcc18f3c31261c35e8bc05def4a9d962d2	1767891830851
3	beb1f3a3de224c30e32f3128c9794fdd24836553211df0fdad00355f889a0ba6	1772382500000
4	5678c1959f0e105f4a23dff6ada8287601b4cf51cb09b887ec2ed59f41631e4c	1772865000000
5	9ecf16df55e224448c78c01f32b7d5f23b17f10db5dfbeda3963afbfddf3abeb	1772866800000
6	627297ea9c42d41f5bb0f8a83ff58888d1be39dda8cceea74ede5ab63cffbaa4	1772956800000
7	2e9551deb81720f6f16840cff06b121c2b4050113f127011f7b27293bd24a2b8	1773855000000
8	0222f750037210390665f0e61da03aab310af2154614548f91d44ff55477eceb	1774004000000
9	0e20d03b7a13f84d690d2a0df70798a7850e293e76c766ddb66405c989f39e8b	1774006913835
\.


ALTER TABLE drizzle.__drizzle_migrations ENABLE TRIGGER ALL;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.users DISABLE TRIGGER ALL;

COPY public.users (id, email, username, name, created_at, updated_at, hashed_password, role, roles, is_active, last_login, preferences, refresh_token, deleted_at, email_verified, wallet_address, verification_token, verification_expires) FROM stdin;
\.


ALTER TABLE public.users ENABLE TRIGGER ALL;

--
-- Data for Name: agents; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.agents DISABLE TRIGGER ALL;

COPY public.agents (id, name, type, status, description, system_prompt, config, capabilities, provider, user_id, created_at, updated_at, deleted_at) FROM stdin;
\.


ALTER TABLE public.agents ENABLE TRIGGER ALL;

--
-- Data for Name: agent_registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.agent_registrations DISABLE TRIGGER ALL;

COPY public.agent_registrations (id, agent_id, encrypted_auth_token, registration_data, verification_status, onboarding_status, onboarding_progress, heartbeat_interval, is_online, last_heartbeat, metadata, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.agent_registrations ENABLE TRIGGER ALL;

--
-- Data for Name: agent_capability_registry; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.agent_capability_registry DISABLE TRIGGER ALL;

COPY public.agent_capability_registry (id, registration_id, capability_name, capability_type, version, description, parameters, verification_status, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.agent_capability_registry ENABLE TRIGGER ALL;

--
-- Data for Name: agent_directory_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.agent_directory_entries DISABLE TRIGGER ALL;

COPY public.agent_directory_entries (id, agent_id, display_name, description, category, tags, is_public, is_verified, featured, rating, usage_count, last_active_at, searchable_data, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.agent_directory_entries ENABLE TRIGGER ALL;

--
-- Data for Name: workspaces; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.workspaces DISABLE TRIGGER ALL;

COPY public.workspaces (id, name, description, owner_id, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.workspaces ENABLE TRIGGER ALL;

--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.projects DISABLE TRIGGER ALL;

COPY public.projects (id, name, description, workspace_id, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.projects ENABLE TRIGGER ALL;

--
-- Data for Name: agent_memories; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.agent_memories DISABLE TRIGGER ALL;

COPY public.agent_memories (id, key, value, agent_id, project_id, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.agent_memories ENABLE TRIGGER ALL;

--
-- Data for Name: agent_metadata; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.agent_metadata DISABLE TRIGGER ALL;

COPY public.agent_metadata (id, agent_id, metadata, version, config) FROM stdin;
\.


ALTER TABLE public.agent_metadata ENABLE TRIGGER ALL;

--
-- Data for Name: agent_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.agent_metrics DISABLE TRIGGER ALL;

COPY public.agent_metrics (id, registration_id, metric_type, value, unit, tags, "timestamp") FROM stdin;
\.


ALTER TABLE public.agent_metrics ENABLE TRIGGER ALL;

--
-- Data for Name: agent_nfts; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.agent_nfts DISABLE TRIGGER ALL;

COPY public.agent_nfts (id, agent_id, token_id, contract_address, smart_account_address, is_fractionalized, total_shares, metadata_uri, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.agent_nfts ENABLE TRIGGER ALL;

--
-- Data for Name: agent_onboarding_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.agent_onboarding_events DISABLE TRIGGER ALL;

COPY public.agent_onboarding_events (id, registration_id, event_type, message, event_data, "timestamp") FROM stdin;
\.


ALTER TABLE public.agent_onboarding_events ENABLE TRIGGER ALL;

--
-- Data for Name: agent_prompt_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.agent_prompt_versions DISABLE TRIGGER ALL;

COPY public.agent_prompt_versions (id, agent_id, version_number, instruction, exemplars, performance_metrics, mass_stage, created_at) FROM stdin;
\.


ALTER TABLE public.agent_prompt_versions ENABLE TRIGGER ALL;

--
-- Data for Name: ai_insights; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.ai_insights DISABLE TRIGGER ALL;

COPY public.ai_insights (id, organization_id, insight_type, title, description, severity, data, recommendations, is_acknowledged, acknowledged_at, acknowledged_by_id, expires_at, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.ai_insights ENABLE TRIGGER ALL;

--
-- Data for Name: auth_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_events DISABLE TRIGGER ALL;

COPY public.auth_events (id, user_id, type, details, created_at) FROM stdin;
\.


ALTER TABLE public.auth_events ENABLE TRIGGER ALL;

--
-- Data for Name: auth_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_sessions DISABLE TRIGGER ALL;

COPY public.auth_sessions (id, user_id, token, expires_at, created_at) FROM stdin;
\.


ALTER TABLE public.auth_sessions ENABLE TRIGGER ALL;

--
-- Data for Name: business_analytics; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.business_analytics DISABLE TRIGGER ALL;

COPY public.business_analytics (id, organization_id, metric_type, metric_name, metric_value, dimensions, period_start, period_end, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.business_analytics ENABLE TRIGGER ALL;

--
-- Data for Name: business_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.business_events DISABLE TRIGGER ALL;

COPY public.business_events (id, type, source, organization_id, user_id, correlation_id, data, metadata, processing_status, retry_count, created_at, updated_at, processed_at) FROM stdin;
\.


ALTER TABLE public.business_events ENABLE TRIGGER ALL;

--
-- Data for Name: business_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.business_metrics DISABLE TRIGGER ALL;

COPY public.business_metrics (id, name, value, tags, created_at) FROM stdin;
\.


ALTER TABLE public.business_metrics ENABLE TRIGGER ALL;

--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.chat_messages DISABLE TRIGGER ALL;

COPY public.chat_messages (id, user_id, role, content, expires_at, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.chat_messages ENABLE TRIGGER ALL;

--
-- Data for Name: chat_rooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.chat_rooms DISABLE TRIGGER ALL;

COPY public.chat_rooms (id, name, description, topic, purpose, type, is_private, is_ephemeral, max_participants, owner_id, settings, metadata, created_at, updated_at, last_message_at, expires_at, is_active, deleted_at) FROM stdin;
\.


ALTER TABLE public.chat_rooms ENABLE TRIGGER ALL;

--
-- Data for Name: chat_room_participants; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.chat_room_participants DISABLE TRIGGER ALL;

COPY public.chat_room_participants (id, room_id, user_id, role, joined_at, last_read_at, metadata) FROM stdin;
\.


ALTER TABLE public.chat_room_participants ENABLE TRIGGER ALL;

--
-- Data for Name: chats; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.chats DISABLE TRIGGER ALL;

COPY public.chats (id, title, agent_id, user_id, created_at, updated_at, deleted_at) FROM stdin;
\.


ALTER TABLE public.chats ENABLE TRIGGER ALL;

--
-- Data for Name: code_execution_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.code_execution_sessions DISABLE TRIGGER ALL;

COPY public.code_execution_sessions (id, name, description, owner_id, collaborators, is_public, files, environment, created_at, updated_at, expires_at, storage_usage) FROM stdin;
\.


ALTER TABLE public.code_execution_sessions ENABLE TRIGGER ALL;

--
-- Data for Name: code_execution_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.code_execution_usage DISABLE TRIGGER ALL;

COPY public.code_execution_usage (id, agent_id, client_id, execution_id, language, code, result, output, error, execution_time, memory_usage, compute_units, cost, tier, environment, status, created_at, completed_at) FROM stdin;
\.


ALTER TABLE public.code_execution_usage ENABLE TRIGGER ALL;

--
-- Data for Name: error_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.error_logs DISABLE TRIGGER ALL;

COPY public.error_logs (id, message, stack, context, created_at) FROM stdin;
\.


ALTER TABLE public.error_logs ENABLE TRIGGER ALL;

--
-- Data for Name: fractional_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.fractional_shares DISABLE TRIGGER ALL;

COPY public.fractional_shares (id, agent_nft_id, owner_address, share_amount, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.fractional_shares ENABLE TRIGGER ALL;

--
-- Data for Name: jules_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.jules_configs DISABLE TRIGGER ALL;

COPY public.jules_configs (id, user_id, config_type, api_key_encrypted, webhook_secret, preferences, created_at, updated_at, deleted_at) FROM stdin;
\.


ALTER TABLE public.jules_configs ENABLE TRIGGER ALL;

--
-- Data for Name: pipelines; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.pipelines DISABLE TRIGGER ALL;

COPY public.pipelines (id, name, description, configuration, status, user_id, agent_id, created_at, updated_at, deleted_at) FROM stdin;
\.


ALTER TABLE public.pipelines ENABLE TRIGGER ALL;

--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.tasks DISABLE TRIGGER ALL;

COPY public.tasks (id, title, description, type, status, priority, data, result, error, start_time, end_time, pipeline_id, assigned_to_id, user_id, created_at, updated_at, deleted_at, metadata) FROM stdin;
\.


ALTER TABLE public.tasks ENABLE TRIGGER ALL;

--
-- Data for Name: jules_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.jules_sessions DISABLE TRIGGER ALL;

COPY public.jules_sessions (id, jules_session_id, task_id, delegated_by_agent_id, user_id, status, metadata, result, error, started_at, completed_at, created_at, updated_at, deleted_at) FROM stdin;
\.


ALTER TABLE public.jules_sessions ENABLE TRIGGER ALL;

--
-- Data for Name: jules_usage_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.jules_usage_logs DISABLE TRIGGER ALL;

COPY public.jules_usage_logs (id, session_id, user_id, usage_type, metrics, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.jules_usage_logs ENABLE TRIGGER ALL;

--
-- Data for Name: llm_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.llm_configs DISABLE TRIGGER ALL;

COPY public.llm_configs (id, name, provider, model_name, api_key, api_endpoint, is_custom, enabled, priority, retry_config, created_at, updated_at, deleted_at) FROM stdin;
\.


ALTER TABLE public.llm_configs ENABLE TRIGGER ALL;

--
-- Data for Name: login_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.login_attempts DISABLE TRIGGER ALL;

COPY public.login_attempts (id, user_id, ip_address, successful, created_at) FROM stdin;
\.


ALTER TABLE public.login_attempts ENABLE TRIGGER ALL;

--
-- Data for Name: marketplace_catalog_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.marketplace_catalog_items DISABLE TRIGGER ALL;

COPY public.marketplace_catalog_items (id, slug, name, description, kind, category, tags, capabilities, rating, total_runs, success_rate, price_per_run, status, publication_status, launch_url, avatar_url, created_by, created_at, updated_at) FROM stdin;
exp-open-audio-deck	open-audio-deck	Open Audio Deck	Spotify-style Audius client for streaming trending tracks and searching the Open Audio catalog.	experience	music	["music", "audius", "streaming"]	["music_streaming", "playlist_discovery", "audius_search"]	4.9	4200	99.2	0	online	published	https://open-audio-deck-production.thenewfuse.com	\N	tnf-core	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
exp-merkaba-lab	merkaba-lab	Merkaba Lab	PoolTogether-inspired arcade lab with rotating jackpot physics, sidepot strategy, and replay loops.	experience	pooltogether	["pooltogether", "merkaba", "lab"]	["pool_variations", "sidepot_strategy", "jackpot_cycles"]	4.8	13370	98.4	0	online	published	https://ai-arcade.xyz/#merkaba-lab	\N	tnf-core	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
exp-community-neon-kart	community-neon-kart	Community Neon Kart	User-created mini-game spotlight with rotating daily tracks and leaderboard ladders.	experience	community	["community", "ugc", "games"]	["ugc_game", "daily_rotations", "leaderboards"]	4.5	7310	96.9	0	online	review	https://ai-arcade.xyz/#community-neon-kart	\N	community	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
wf-compliance-handoff	compliance-handoff-workflow	Compliance Handoff Workflow	Workflow primitive for multi-step policy checks, red-team gates, and final review handoff.	workflow	automation	["workflow", "compliance", "automation"]	["multi_step_validation", "review_gate", "handoff"]	4.7	5210	97.8	0.04	online	published	\N	\N	tnf-core	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
mcp-filesystem	filesystem-mcp-server	Filesystem MCP Server	Provides secure filesystem access for AI agents through MCP.	mcp_server	developer-tools	["mcp", "filesystem", "server"]	["file_read", "file_write", "directory_listing"]	4.6	8921	98.1	0	online	published	\N	\N	mcp-foundation	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
mcp-github	github-mcp-server	GitHub MCP Server	MCP server for repository operations, issue triage, and pull request workflows.	mcp_server	developer-tools	["mcp", "github", "server"]	["repo_read", "repo_write", "pr_management", "issue_triage"]	4.8	11230	98.7	0.01	online	published	\N	\N	tnf-core	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
skill-code-review-sentinel	code-review-sentinel	Code Review Sentinel	Security-aware review skill for pull requests with architecture and test quality checks.	skill	development	["skill", "code-review", "security"]	["code_review", "security_analysis", "test_gap_detection"]	4.7	9800	97.3	0.06	online	published	\N	\N	tnf-core	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
prompt-growth-brief	growth-brief-prompt-pack	Growth Brief Prompt Pack	Prompt primitive for GTM planning, launch copy iteration, and experimentation loops.	prompt	productivity	["prompt", "growth", "marketing"]	["brief_generation", "copy_iteration", "experiment_planning"]	4.5	7020	96.1	0.02	online	published	\N	\N	community	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
template-ops-director	ops-director-template	Ops Director Template	Ready-to-clone agent template for task intake, delegation, and multi-agent operations.	agent_template	automation	["template", "operations", "automation"]	["task_routing", "delegation", "execution_tracking"]	4.8	4330	98.9	0.08	online	published	\N	\N	tnf-core	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
agent-tnf-director	tnf-director	TNF Director	Master orchestrator for multi-agent swarms and complex workflow delegation.	agent	automation	["agent", "orchestration", "workflow"]	["orchestration", "delegation", "swarm_management"]	5	3200	99.1	0.25	online	published	\N	\N	tnf-core	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
model-qwen3-coder-next	qwen3-coder-next	Qwen3 Coder Next	High-speed coding and repository analysis primitive for developer workflows.	model	code	["model", "coder", "code"]	["code_generation", "refactoring", "repository_analysis"]	4.9	15420	98.2	0.05	online	published	\N	\N	tnf-core	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
model-deepseek-r1	deepseek-r1	DeepSeek R1	Reasoning-first primitive for complex planning and advanced mathematical proofing.	model	analytics	["model", "reasoning", "math"]	["reasoning", "complex_planning", "proof_verification"]	4.8	8750	97.5	0.1	online	published	\N	\N	tnf-core	2026-03-23 10:56:12.812	2026-03-23 10:56:12.812
\.


ALTER TABLE public.marketplace_catalog_items ENABLE TRIGGER ALL;

--
-- Data for Name: marketplace_listings; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.marketplace_listings DISABLE TRIGGER ALL;

COPY public.marketplace_listings (id, agent_nft_id, listing_id, seller, share_amount, price_per_share, total_price, status, expires_at, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.marketplace_listings ENABLE TRIGGER ALL;

--
-- Data for Name: marketplace_offers; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.marketplace_offers DISABLE TRIGGER ALL;

COPY public.marketplace_offers (id, listing_id, buyer, share_amount, offer_price, status, expires_at, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.marketplace_offers ENABLE TRIGGER ALL;

--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.messages DISABLE TRIGGER ALL;

COPY public.messages (id, content, role, sender_id, sender_name, agent_id, chat_id, room_id, parent_message_id, metadata, attachments, "timestamp", updated_at, is_edited, is_deleted, is_ephemeral, expires_at, reactions) FROM stdin;
\.


ALTER TABLE public.messages ENABLE TRIGGER ALL;

--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.notifications DISABLE TRIGGER ALL;

COPY public.notifications (id, user_id, type, title, message, read, metadata, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.notifications ENABLE TRIGGER ALL;

--
-- Data for Name: optimization_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.optimization_jobs DISABLE TRIGGER ALL;

COPY public.optimization_jobs (id, type, target_id, status, config, results, user_id, created_at, updated_at, error) FROM stdin;
\.


ALTER TABLE public.optimization_jobs ENABLE TRIGGER ALL;

--
-- Data for Name: prompt_snippets; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.prompt_snippets DISABLE TRIGGER ALL;

COPY public.prompt_snippets (id, name, content, type, category, tags, usage_count, description, is_starred, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.prompt_snippets ENABLE TRIGGER ALL;

--
-- Data for Name: prompt_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.prompt_templates DISABLE TRIGGER ALL;

COPY public.prompt_templates (id, name, description, current_version_id, is_public, category, tags, analytics, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.prompt_templates ENABLE TRIGGER ALL;

--
-- Data for Name: prompt_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.prompt_versions DISABLE TRIGGER ALL;

COPY public.prompt_versions (id, template_id, version_number, label, content, variables, metrics, changelog, is_active, created_at, name, blocks, created_by) FROM stdin;
\.


ALTER TABLE public.prompt_versions ENABLE TRIGGER ALL;

--
-- Data for Name: read_receipts; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.read_receipts DISABLE TRIGGER ALL;

COPY public.read_receipts (id, message_id, user_id, read_at) FROM stdin;
\.


ALTER TABLE public.read_receipts ENABLE TRIGGER ALL;

--
-- Data for Name: registered_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.registered_entities DISABLE TRIGGER ALL;

COPY public.registered_entities (id, name, type, description, metadata, config, status, version, namespace, tags, capabilities, dependencies, is_public, owner_id, created_at, updated_at, deleted_at) FROM stdin;
\.


ALTER TABLE public.registered_entities ENABLE TRIGGER ALL;

--
-- Data for Name: resource_allocations; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.resource_allocations DISABLE TRIGGER ALL;

COPY public.resource_allocations (id, resource_type, resource_id, project_id, allocated_at, metadata) FROM stdin;
\.


ALTER TABLE public.resource_allocations ENABLE TRIGGER ALL;

--
-- Data for Name: resource_favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.resource_favorites DISABLE TRIGGER ALL;

COPY public.resource_favorites (id, resource_id, user_id, created_at) FROM stdin;
\.


ALTER TABLE public.resource_favorites ENABLE TRIGGER ALL;

--
-- Data for Name: resource_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.resource_shares DISABLE TRIGGER ALL;

COPY public.resource_shares (id, resource_id, from_user_id, to_agent_id, notes, shared_at) FROM stdin;
\.


ALTER TABLE public.resource_shares ENABLE TRIGGER ALL;

--
-- Data for Name: revenue_streams; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.revenue_streams DISABLE TRIGGER ALL;

COPY public.revenue_streams (id, agent_nft_id, stream_name, description, token_address, total_revenue, distributed_revenue, distribution_threshold, is_active, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.revenue_streams ENABLE TRIGGER ALL;

--
-- Data for Name: revenue_distributions; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.revenue_distributions DISABLE TRIGGER ALL;

COPY public.revenue_distributions (id, revenue_stream_id, tx_hash, total_amount, distributed_to, block_number, created_at) FROM stdin;
\.


ALTER TABLE public.revenue_distributions ENABLE TRIGGER ALL;

--
-- Data for Name: sse_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.sse_subscriptions DISABLE TRIGGER ALL;

COPY public.sse_subscriptions (id, organization_id, user_id, event_types, filters, is_active, created_at, updated_at, expires_at) FROM stdin;
\.


ALTER TABLE public.sse_subscriptions ENABLE TRIGGER ALL;

--
-- Data for Name: sync_conflicts; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.sync_conflicts DISABLE TRIGGER ALL;

COPY public.sync_conflicts (id, resource_type, resource_id, tenant_id, conflict_type, local_version, remote_version, created_at, resolved_at, resolved_by, resolution) FROM stdin;
\.


ALTER TABLE public.sync_conflicts ENABLE TRIGGER ALL;

--
-- Data for Name: sync_states; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.sync_states DISABLE TRIGGER ALL;

COPY public.sync_states (id, resource_type, resource_id, tenant_id, version, checksum, last_sync, synced_by, metadata) FROM stdin;
\.


ALTER TABLE public.sync_states ENABLE TRIGGER ALL;

--
-- Data for Name: system_configurations; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.system_configurations DISABLE TRIGGER ALL;

COPY public.system_configurations (key, value, category, description, sensitive, updated_at, updated_by) FROM stdin;
\.


ALTER TABLE public.system_configurations ENABLE TRIGGER ALL;

--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.system_settings DISABLE TRIGGER ALL;

COPY public.system_settings (id, config, updated_at, updated_by) FROM stdin;
\.


ALTER TABLE public.system_settings ENABLE TRIGGER ALL;

--
-- Data for Name: task_executions; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.task_executions DISABLE TRIGGER ALL;

COPY public.task_executions (id, task_id, status, output, error, started_at, completed_at) FROM stdin;
\.


ALTER TABLE public.task_executions ENABLE TRIGGER ALL;

--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.wallets DISABLE TRIGGER ALL;

COPY public.wallets (id, address, agent_id, type, balance, nonce, is_active, last_activity, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.wallets ENABLE TRIGGER ALL;

--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.transactions DISABLE TRIGGER ALL;

COPY public.transactions (id, hash, wallet_id, from_address, to_address, value, gas_price, gas_used, gas_limit, status, block_number, block_hash, type, data, created_at, confirmed_at) FROM stdin;
\.


ALTER TABLE public.transactions ENABLE TRIGGER ALL;

--
-- Data for Name: validation_datasets; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.validation_datasets DISABLE TRIGGER ALL;

COPY public.validation_datasets (id, name, description, items, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.validation_datasets ENABLE TRIGGER ALL;

--
-- Data for Name: webhook_configurations; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.webhook_configurations DISABLE TRIGGER ALL;

COPY public.webhook_configurations (id, organization_id, source, endpoint_url, secret_key, is_active, configuration, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.webhook_configurations ENABLE TRIGGER ALL;

--
-- Data for Name: webhook_delivery_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.webhook_delivery_logs DISABLE TRIGGER ALL;

COPY public.webhook_delivery_logs (id, webhook_configuration_id, event_id, payload, response_status, response_body, delivery_status, attempt_number, delivered_at, created_at) FROM stdin;
\.


ALTER TABLE public.webhook_delivery_logs ENABLE TRIGGER ALL;

--
-- Data for Name: workflows; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.workflows DISABLE TRIGGER ALL;

COPY public.workflows (id, name, description, definition, status, creator_id, agent_id, metadata, is_active, variables, triggers, created_at, updated_at, last_executed_at, execution_count, statistics, deleted_at) FROM stdin;
\.


ALTER TABLE public.workflows ENABLE TRIGGER ALL;

--
-- Data for Name: workflow_executions; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.workflow_executions DISABLE TRIGGER ALL;

COPY public.workflow_executions (id, workflow_id, status, input, output, error, started_at, completed_at, project_id) FROM stdin;
\.


ALTER TABLE public.workflow_executions ENABLE TRIGGER ALL;

--
-- Data for Name: workflow_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.workflow_steps DISABLE TRIGGER ALL;

COPY public.workflow_steps (id, name, type, config, "order", workflow_id, agent_id, next_steps, conditions, transformations, metadata, is_active, created_at, updated_at, last_executed_at, statistics) FROM stdin;
\.


ALTER TABLE public.workflow_steps ENABLE TRIGGER ALL;

--
-- Data for Name: workflow_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.workflow_templates DISABLE TRIGGER ALL;

COPY public.workflow_templates (id, name, description, category, definition, is_public, creator_id, metadata, usage_count, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.workflow_templates ENABLE TRIGGER ALL;

--
-- Data for Name: workflow_topologies; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.workflow_topologies DISABLE TRIGGER ALL;

COPY public.workflow_topologies (id, name, description, nodes, edges, performance_metrics, mass_optimized, user_id, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.workflow_topologies ENABLE TRIGGER ALL;

--
-- Data for Name: workspace_bookmarks; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.workspace_bookmarks DISABLE TRIGGER ALL;

COPY public.workspace_bookmarks (id, workspace_id, title, url, tags, note, created_by_user_id, created_at, updated_at) FROM stdin;
\.


ALTER TABLE public.workspace_bookmarks ENABLE TRIGGER ALL;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: postgres
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 9, true);


--
-- PostgreSQL database dump complete
--

\unrestrict GFtaXNP4ZJPGiXPXkg58cwlhgdVSt1pg7BvIUTroOEYcqb3TvWVgC02fi6bJrgO

