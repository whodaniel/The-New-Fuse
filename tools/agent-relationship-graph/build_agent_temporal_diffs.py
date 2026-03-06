#!/usr/bin/env python3
"""Create graph snapshots and compute temporal diffs between consecutive snapshots."""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

SCRIPT_DIR = Path(__file__).resolve().parent
SUBGRAPHS_DIR = SCRIPT_DIR / 'subgraphs'
SNAP_DIR = SCRIPT_DIR / 'snapshots'
SNAP_DIR.mkdir(exist_ok=True)

GRAPH_FILES = [
    ('agent-relationship-graph.json', SCRIPT_DIR),
    ('agent-relationship-podcast-subgraph.json', SUBGRAPHS_DIR),
    ('agent-relationship-seo-subgraph.json', SUBGRAPHS_DIR),
    ('agent-relationship-brand-subgraph.json', SUBGRAPHS_DIR),
    ('agent-relationship-funnel-subgraph.json', SUBGRAPHS_DIR),
    ('agent-relationship-social-subgraph.json', SUBGRAPHS_DIR),
    ('agent-relationship-ops-subgraph.json', SUBGRAPHS_DIR),
    ('agent-relationship-content-subgraph.json', SUBGRAPHS_DIR),
]

def now_stamp():
    return datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')

def canonical_nodes(nodes):
    return sorted([n.get('id') for n in nodes if n.get('id')])

def canonical_edges(edges):
    out = []
    for e in edges:
        s = e.get('source')
        t = e.get('target')
        typ = e.get('type', '')
        if s and t:
            out.append((s, t, typ))
    return sorted(out)

def load_graph(path: Path):
    data = json.loads(path.read_text())
    nodes = canonical_nodes(data.get('nodes', []))
    edges = canonical_edges(data.get('edges', []))
    return {
        'file': path.name,
        'domain': data.get('domain', 'full'),
        'nodes': nodes,
        'edges': edges,
    }

def write_snapshot(tag: str):
    snap = {
        'snapshot_tag': tag,
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'graphs': [],
    }
    for name, base_dir in GRAPH_FILES:
        p = base_dir / name
        if p.exists():
            snap['graphs'].append(load_graph(p))
    out = SNAP_DIR / f'snapshot-{tag}.json'
    out.write_text(json.dumps(snap, indent=2))
    return out

def list_snapshots():
    return sorted(SNAP_DIR.glob('snapshot-*.json'))

def diff_graph(old_g, new_g):
    old_nodes = set(old_g.get('nodes', []))
    new_nodes = set(new_g.get('nodes', []))
    old_edges = set(tuple(x) for x in old_g.get('edges', []))
    new_edges = set(tuple(x) for x in new_g.get('edges', []))

    return {
        'file': new_g.get('file', old_g.get('file')),
        'domain': new_g.get('domain', old_g.get('domain')),
        'node_count_old': len(old_nodes),
        'node_count_new': len(new_nodes),
        'edge_count_old': len(old_edges),
        'edge_count_new': len(new_edges),
        'nodes_added': sorted(new_nodes - old_nodes),
        'nodes_removed': sorted(old_nodes - new_nodes),
        'edges_added': sorted([{'source': s, 'target': t, 'type': typ} for (s, t, typ) in (new_edges - old_edges)], key=lambda x: (x['source'], x['target'], x['type'])),
        'edges_removed': sorted([{'source': s, 'target': t, 'type': typ} for (s, t, typ) in (old_edges - new_edges)], key=lambda x: (x['source'], x['target'], x['type'])),
    }

def build_delta(old_snap_path: Path, new_snap_path: Path):
    old = json.loads(old_snap_path.read_text())
    new = json.loads(new_snap_path.read_text())

    old_map = {g['file']: g for g in old.get('graphs', [])}
    new_map = {g['file']: g for g in new.get('graphs', [])}

    files = sorted(set(old_map.keys()) | set(new_map.keys()))
    details = []
    for f in files:
        og = old_map.get(f, {'file': f, 'domain': 'unknown', 'nodes': [], 'edges': []})
        ng = new_map.get(f, {'file': f, 'domain': 'unknown', 'nodes': [], 'edges': []})
        details.append(diff_graph(og, ng))

    summary = {
        'graphs_changed': sum(1 for d in details if d['nodes_added'] or d['nodes_removed'] or d['edges_added'] or d['edges_removed']),
        'nodes_added_total': sum(len(d['nodes_added']) for d in details),
        'nodes_removed_total': sum(len(d['nodes_removed']) for d in details),
        'edges_added_total': sum(len(d['edges_added']) for d in details),
        'edges_removed_total': sum(len(d['edges_removed']) for d in details),
    }

    out = {
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'baseline_snapshot': old_snap_path.name,
        'current_snapshot': new_snap_path.name,
        'summary': summary,
        'details': details,
    }

    delta_name = f"delta-{old_snap_path.stem.replace('snapshot-','')}-to-{new_snap_path.stem.replace('snapshot-','')}.json"
    delta_path = SNAP_DIR / delta_name
    delta_path.write_text(json.dumps(out, indent=2))

    md_path = SNAP_DIR / delta_name.replace('.json', '.md')
    md_lines = [
        '# Agent Relationship Delta Report',
        '',
        f"Generated: {out['generated_at']}",
        f"Baseline: `{out['baseline_snapshot']}`",
        f"Current: `{out['current_snapshot']}`",
        '',
        '## Summary',
        '',
        f"- Graphs changed: {summary['graphs_changed']}",
        f"- Nodes added: {summary['nodes_added_total']}",
        f"- Nodes removed: {summary['nodes_removed_total']}",
        f"- Edges added: {summary['edges_added_total']}",
        f"- Edges removed: {summary['edges_removed_total']}",
        '',
        '## Per Graph',
        ''
    ]
    for d in details:
        md_lines.append(f"### {d['domain']} ({d['file']})")
        md_lines.append(f"- Node count: {d['node_count_old']} -> {d['node_count_new']}")
        md_lines.append(f"- Edge count: {d['edge_count_old']} -> {d['edge_count_new']}")
        md_lines.append(f"- Nodes added: {len(d['nodes_added'])}")
        md_lines.append(f"- Nodes removed: {len(d['nodes_removed'])}")
        md_lines.append(f"- Edges added: {len(d['edges_added'])}")
        md_lines.append(f"- Edges removed: {len(d['edges_removed'])}")
        md_lines.append('')
    md_path.write_text('\n'.join(md_lines) + '\n')

    return delta_path, md_path


def update_latest_pointers(snapshot_path: Path, delta_json: Optional[Path], delta_md: Optional[Path]):
    latest_snapshot = SNAP_DIR / 'latest-snapshot.json'
    latest_snapshot.write_text(snapshot_path.read_text())

    if delta_json and delta_md:
        (SNAP_DIR / 'latest-delta.json').write_text(delta_json.read_text())
        (SNAP_DIR / 'latest-delta.md').write_text(delta_md.read_text())


def main():
    parser = argparse.ArgumentParser(description='Create graph snapshots and temporal diffs.')
    parser.add_argument('--tag', help='snapshot tag (defaults to UTC timestamp)')
    args = parser.parse_args()

    tag = args.tag or now_stamp()
    new_snap = write_snapshot(tag)

    snaps = list_snapshots()
    prev = None
    if len(snaps) >= 2:
        prev = snaps[-2]

    delta_json = None
    delta_md = None
    if prev is not None:
        delta_json, delta_md = build_delta(prev, new_snap)
    else:
        init_md = SNAP_DIR / 'latest-delta.md'
        init_md.write_text('# Agent Relationship Delta Report\n\nNo previous snapshot available yet.\n')
        init_json = SNAP_DIR / 'latest-delta.json'
        init_json.write_text(json.dumps({'note': 'No previous snapshot available yet.'}, indent=2))
        delta_json, delta_md = init_json, init_md

    update_latest_pointers(new_snap, delta_json, delta_md)

    print(f'wrote snapshot: {new_snap}')
    if prev is not None:
        print(f'compared against: {prev.name}')
        print(f'wrote delta: {delta_json}')
        print(f'wrote delta markdown: {delta_md}')
    else:
        print('no previous snapshot found; initialized latest-delta placeholders')


if __name__ == '__main__':
    main()
