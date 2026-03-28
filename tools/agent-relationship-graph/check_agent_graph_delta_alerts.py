#!/usr/bin/env python3
"""Check latest graph delta against configurable alert thresholds."""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
SNAP_DIR = SCRIPT_DIR / 'snapshots'


def load_latest_delta() -> dict:
    p = SNAP_DIR / 'latest-delta.json'
    if not p.exists():
        raise FileNotFoundError(f'Missing {p}')
    return json.loads(p.read_text())


def evaluate(delta: dict, max_graphs_changed: int, max_nodes_added: int, max_nodes_removed: int, max_edges_added: int, max_edges_removed: int):
    summary = delta.get('summary', {})
    checks = {
        'graphs_changed': (summary.get('graphs_changed', 0), max_graphs_changed),
        'nodes_added_total': (summary.get('nodes_added_total', 0), max_nodes_added),
        'nodes_removed_total': (summary.get('nodes_removed_total', 0), max_nodes_removed),
        'edges_added_total': (summary.get('edges_added_total', 0), max_edges_added),
        'edges_removed_total': (summary.get('edges_removed_total', 0), max_edges_removed),
    }

    breaches = []
    for metric, (value, threshold) in checks.items():
        if value > threshold:
            breaches.append({'metric': metric, 'value': value, 'threshold': threshold})

    return checks, breaches


def main():
    parser = argparse.ArgumentParser(description='Check latest graph delta against alert thresholds.')
    parser.add_argument('--max-graphs-changed', type=int, default=8)
    parser.add_argument('--max-nodes-added', type=int, default=3)
    parser.add_argument('--max-nodes-removed', type=int, default=1)
    parser.add_argument('--max-edges-added', type=int, default=60)
    parser.add_argument('--max-edges-removed', type=int, default=3)
    parser.add_argument('--strict-exit', action='store_true', help='Exit non-zero if thresholds are breached')
    args = parser.parse_args()

    delta = load_latest_delta()
    checks, breaches = evaluate(
        delta,
        args.max_graphs_changed,
        args.max_nodes_added,
        args.max_nodes_removed,
        args.max_edges_added,
        args.max_edges_removed,
    )

    result = {
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'baseline_snapshot': delta.get('baseline_snapshot'),
        'current_snapshot': delta.get('current_snapshot'),
        'thresholds': {
            'max_graphs_changed': args.max_graphs_changed,
            'max_nodes_added': args.max_nodes_added,
            'max_nodes_removed': args.max_nodes_removed,
            'max_edges_added': args.max_edges_added,
            'max_edges_removed': args.max_edges_removed,
        },
        'values': {k: v for k, (v, _) in checks.items()},
        'breaches': breaches,
        'status': 'alert' if breaches else 'ok',
    }

    out_json = SNAP_DIR / 'latest-alert.json'
    out_md = SNAP_DIR / 'latest-alert.md'
    out_json.write_text(json.dumps(result, indent=2))

    lines = [
        '# Agent Relationship Delta Alert',
        '',
        f"Generated: {result['generated_at']}",
        f"Status: **{result['status'].upper()}**",
        f"Baseline: `{result.get('baseline_snapshot')}`",
        f"Current: `{result.get('current_snapshot')}`",
        '',
        '## Metrics',
        '',
    ]
    for k, (value, threshold) in checks.items():
        lines.append(f"- {k}: {value} (max {threshold})")

    lines.append('')
    lines.append('## Breaches')
    lines.append('')
    if breaches:
        for b in breaches:
            lines.append(f"- {b['metric']}: {b['value']} > {b['threshold']}")
    else:
        lines.append('- None')
    lines.append('')

    out_md.write_text('\n'.join(lines))

    print(f'wrote {out_json}')
    print(f'wrote {out_md}')

    if breaches and args.strict_exit:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
