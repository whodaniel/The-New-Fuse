#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="$SCRIPT_DIR/agent-relationship-graph.json"
OUTDIR="$SCRIPT_DIR/subgraphs"

mkdir -p "$OUTDIR"

RULES=(
  "podcast|task-agent-router,orchestrator-agent,analytics-and-reporting-agent"
  "seo|content-writer-agent,content-calendar-agent,content-calendar-orchestrator-agent,task-agent-router,orchestrator-agent"
  "brand|task-agent-router,orchestrator-agent,legal-compliance-agent"
  "funnel|task-agent-router,orchestrator-agent,analytics-and-reporting-agent"
  "social|task-agent-router,orchestrator-agent,content-calendar-orchestrator-agent"
  "ops|task-agent-router,orchestrator-agent"
  "content|task-agent-router,orchestrator-agent,keyword-research-agent,seo-optimizer-agent"
)

for rule in "${RULES[@]}"; do
  domain="${rule%%|*}"
  include_csv="${rule#*|}"

  include_json="$(printf '%s' "$include_csv" | awk -F',' '{printf "["; for(i=1;i<=NF;i++){printf "\"%s\"",$i; if(i<NF) printf ","} printf "]"}')"

  json_out="$OUTDIR/agent-relationship-${domain}-subgraph.json"
  md_out="$OUTDIR/agent-relationship-${domain}-subgraph.md"
  cypher_out="$OUTDIR/agent-relationship-${domain}-subgraph.noapoc.cypher"

  jq --arg domain "$domain" --argjson include "$include_json" '
    . as $g
    | ($g.nodes | map(select(.cluster==$domain or (.id as $id | $include | index($id))))) as $nodes
    | ($nodes | map(.id)) as $ids
    | {
        generated_at: $g.generated_at,
        domain: $domain,
        nodes: $nodes,
        edges: ($g.edges | map(select((.source as $s | $ids | index($s)) and (.target as $t | $ids | index($t)))))
      }
  ' "$BASE" > "$json_out"

  {
    name="$(printf '%s%s' "$(printf '%s' "$domain" | cut -c1 | tr '[:lower:]' '[:upper:]')" "$(printf '%s' "$domain" | cut -c2-)")"
    echo "# ${name} Subgraph"
    echo
    echo "Generated: $(date -u '+%Y-%m-%d')"
    echo "Source: \`agent-relationship-graph.json\`"
    echo
    echo '```mermaid'
    echo 'graph TD'
    jq -r '.edges[] | "  \(.source|gsub("-";"_")) [\(.source)] --> \(.target|gsub("-";"_")) [\(.target)]"' "$json_out"
    echo '```'
  } > "$md_out"

  stamp="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  {
    cat <<'HEAD'
// Subgraph import for Neo4j (no APOC required)
CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

HEAD

    echo "UNWIND ["
    jq -r '.nodes[] | "  {id:\"\(.id)\",kind:\"\(.kind)\",cluster:\"\(.cluster)\"},"' "$json_out" | sed '$ s/,$//'
    cat <<MID
] AS row
MERGE (a:Agent {id: row.id})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.updatedAt = datetime('${stamp}');

UNWIND [
MID
    jq -r '.edges[] | "  {s:\"" + .source + "\",t:\"" + .target + "\",rel:\"" + (.type|ascii_upcase) + "\",strength:" + ((.strength//0.5)|tostring) + ",risk:" + ((.risk//"")|@json) + "},"' "$json_out" | sed '$ s/,$//'
    cat <<'TAIL'
] AS r
MATCH (a:Agent {id: r.s})
MATCH (b:Agent {id: r.t})
MERGE (a)-[rel:RELATED {relationType: r.rel}]->(b)
SET rel.strength = r.strength,
    rel.risk = r.risk;
TAIL
  } > "$cypher_out"
done

echo "Generating HTML views..."
python3 "$SCRIPT_DIR/build_agent_html_views.py"
echo "done — subgraphs written to $OUTDIR"
