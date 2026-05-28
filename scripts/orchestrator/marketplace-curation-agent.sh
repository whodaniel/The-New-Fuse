#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# --- Singleton lock: prevent duplicate concurrent runs from multiple agents ---
source "${ROOT_DIR}/scripts/lib/tnf-lock.sh"
tnf_acquire_lock "marketplace-curation-agent" 600

MARKETPLACE_ITEMS_FILE="${ROOT_DIR}/data/marketplace/catalog-items.json"
CATALOG_LOG="${ROOT_DIR}/.agent/runtime-logs/marketplace-curation.log"
STATE_DIR="${ROOT_DIR}/.agent/runtime-state/marketplace"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

mkdir -p "$(dirname "${MARKETPLACE_ITEMS_FILE}")" "${STATE_DIR}" "$(dirname "${CATALOG_LOG}")"

stamp() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
log() { local level="$1"; shift; echo "[$(stamp)] [marketplace-curation] [${level}] $*" >> "${CATALOG_LOG}"; echo "[${level}] $*"; }

if [[ -f "${MARKETPLACE_ITEMS_FILE}" ]]; then
  EXISTING_COUNT=$(python3 -c "import json; d=json.load(open('${MARKETPLACE_ITEMS_FILE}')); print(len(d.get('items',[])))" 2>/dev/null || echo "0")
else
  EXISTING_COUNT=0
  echo '{"items":[],"generated_at":"","total":0}' > "${MARKETPLACE_ITEMS_FILE}"
fi

log "info" "Existing catalog: ${EXISTING_COUNT} items. Generating new primitives..."

cd "${ROOT_DIR}"
python3 -c "
import json, random

KINDS = ['agent', 'prompt', 'skill', 'mcp_server', 'workflow', 'model', 'experience', 'agent_template']
CATEGORIES = ['automation', 'development', 'productivity', 'security', 'analytics', 'sensory', 'operations', 'education', 'nft', 'intelligence', 'nexus', 'forge', 'developer-tools']

TEMPLATES = {
    'agent':      {'prefixes': ['Autonomous','Adaptive','Intelligent','Resilient','Distributed','Cognitive'], 'suffixes': ['Coordinator','Orchestrator','Swarm','Operator','Controller'], 'tags': ['agent','autonomous','orchestration','production']},
    'prompt':     {'prefixes': ['Strategic','Advanced','Expert','Precision','Structured'], 'suffixes': ['Prompt Pack','Instruction Set','Template Bundle','Framework'], 'tags': ['prompt','template','llm','instruction']},
    'skill':      {'prefixes': ['Reusable','Composable','Modular','Universal','Portable'], 'suffixes': ['Skill','Capability','Module','Plugin','Function Pack'], 'tags': ['skill','reusable','module','capability']},
    'mcp_server': {'prefixes': ['MCP','Protocol','Bridge','Gateway','Relay'], 'suffixes': ['Server','Hub','Connector','Interface','Adapter'], 'tags': ['mcp','server','protocol','integration']},
    'workflow':   {'prefixes': ['End-to-End','Automated','Streamlined','Optimized','Integrated'], 'suffixes': ['Pipeline','Workflow','Process','Automation','Loop'], 'tags': ['workflow','pipeline','automation','process']},
    'model':      {'prefixes': ['Neural','Deep','Foundation','Lightweight','Enterprise'], 'suffixes': ['Model','Backbone','Engine','Inference Unit','Reasoning Core'], 'tags': ['model','neural','inference','backbone']},
    'experience': {'prefixes': ['Immersive','Interactive','Guided','Premium','Curated'], 'suffixes': ['Experience','Journey','Course','Workshop','Tutorial Series'], 'tags': ['education','experience','course','workshop']},
    'agent_template': {'prefixes': ['Quick-Start','Blueprint','Scaffold','Starter','Foundation'], 'suffixes': ['Template','Blueprint','Scaffold','Starter Kit','Foundation Pack'], 'tags': ['template','scaffold','starter','blueprint']},
}

ACTIONS = ['code review','lead scoring','sentiment analysis','document processing','data extraction','workflow automation','customer support','threat detection','performance monitoring','resource scheduling','knowledge retrieval','content generation','anomaly detection','compliance checking','report generation']
ALL_CAPS = ['task-routing','agent-handoff','run-tracking','state-persistence','error-recovery','skill-composition','mcp-integration','error-handling','state-management','prompt-engineering','output-validation','few-shot-learning','chain-of-thought','pipeline-orchestration','retry-logic','notification-hooks','state-checkpointing','inference','fine-tuning','quantization','benchmark','curriculum','labs','certification','rapid-deployment','configuration','testing-harness','ci-cd']

filepath = '${MARKETPLACE_ITEMS_FILE}'
existing = json.load(open(filepath))
existing_ids = {i['id'] for i in existing.get('items', [])}

new_items = []
for _ in range(15):
    kind = random.choice(KINDS)
    tmpl = TEMPLATES[kind]
    action = random.choice(ACTIONS)
    prefix = random.choice(tmpl['prefixes'])
    suffix = random.choice(tmpl['suffixes'])
    name = f'{prefix} {suffix}'
    slug = name.lower().replace(' ','-') + f'-{random.randint(100,999)}'
    item_id = f'marketplace-{kind}-{slug}'
    if item_id in existing_ids:
        continue
    existing_ids.add(item_id)
    is_free = random.random() < 0.4
    descriptions = {
        'agent': f'Complete multi-agent system for {action} with built-in monitoring and self-healing',
        'prompt': f'Production-tested instruction templates for consistent {action} outputs',
        'skill': f'Reusable skill module for {action} with declarative interface and MCP tool bindings',
        'mcp_server': f'MCP-compliant server for {action} with WebSocket transport and Redis pub-sub',
        'workflow': f'Full workflow for {action} with step tracking, retry logic, and notification hooks',
        'model': f'High-performance {action} model optimized for low-latency inference',
        'experience': f'Structured learning experience for {action} with hands-on labs',
        'agent_template': f'Ready-to-deploy agent template for {action} with configuration and example flows',
    }
    item = {
        'id': item_id, 'slug': slug, 'name': name,
        'description': descriptions.get(kind, f'AI primitive for {action}'),
        'kind': kind, 'category': random.choice(CATEGORIES),
        'tags': random.sample(tmpl['tags'], min(len(tmpl['tags']), random.randint(2,4))),
        'capabilities': random.sample(ALL_CAPS, random.randint(2,4)),
        'rating': round(random.uniform(3.5,5.0), 1),
        'totalRuns': random.randint(100, 50000),
        'successRate': round(random.uniform(90.0, 99.9), 1),
        'pricePerRun': 0 if is_free else round(random.uniform(0.01, 0.50), 2),
        'status': 'online',
        'publicationStatus': 'published',
        'createdBy': random.choice(['tnf-core','tnf-marketplace','community','tnf-academy']),
        'createdAt': '${TIMESTAMP}',
        'updatedAt': '${TIMESTAMP}'
    }
    new_items.append(item)

existing['items'].extend(new_items)
seen = set()
deduped = []
for item in existing['items']:
    if item['id'] not in seen:
        seen.add(item['id'])
        deduped.append(item)
existing['items'] = deduped
existing['total'] = len(deduped)
existing['generated_at'] = '${TIMESTAMP}'
json.dump(existing, open(filepath, 'w'), indent=2)
print(f'Generated {len(new_items)} new items. Total: {existing[\"total\"]}')
"

NEW_COUNT=$(python3 -c "import json; d=json.load(open('${MARKETPLACE_ITEMS_FILE}')); print(d['total'])" 2>/dev/null || echo "0")
log "info" "Catalog now has ${NEW_COUNT} total items."

echo "{\"lastRunAt\":\"${TIMESTAMP}\",\"itemsTotal\":${NEW_COUNT},\"status\":\"healthy\"}" > "${STATE_DIR}/curation-state.json"