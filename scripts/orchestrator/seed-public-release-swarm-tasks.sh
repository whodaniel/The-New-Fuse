#!/usr/bin/env bash

set -euo pipefail

QUEUE_KEY="${QUEUE_KEY:-tnf:master:tasks:pending}"
CHANNEL_ID="${BLUE_CHANNEL_ID:-channel-1771603937514}"
DRY_RUN="${DRY_RUN:-0}"

if ! command -v redis-cli >/dev/null 2>&1; then
  echo "[seed-public-release-swarm-tasks] redis-cli not found"
  exit 1
fi

if [[ "${DRY_RUN}" != "1" ]]; then
  redis-cli PING >/dev/null
fi

seed_task() {
  title="$1"
  lane="$2"
  owner_hint="$3"
  priority="${4:-high}"
  acceptance="$5"

  payload="$(cat <<JSON
{"id":"task-$(date +%s)-$RANDOM","title":"${title}","lane":"${lane}","ownerHint":"${owner_hint}","priority":"${priority}","status":"pending","acceptance":"${acceptance}","createdAt":"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"}
JSON
)"

  if [[ "${DRY_RUN}" == "1" ]]; then
    echo "${payload}"
  else
    redis-cli LPUSH "${QUEUE_KEY}" "${payload}" >/dev/null
  fi
}

# Frontend-first release tasks
seed_task "P0 frontend sweep: remove remaining demo/mock fallbacks on / /dashboard /agents /workflows /admin /hub" "frontend-p0-truth" "frontend-specialist" "critical" "No fabricated data paths remain for P0 routes"
seed_task "Mobile quality pass for P0 routes (360/390/768/1024 breakpoints)" "frontend-mobile" "mobile-developer" "high" "No critical breakpoint/layout regressions"
seed_task "Design consistency pass: typography, spacing, semantic color tokens" "frontend-design-system" "primitive-master" "high" "P0 surfaces share consistent UI tokens and hierarchy"
seed_task "SEO pass for public routes: metadata, canonical tags, crawl hygiene" "frontend-seo" "seo-specialist" "high" "Public routes return complete metadata and crawl-safe setup"
seed_task "Frontend reliability pass: deterministic loading/empty/unavailable states" "frontend-reliability" "test-engineer" "high" "Async UX states verified and non-random"

# Backend and platform tasks
seed_task "API contract sweep for all P0 frontend dependencies with explicit 2xx/4xx/5xx behavior" "backend-contracts" "backend-specialist" "critical" "All P0 calls have truthful backend responses"
seed_task "DB and migration safety review for release candidate schema state" "data-integrity" "database-architect" "high" "No migration blockers and rollback path documented"
seed_task "CloudRuntime release drill: deploy, health check, rollback rehearsal" "platform-release" "devops-engineer" "critical" "Deploy and rollback both succeed in rehearsal"
seed_task "Performance budget pass on public pages and top APIs" "performance-budget" "performance-optimizer" "high" "Baseline latency and page metrics captured and within budget"

# Security and QA tasks
seed_task "Security audit: auth boundaries, exposed admin routes, secret handling" "security-audit" "security-auditor" "critical" "No P0 auth/secret exposure findings open"
seed_task "Pen-test sweep for high-risk endpoints and session flows" "security-penetration" "penetration-tester" "high" "Critical exploit paths assessed with documented outcomes"
seed_task "Release regression matrix execution across core user journeys" "qa-regression" "picoclaw-tester" "critical" "Regression matrix complete with evidence artifacts"
seed_task "Viability + benchmark checks for automated test coverage and stability" "qa-viability" "picoclaw-tester-viability" "high" "Coverage and flake baseline accepted"

# Documentation and launch tasks
seed_task "Publish public operator docs for setup, recovery, and incident response" "launch-docs" "documentation-writer" "high" "Operator docs reviewed and linked"
seed_task "Competitive launch scan for AI ecosystem positioning and announcement timing" "market-intel" "news-scout" "medium" "Launch timing recommendation delivered"
seed_task "Opportunity scan for post-launch distribution and adoption levers" "growth-opportunities" "scout-llm-opportunities" "medium" "Post-launch growth queue seeded"

echo "[seed-public-release-swarm-tasks] queued tasks in ${QUEUE_KEY}"
if [[ "${DRY_RUN}" == "1" ]]; then
  echo "[seed-public-release-swarm-tasks] dry run only - no queue writes"
else
  redis-cli LLEN "${QUEUE_KEY}"
fi

if command -v node >/dev/null 2>&1 && [[ "${DRY_RUN}" != "1" ]]; then
  BLUE_CHANNEL_ID="${CHANNEL_ID}" node scripts/orchestrator/seed-blue-swarm.cjs >/dev/null 2>&1 || true
fi

echo "[seed-public-release-swarm-tasks] blue-lane kickoff broadcast sent"
