import json
import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parents[1]
GRAPH_JSON = BASE_DIR / "tools/agent-relationship-graph/agent-relationship-graph.json"
MASTER_USER_AGENTS = BASE_DIR / "data/agent-registry/master_user_agents.json"
OUTPUT_JSON = BASE_DIR / "tools/agent-relationship-graph/agent-relationship-graph-v2.json"
OUTPUT_CYPHER = BASE_DIR / "tools/agent-relationship-graph/agent-relationship-graph-v2.cypher"

def merge_data():
    if not GRAPH_JSON.exists() or not MASTER_USER_AGENTS.exists():
        print("❌ Missing input files.")
        return

    graph = json.loads(GRAPH_JSON.read_text())
    users = json.loads(MASTER_USER_AGENTS.read_text())

    # Create a lookup for users by their original name (username without TNF_AGT_ prefix)
    # The users 'username' is 'agent_name_with_underscores'
    user_lookup = {u['username'].replace('_', '-'): u for u in users}

    # Enhanced nodes
    enhanced_nodes = []
    for node in graph['nodes']:
        nid = node['id']
        # Try to find user metadata
        user_data = user_lookup.get(nid)
        if user_data:
            node.update(user_data)
            node['label'] = 'AgentUser'
        else:
            node['label'] = 'Agent'
        enhanced_nodes.append(node)

    # Add any users not in the original graph
    existing_ids = {n['id'] for n in graph['nodes']}
    for name, u in user_lookup.items():
        if name not in existing_ids:
            u['id'] = name
            u['label'] = 'AgentUser'
            enhanced_nodes.append(u)

    graph['nodes'] = enhanced_nodes
    graph['version'] = '2.0'
    graph['updated_at'] = '2026-03-10'

    # Save JSON
    OUTPUT_JSON.write_text(json.dumps(graph, indent=2))
    print(f"✅ Unified JSON saved to: {OUTPUT_JSON}")

    # Generate Cypher
    cypher_lines = [
        "// Unified Agent Registry Import (v2.0)",
        "// Generated: 2026-03-10",
        "",
        "CREATE CONSTRAINT agent_dna_id IF NOT EXISTS FOR (a:AgentUser) REQUIRE a.dna_id IS UNIQUE;",
        "CREATE CONSTRAINT agent_username IF NOT EXISTS FOR (a:AgentUser) REQUIRE a.username IS UNIQUE;",
        ""
    ]

    # Create Nodes
    cypher_lines.append("// Merging Agent Nodes")
    for n in enhanced_nodes:
        props = []
        for k, v in n.items():
            if k == 'label': continue
            if isinstance(v, list):
                val = str(v)
            elif isinstance(v, str):
                val = f"'{v.replace(\"'\", \"\\\\'\")}'"
            else:
                val = str(v)
            props.append(f"{k}: {val}")
        
        label = n.get('label', 'Agent')
        cypher_lines.append(f"MERGE (a:{label} {{id: '{n['id']}'}})")
        cypher_lines.append(f"SET a += {{{', '.join(props)}}};")

    # Create Edges
    cypher_lines.append("")
    cypher_lines.append("// Merging Relationships")
    for e in graph['edges']:
        cypher_lines.append(f"MATCH (s {{id: '{e['source']}'}})")
        cypher_lines.append(f"MATCH (t {{id: '{e['target']}'}})")
        rel_type = e.get('type', 'RELATED').upper()
        props = [f"strength: {e.get('strength', 0.5)}"]
        if 'risk' in e: props.append(f"risk: '{e['risk']}'")
        cypher_lines.append(f"MERGE (s)-[r:{rel_type}]->(t)")
        cypher_lines.append(f"SET r += {{{', '.join(props)}}};")

    OUTPUT_CYPHER.write_text("\n".join(cypher_lines))
    print(f"✅ Unified Cypher saved to: {OUTPUT_CYPHER}")

if __name__ == "__main__":
    merge_data()
