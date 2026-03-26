.PHONY: all graph subgraphs analytics neo4j temporal alerts cron launchd html clean help

all: ## Run the full rebuild pipeline
	./rebuild_agent_relationship_artifacts.sh

graph: ## Rebuild expanded base graph JSON/Markdown/Cypher
	python3 ./build_agent_relationship_graph.py

subgraphs: ## Generate domain subgraphs (JSON + Markdown + Cypher)
	./generate_agent_subgraphs.sh

analytics: ## Build centrality & community analytics
	python3 ./build_agent_graph_analytics.py

neo4j: ## Build Neo4j import package (CSV + Cypher)
	python3 ./build_agent_neo4j_package.py

temporal: ## Create a temporal snapshot and diff against previous
	python3 ./build_agent_temporal_diffs.py

alerts: ## Check latest delta against alert thresholds
	python3 ./check_agent_graph_delta_alerts.py

html: ## Regenerate interactive HTML views for subgraphs
	python3 ./build_agent_html_views.py

cron: ## Install hourly cron job for autopilot
	./setup_graph_snapshot_cron.sh install

cron-remove: ## Remove autopilot cron job
	./setup_graph_snapshot_cron.sh remove

launchd: ## Install macOS launchd agent for autopilot
	./setup_graph_snapshot_launchd.sh install

launchd-remove: ## Remove macOS launchd agent
	./setup_graph_snapshot_launchd.sh remove

clean: ## Remove generated snapshots and reports
	rm -rf snapshots/delta-*.json snapshots/delta-*.md
	rm -rf snapshots/latest-*.json snapshots/latest-*.md
	rm -rf reports/*.json reports/*.md
	@echo "Cleaned generated artifacts (snapshots and reports preserved)"

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
