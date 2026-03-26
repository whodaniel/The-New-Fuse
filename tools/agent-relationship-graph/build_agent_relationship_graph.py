#!/usr/bin/env python3
"""Build an expanded, typed agent relationship graph from registry artifacts.

The previous graph file was largely static. This builder keeps curated seed
relationships, then expands coverage to a configurable node target using the
registry and similarity relationships.
"""

from __future__ import annotations

import json
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[1]
REGISTRY_DIR = REPO_ROOT / "data" / "agent-registry"

GRAPH_JSON_PATH = SCRIPT_DIR / "agent-relationship-graph.json"
GRAPH_MD_PATH = SCRIPT_DIR / "agent-relationship-graph.md"
GRAPH_CYPHER_PATH = SCRIPT_DIR / "agent-relationship-graph.cypher"
GRAPH_NOAPOC_CYPHER_PATH = SCRIPT_DIR / "agent-relationship-graph.noapoc.cypher"

AGENTS_PATH = REGISTRY_DIR / "agents.json"
RELATIONSHIPS_PATH = REGISTRY_DIR / "agent_relationships.json"

TARGET_NODE_COUNT = 120
MAX_RELATION_EDGES_PER_SOURCE = 3

CLUSTER_ORDER = [
    "orchestration",
    "content",
    "seo",
    "social",
    "funnel",
    "podcast",
    "brand",
    "ops",
]

MANDATORY_IDS = {
    "orchestrator-agent",
    "task-agent-router",
    "inter-agentic-workflow-definer",
    "interoperability-protocol-agent",
    "agent-registry-manager",
    "agent-relationship-grapher",
    "agent-search-engine",
    "agent-tagger",
    "legal-compliance-agent",
    "content-calendar-agent",
    "content-writer-agent",
    "keyword-research-agent",
    "seo-optimizer-agent",
    "technical-seo-auditor-agent",
    "campaign-execution-agent",
    "podcast-promotion-agent",
    "cro-process-agent",
    "analytics-and-reporting-agent",
}

FORCED_PRIMARY_IDS = {
    "orchestrator-agent",
    "task-agent-router",
    "inter-agentic-workflow-definer",
    "interoperability-protocol-agent",
    "agent-registry-manager",
    "agent-relationship-grapher",
    "content-calendar-orchestrator-agent",
    "cro-process-agent",
    "campaign-execution-agent",
    "legal-compliance-agent",
    "analytics-and-reporting-agent",
    "value-ladder-architect-agent",
}

PRIMARY_QUOTAS_BY_CLUSTER = {
    "orchestration": 10,
    "content": 7,
    "seo": 7,
    "social": 7,
    "funnel": 7,
    "podcast": 7,
    "brand": 7,
    "ops": 7,
}

CHAIN_EDGES = [
    ("content-calendar-agent", "keyword-research-agent", "depends_on", 0.86),
    ("keyword-research-agent", "content-writer-agent", "feeds", 0.88),
    ("content-writer-agent", "seo-optimizer-agent", "feeds", 0.91),
    ("seo-optimizer-agent", "technical-seo-auditor-agent", "depends_on", 0.79),
    ("cro-process-agent", "ab-testing-optimizer-agent", "delegates", 0.92),
    ("cro-process-agent", "cognitive-bias-optimizer-agent", "delegates", 0.83),
    ("ab-testing-optimizer-agent", "analytics-and-reporting-agent", "depends_on", 0.89),
    ("cognitive-bias-optimizer-agent", "analytics-and-reporting-agent", "depends_on", 0.82),
    ("brand-prospecting-agent", "brand-outreach-agent", "feeds", 0.90),
    ("brand-outreach-agent", "deal-negotiator-agent", "feeds", 0.86),
    ("deal-negotiator-agent", "contract-manager-agent", "depends_on", 0.92),
    ("contract-manager-agent", "campaign-execution-agent", "depends_on", 0.91),
    ("campaign-execution-agent", "campaign-reporting-agent", "feeds", 0.88),
    ("podcast-niche-analyst-agent", "podcast-format-designer-agent", "feeds", 0.85),
    ("podcast-format-designer-agent", "podcast-hosting-setup-agent", "feeds", 0.81),
    ("podcast-hosting-setup-agent", "podcast-distribution-agent", "feeds", 0.93),
    ("podcast-distribution-agent", "podcast-promotion-agent", "feeds", 0.87),
    ("podcast-promotion-agent", "podcast-analytics-agent", "depends_on", 0.84),
    ("legal-compliance-agent", "affiliate-link-manager-agent", "delegates", 0.90),
    ("legal-compliance-agent", "asset-sourcer-agent", "delegates", 0.89),
    ("asset-sourcer-agent", "visual-asset-creator-agent", "feeds", 0.82),
    ("campaign-execution-agent", "legal-compliance-agent", "depends_on", 0.80),
]


@dataclass(frozen=True)
class AgentRecord:
    id: str
    description: str
    categories: Tuple[str, ...]
    tools: Tuple[str, ...]
    capabilities_count: int
    agent_type: str


def read_json(path: Path) -> dict | list:
    return json.loads(path.read_text())


def parse_agents(raw_agents: Iterable[dict]) -> Dict[str, AgentRecord]:
    out: Dict[str, AgentRecord] = {}
    for item in raw_agents:
        aid = item.get("id")
        if not aid:
            continue
        out[aid] = AgentRecord(
            id=aid,
            description=item.get("description", "") or "",
            categories=tuple(item.get("categoriesNormalized", []) or []),
            tools=tuple(item.get("tools", []) or []),
            capabilities_count=len(item.get("capabilities", []) or []),
            agent_type=item.get("agentType", "local") or "local",
        )
    return out


def normalize_strength(raw: float | int | None) -> float:
    base = float(raw or 0.5)
    # Strength scores in registry are 0-1-ish; remap into a more visible range.
    value = 0.40 + (0.55 * max(0.0, min(1.0, base)))
    return round(value, 2)


def infer_cluster(agent: AgentRecord) -> str:
    aid = agent.id.lower()
    desc = agent.description.lower()
    text = f"{aid} {desc}"
    categories = set(agent.categories)

    if aid in {
        "orchestrator-agent",
        "task-agent-router",
        "inter-agentic-workflow-definer",
        "interoperability-protocol-agent",
        "agent-registry-manager",
        "agent-relationship-grapher",
        "agent-search-engine",
        "agent-tagger",
    } or "orchestration" in categories:
        return "orchestration"

    if "podcast" in text:
        return "podcast"

    if any(k in text for k in ("seo", "keyword", "serp", "search intent", "link-building")):
        return "seo"

    if any(
        k in text
        for k in (
            "brand",
            "sponsorship",
            "influencer",
            "deal-negotiator",
            "contract",
            "campaign",
            "media kit",
            "prospecting",
            "outreach",
            "talent manager",
        )
    ):
        return "brand"

    if any(
        k in text
        for k in (
            "funnel",
            "cro",
            "conversion",
            "lead magnet",
            "lead-capture",
            "ab-testing",
            "a/b",
            "cognitive-bias",
            "value ladder",
            "oto",
            "monetization",
            "affiliate",
            "ecom",
            "sales",
            "pricing",
            "customer journey",
        )
    ):
        return "funnel"

    if any(
        k in text
        for k in (
            "instagram",
            "tiktok",
            "facebook",
            "x-strategy",
            "social",
            "audience",
            "community",
            "platform-selection",
            "traffic-generation",
            "engagement",
        )
    ):
        return "social"

    if any(
        k in text
        for k in (
            "legal",
            "compliance",
            "tax",
            "financial",
            "reputation",
            "security",
            "risk",
            "burnout",
            "asset",
            "governance",
            "support",
            "audit",
        )
    ):
        return "ops"

    if any(
        k in text
        for k in (
            "content",
            "writer",
            "script",
            "storyboard",
            "video-editor",
            "audio-editor",
            "creator",
            "calendar",
            "repurposing",
            "refresh",
            "distribution",
        )
    ):
        return "content"

    if "operations" in categories or "security" in categories or "general" in categories:
        return "ops"
    if "social" in categories:
        return "social"
    if "marketing" in categories:
        return "funnel"
    if "content" in categories or "media" in categories:
        return "content"

    return "ops"


def score_agent(
    agent: AgentRecord,
    rel_degree: Counter,
    in_seed: bool,
    in_mandatory: bool,
) -> float:
    aid = agent.id
    score = 0.0
    score += rel_degree.get(aid, 0) * 4.0
    score += len(agent.categories) * 1.8
    score += min(agent.capabilities_count, 24) * 0.25
    score += min(len(agent.tools), 8) * 0.7

    if in_seed:
        score += 30.0
    if in_mandatory:
        score += 40.0
    if agent.agent_type == "mcp":
        score += 2.0
    if agent.agent_type == "external":
        score += 1.0

    lowered = aid.lower()
    if any(k in lowered for k in ("orchestrator", "router", "manager", "director")):
        score += 8.0
    if any(k in lowered for k in ("compliance", "registry", "search", "tagger")):
        score += 4.0

    return score


def classify_typed_relationship(
    source_id: str,
    target_id: str,
    source_cluster: str,
    target_cluster: str,
) -> str:
    source = source_id.lower()
    target = target_id.lower()

    if source_cluster == "orchestration":
        return "delegates"
    if target_cluster == "orchestration":
        return "depends_on"

    upstream_hints = (
        "analyst",
        "research",
        "planner",
        "strategy",
        "architect",
        "designer",
        "persona",
        "niche",
        "prospecting",
        "booking",
        "setup",
        "registry",
        "tagger",
        "search",
    )
    downstream_hints = (
        "writer",
        "creator",
        "editor",
        "promotion",
        "distribution",
        "execution",
        "reporting",
        "optimizer",
        "manager",
        "support",
        "campaign",
        "calendar",
        "hosting",
        "compliance",
    )

    if any(k in source for k in upstream_hints) and any(k in target for k in downstream_hints):
        return "feeds"

    if source_cluster == target_cluster:
        return "fallback"

    return "depends_on"


def cypher_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "\\'")


def node_sort_key(node: dict) -> Tuple[int, str]:
    cluster = node.get("cluster", "ops")
    try:
        idx = CLUSTER_ORDER.index(cluster)
    except ValueError:
        idx = len(CLUSTER_ORDER)
    return (idx, node.get("id", ""))


def edge_sort_key(edge: dict) -> Tuple[str, str, str]:
    return (
        edge.get("source", ""),
        edge.get("target", ""),
        edge.get("type", ""),
    )


def build_graph() -> dict:
    raw_agents = read_json(AGENTS_PATH)
    raw_relationships = read_json(RELATIONSHIPS_PATH)
    existing_graph = read_json(GRAPH_JSON_PATH) if GRAPH_JSON_PATH.exists() else {"nodes": [], "edges": []}

    agents = parse_agents(raw_agents)
    agent_ids = set(agents.keys())

    seed_node_ids = {node.get("id") for node in existing_graph.get("nodes", []) if node.get("id")}
    seed_node_ids.discard(None)

    rel_degree: Counter = Counter()
    for rel in raw_relationships:
        source = rel.get("agentId")
        target = rel.get("relatedAgentId")
        if source in agent_ids and target in agent_ids and source != target:
            rel_degree[source] += 1
            rel_degree[target] += 1

    scored_agents: List[Tuple[float, str]] = []
    for aid, agent in agents.items():
        score = score_agent(
            agent=agent,
            rel_degree=rel_degree,
            in_seed=aid in seed_node_ids,
            in_mandatory=aid in MANDATORY_IDS,
        )
        scored_agents.append((score, aid))
    scored_agents.sort(key=lambda x: (-x[0], x[1]))

    synthetic_ids = [aid for aid in MANDATORY_IDS if aid not in agent_ids]
    target_registry_count = max(0, TARGET_NODE_COUNT - len(synthetic_ids))

    selected_registry_ids: List[str] = []
    selected_set = set()

    for aid in sorted((seed_node_ids | MANDATORY_IDS) & agent_ids):
        if aid not in selected_set:
            selected_registry_ids.append(aid)
            selected_set.add(aid)

    for _, aid in scored_agents:
        if len(selected_registry_ids) >= target_registry_count:
            break
        if aid in selected_set:
            continue
        selected_registry_ids.append(aid)
        selected_set.add(aid)

    # If seeds + mandatory exceeded the target, keep mandatory and highest scored.
    if len(selected_registry_ids) > target_registry_count:
        must_keep = sorted((MANDATORY_IDS & agent_ids))
        must_keep_set = set(must_keep)
        trimmed = must_keep[:]
        for _, aid in scored_agents:
            if len(trimmed) >= target_registry_count:
                break
            if aid in must_keep_set:
                continue
            trimmed.append(aid)
        selected_registry_ids = trimmed
        selected_set = set(trimmed)

    cluster_by_id: Dict[str, str] = {}
    score_by_id: Dict[str, float] = {}
    for score, aid in scored_agents:
        score_by_id[aid] = score
    for aid in selected_registry_ids:
        cluster_by_id[aid] = infer_cluster(agents[aid])

    for sid in synthetic_ids:
        cluster_by_id[sid] = "orchestration"
        score_by_id[sid] = 999.0

    # Primary selection.
    primary_ids = set(FORCED_PRIMARY_IDS) & (set(selected_registry_ids) | set(synthetic_ids))
    members_by_cluster: Dict[str, List[str]] = defaultdict(list)
    for aid in selected_registry_ids:
        members_by_cluster[cluster_by_id[aid]].append(aid)
    for sid in synthetic_ids:
        members_by_cluster[cluster_by_id[sid]].append(sid)

    for cluster, members in members_by_cluster.items():
        quota = PRIMARY_QUOTAS_BY_CLUSTER.get(cluster, 5)
        ranked = sorted(
            members,
            key=lambda aid: (-score_by_id.get(aid, 0.0), aid),
        )
        for aid in ranked[:quota]:
            primary_ids.add(aid)

    all_node_ids = set(selected_registry_ids) | set(synthetic_ids)
    nodes: List[dict] = []
    for aid in all_node_ids:
        nodes.append(
            {
                "id": aid,
                "kind": "primary" if aid in primary_ids else "sub",
                "cluster": cluster_by_id.get(aid, "ops"),
            }
        )
    nodes.sort(key=node_sort_key)

    node_id_set = {n["id"] for n in nodes}

    edge_map: Dict[Tuple[str, str, str], dict] = {}

    def add_edge(
        source: str,
        target: str,
        relation_type: str,
        strength: float,
        origin: str,
        risk: str = "",
        direction: str = "unidirectional",
    ) -> None:
        if source == target:
            return
        if source not in node_id_set or target not in node_id_set:
            return
        rel = relation_type.lower()
        strength_value = round(float(strength), 2)
        key = (source, target, rel)
        existing = edge_map.get(key)
        candidate = {
            "source": source,
            "target": target,
            "type": rel,
            "strength": strength_value,
            "origin": origin,
        }
        if risk:
            candidate["risk"] = risk
        if direction != "unidirectional":
            candidate["direction"] = direction
        if existing is None or candidate["strength"] > existing.get("strength", 0.0):
            edge_map[key] = candidate

    # Preserve existing curated edges where possible.
    for edge in existing_graph.get("edges", []):
        source = edge.get("source")
        target = edge.get("target")
        relation_type = edge.get("type", "fallback")
        strength = edge.get("strength", 0.60)
        add_edge(
            source=source,
            target=target,
            relation_type=relation_type,
            strength=strength,
            origin="seed",
            risk=edge.get("risk", ""),
            direction=edge.get("direction", "unidirectional"),
        )

    orchestration_members = sorted(
        [aid for aid in node_id_set if cluster_by_id.get(aid) == "orchestration" and aid != "orchestrator-agent"],
        key=lambda aid: (-score_by_id.get(aid, 0.0), aid),
    )
    for aid in orchestration_members[:16]:
        add_edge("orchestrator-agent", aid, "delegates", 0.86, origin="scaffold")

    # Router dispatch to one lead per non-orchestration cluster.
    for cluster in [c for c in CLUSTER_ORDER if c != "orchestration"]:
        members = sorted(
            [aid for aid in node_id_set if cluster_by_id.get(aid) == cluster],
            key=lambda aid: (-score_by_id.get(aid, 0.0), aid),
        )
        if not members:
            continue
        lead = members[0]
        add_edge("task-agent-router", lead, "delegates", 0.82, origin="scaffold")

    # Relationship-derived edges (typed).
    rels_by_source: Dict[str, List[dict]] = defaultdict(list)
    for rel in raw_relationships:
        source = rel.get("agentId")
        target = rel.get("relatedAgentId")
        if source not in node_id_set or target not in node_id_set or source == target:
            continue
        rels_by_source[source].append(rel)

    for source, rels in rels_by_source.items():
        ranked = sorted(
            rels,
            key=lambda rel: (
                -float(rel.get("strengthScore", 0.0)),
                rel.get("relatedAgentId", ""),
            ),
        )
        for rel in ranked[:MAX_RELATION_EDGES_PER_SOURCE]:
            target = rel["relatedAgentId"]
            strength = normalize_strength(rel.get("strengthScore"))
            rel_type = classify_typed_relationship(
                source_id=source,
                target_id=target,
                source_cluster=cluster_by_id.get(source, "ops"),
                target_cluster=cluster_by_id.get(target, "ops"),
            )
            risk = "capability_overlap" if rel_type == "fallback" else ""
            add_edge(
                source=source,
                target=target,
                relation_type=rel_type,
                strength=strength,
                origin="registry",
                risk=risk,
            )

    # Canonical workflow chain edges.
    for source, target, rel_type, strength in CHAIN_EDGES:
        add_edge(source, target, rel_type, strength, origin="chain")

    # Fallback ring within each cluster (helps avoid singleton islands).
    for cluster in CLUSTER_ORDER:
        members = sorted(
            [aid for aid in node_id_set if cluster_by_id.get(aid) == cluster],
            key=lambda aid: (-score_by_id.get(aid, 0.0), aid),
        )
        if len(members) < 2:
            continue
        for idx in range(min(8, len(members) - 1)):
            add_edge(
                members[idx],
                members[idx + 1],
                "fallback",
                0.58,
                origin="ring",
                risk="intra_cluster_fallback",
            )

    # Backstop: every non-orchestration node should have at least one incoming edge.
    incoming_counts: Counter = Counter()
    for edge in edge_map.values():
        incoming_counts[edge["target"]] += 1

    for aid in sorted(node_id_set):
        if aid in {"orchestrator-agent", "task-agent-router"}:
            continue
        if cluster_by_id.get(aid) == "orchestration":
            continue
        if incoming_counts.get(aid, 0) > 0:
            continue
        add_edge(
            "task-agent-router",
            aid,
            "delegates",
            0.57,
            origin="backstop",
            risk="routing_backstop",
        )
        incoming_counts[aid] += 1

    edges: List[dict] = sorted(edge_map.values(), key=edge_sort_key)

    by_cluster_counts = Counter(n["cluster"] for n in nodes)
    by_type_counts = Counter(e["type"] for e in edges)
    by_origin_counts = Counter(e.get("origin", "unknown") for e in edges)
    coverage_vs_registry = round((len(nodes) / max(1, len(agents))) * 100, 2)

    generated_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    graph = {
        "generated_at": generated_date,
        "nodes": nodes,
        "edges": edges,
        "metadata": {
            "builder": "build_agent_relationship_graph.py",
            "target_node_count": TARGET_NODE_COUNT,
            "selected_nodes": len(nodes),
            "selected_edges": len(edges),
            "registry_agents_total": len(agents),
            "coverage_vs_registry_pct": coverage_vs_registry,
            "edge_sources": dict(sorted(by_origin_counts.items())),
            "edge_types": dict(sorted(by_type_counts.items())),
            "clusters": dict(sorted(by_cluster_counts.items())),
        },
    }
    return graph


def write_graph_json(graph: dict) -> None:
    GRAPH_JSON_PATH.write_text(json.dumps(graph, indent=2) + "\n")


def write_graph_markdown(graph: dict) -> None:
    nodes = graph["nodes"]
    edges = graph["edges"]
    metadata = graph.get("metadata", {})

    cluster_counts = Counter(n["cluster"] for n in nodes)
    type_counts = Counter(e["type"] for e in edges)
    hub_counts = Counter()
    for edge in edges:
        hub_counts[edge["source"]] += 1
        hub_counts[edge["target"]] += 1

    top_hubs = sorted(hub_counts.items(), key=lambda kv: (-kv[1], kv[0]))[:20]
    top_edges = sorted(edges, key=lambda e: (-e.get("strength", 0.0), e["source"], e["target"]))[:80]

    lines = [
        "# Agent Relationship Graph",
        "",
        f"Generated: {graph.get('generated_at', '')}",
        "Scope: registry-driven typed graph synthesis",
        "Method: curated seed relationships + similarity expansion + typed routing heuristics.",
        "",
        "## 1) Snapshot",
        "",
        f"- Nodes: {len(nodes)}",
        f"- Edges: {len(edges)}",
        f"- Registry coverage: {metadata.get('coverage_vs_registry_pct', 'n/a')}%",
        "",
        "### Cluster Distribution",
        "",
    ]
    for cluster, count in sorted(cluster_counts.items(), key=lambda kv: (-kv[1], kv[0])):
        lines.append(f"- {cluster}: {count}")

    lines += ["", "### Relationship Type Distribution", ""]
    for rel_type, count in sorted(type_counts.items(), key=lambda kv: (-kv[1], kv[0])):
        lines.append(f"- {rel_type}: {count}")

    lines += ["", "## 2) Top Connectivity Hubs", ""]
    for aid, count in top_hubs:
        lines.append(f"- {aid}: {count}")

    lines += ["", "## 3) Representative Relationship Slice", "", "```mermaid", "graph TD"]
    for edge in top_edges:
        src = edge["source"].replace("-", "_")
        tgt = edge["target"].replace("-", "_")
        rel = edge["type"]
        lines.append(f"  {src}[{edge['source']}] -->|{rel}| {tgt}[{edge['target']}]")
    lines += ["```", ""]

    GRAPH_MD_PATH.write_text("\n".join(lines))


def write_graph_cypher(graph: dict) -> None:
    nodes = sorted(graph["nodes"], key=node_sort_key)
    edges = sorted(graph["edges"], key=edge_sort_key)
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    node_rows = []
    for node in nodes:
        node_rows.append(
            "{id:'%s',kind:'%s',cluster:'%s'}"
            % (
                cypher_escape(node["id"]),
                cypher_escape(node.get("kind", "sub")),
                cypher_escape(node.get("cluster", "ops")),
            )
        )

    edge_rows_apoc = []
    edge_rows_noapoc = []
    for edge in edges:
        edge_type = edge.get("type", "fallback").upper()
        edge_type_clean = "".join(ch if (ch.isalnum() or ch == "_") else "_" for ch in edge_type)
        risk = cypher_escape(str(edge.get("risk", "")))
        direction = cypher_escape(str(edge.get("direction", "unidirectional")))
        edge_rows_apoc.append(
            "{s:'%s',t:'%s',type:'%s',strength:%s,risk:'%s',direction:'%s'}"
            % (
                cypher_escape(edge["source"]),
                cypher_escape(edge["target"]),
                cypher_escape(edge_type_clean),
                edge.get("strength", 0.5),
                risk,
                direction,
            )
        )
        edge_rows_noapoc.append(
            "{s:'%s',t:'%s',rel:'%s',strength:%s,risk:'%s',direction:'%s'}"
            % (
                cypher_escape(edge["source"]),
                cypher_escape(edge["target"]),
                cypher_escape(edge_type_clean),
                edge.get("strength", 0.5),
                risk,
                direction,
            )
        )

    noapoc_lines = [
        "// Agent relationship graph import for Neo4j (no APOC required)",
        f"// Generated: {graph.get('generated_at', '')}",
        "",
        "CREATE CONSTRAINT agent_id IF NOT EXISTS",
        "FOR (a:Agent)",
        "REQUIRE a.id IS UNIQUE;",
        "",
        "UNWIND [",
        "  " + ",\n  ".join(node_rows),
        "] AS row",
        "MERGE (a:Agent {id: row.id})",
        "SET a.kind = row.kind,",
        "    a.cluster = row.cluster,",
        f"    a.updatedAt = datetime('{stamp}');",
        "",
        "UNWIND [",
        "  " + ",\n  ".join(edge_rows_noapoc),
        "] AS r",
        "MATCH (a:Agent {id: r.s})",
        "MATCH (b:Agent {id: r.t})",
        "MERGE (a)-[rel:RELATED {relationType: r.rel}]->(b)",
        "SET rel.strength = r.strength,",
        "    rel.risk = r.risk,",
        "    rel.direction = r.direction,",
        f"    rel.updatedAt = datetime('{stamp}');",
        "",
    ]
    GRAPH_NOAPOC_CYPHER_PATH.write_text("\n".join(noapoc_lines))

    apoc_lines = [
        "// Agent relationship graph import for Neo4j",
        f"// Generated: {graph.get('generated_at', '')}",
        "",
        "CREATE CONSTRAINT agent_id IF NOT EXISTS",
        "FOR (a:Agent)",
        "REQUIRE a.id IS UNIQUE;",
        "",
        "UNWIND [",
        "  " + ",\n  ".join(node_rows),
        "] AS row",
        "MERGE (a:Agent {id: row.id})",
        "SET a.kind = row.kind,",
        "    a.cluster = row.cluster,",
        f"    a.updatedAt = datetime('{stamp}');",
        "",
        "UNWIND [",
        "  " + ",\n  ".join(edge_rows_apoc),
        "] AS rel",
        "MATCH (a:Agent {id: rel.s})",
        "MATCH (b:Agent {id: rel.t})",
        "CALL apoc.merge.relationship(",
        "  a,",
        "  rel.type,",
        "  {},",
        f"  {{strength: rel.strength, risk: rel.risk, direction: rel.direction, updatedAt: datetime('{stamp}')}},",
        "  b",
        ") YIELD reln",
        "RETURN count(reln) AS relationships_upserted;",
        "",
    ]
    GRAPH_CYPHER_PATH.write_text("\n".join(apoc_lines))


def main() -> None:
    graph = build_graph()
    write_graph_json(graph)
    write_graph_markdown(graph)
    write_graph_cypher(graph)

    meta = graph.get("metadata", {})
    print(f"wrote {GRAPH_JSON_PATH}")
    print(f"wrote {GRAPH_MD_PATH}")
    print(f"wrote {GRAPH_CYPHER_PATH}")
    print(f"wrote {GRAPH_NOAPOC_CYPHER_PATH}")
    print(
        json.dumps(
            {
                "nodes": meta.get("selected_nodes"),
                "edges": meta.get("selected_edges"),
                "coverage_vs_registry_pct": meta.get("coverage_vs_registry_pct"),
                "clusters": meta.get("clusters", {}),
                "edge_types": meta.get("edge_types", {}),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
