#!/usr/bin/env python3
"""Agent relationship graph centrality and community analytics.

Reads the master graph JSON and all domain subgraph JSONs, computes
degree / closeness / betweenness / eigenvector centrality plus label-
propagation communities, and writes a JSON + Markdown report.
"""
import json
from pathlib import Path
from collections import defaultdict, deque

SCRIPT_DIR = Path(__file__).resolve().parent
SUBGRAPHS_DIR = SCRIPT_DIR / 'subgraphs'
REPORTS_DIR = SCRIPT_DIR / 'reports'
REPORTS_DIR.mkdir(exist_ok=True)

GRAPH_FILES = [
    SCRIPT_DIR / 'agent-relationship-graph.json',
    SUBGRAPHS_DIR / 'agent-relationship-podcast-subgraph.json',
    SUBGRAPHS_DIR / 'agent-relationship-seo-subgraph.json',
    SUBGRAPHS_DIR / 'agent-relationship-brand-subgraph.json',
    SUBGRAPHS_DIR / 'agent-relationship-funnel-subgraph.json',
    SUBGRAPHS_DIR / 'agent-relationship-social-subgraph.json',
    SUBGRAPHS_DIR / 'agent-relationship-ops-subgraph.json',
    SUBGRAPHS_DIR / 'agent-relationship-content-subgraph.json',
]

def build_maps(nodes, edges):
    ids = [n['id'] for n in nodes]
    out_n = {i: [] for i in ids}
    in_n = {i: [] for i in ids}
    und = {i: set() for i in ids}
    for e in edges:
        s, t = e['source'], e['target']
        if s in out_n and t in in_n:
            out_n[s].append(t)
            in_n[t].append(s)
            und[s].add(t)
            und[t].add(s)
    return ids, out_n, in_n, und

def degree_scores(ids, out_n, in_n):
    return {i: {'in': len(in_n[i]), 'out': len(out_n[i]), 'total': len(in_n[i])+len(out_n[i])} for i in ids}

def closeness_scores(ids, und):
    n = len(ids)
    scores = {}
    for s in ids:
        dist = {s: 0}
        q = deque([s])
        while q:
            v = q.popleft()
            for w in und[v]:
                if w not in dist:
                    dist[w] = dist[v] + 1
                    q.append(w)
        reach = len(dist)
        if reach <= 1:
            scores[s] = 0.0
            continue
        total_dist = sum(dist.values())
        base = (reach - 1) / total_dist if total_dist > 0 else 0.0
        scores[s] = base * ((reach - 1) / (n - 1)) if n > 1 else 0.0
    return scores

def betweenness_scores(ids, und):
    # Brandes (unweighted, undirected)
    C = {v: 0.0 for v in ids}
    for s in ids:
        S = []
        P = {v: [] for v in ids}
        sigma = dict.fromkeys(ids, 0.0)
        sigma[s] = 1.0
        d = dict.fromkeys(ids, -1)
        d[s] = 0
        Q = deque([s])
        while Q:
            v = Q.popleft()
            S.append(v)
            for w in und[v]:
                if d[w] < 0:
                    Q.append(w)
                    d[w] = d[v] + 1
                if d[w] == d[v] + 1:
                    sigma[w] += sigma[v]
                    P[w].append(v)
        delta = dict.fromkeys(ids, 0.0)
        while S:
            w = S.pop()
            for v in P[w]:
                if sigma[w] != 0:
                    delta[v] += (sigma[v] / sigma[w]) * (1.0 + delta[w])
            if w != s:
                C[w] += delta[w]
    n = len(ids)
    if n > 2:
        scale = 1.0 / ((n - 1) * (n - 2) / 2)
        for v in C:
            C[v] *= scale
    return C

def eigenvector_scores(ids, und, iters=100, tol=1e-8):
    n = len(ids)
    if n == 0:
        return {}
    x = {i: 1.0 / n for i in ids}
    for _ in range(iters):
        x_new = {i: 0.0 for i in ids}
        for i in ids:
            for j in und[i]:
                x_new[i] += x[j]
        norm = sum(v * v for v in x_new.values()) ** 0.5
        if norm == 0:
            return {i: 0.0 for i in ids}
        x_new = {i: v / norm for i, v in x_new.items()}
        diff = sum(abs(x_new[i] - x[i]) for i in ids)
        x = x_new
        if diff < tol:
            break
    return x

def label_propagation_communities(ids, und, rounds=25):
    labels = {i: i for i in ids}
    order = sorted(ids)
    for _ in range(rounds):
        changed = False
        for v in order:
            if not und[v]:
                continue
            counts = defaultdict(int)
            for n in und[v]:
                counts[labels[n]] += 1
            max_count = max(counts.values())
            best = sorted([k for k, c in counts.items() if c == max_count])[0]
            if labels[v] != best:
                labels[v] = best
                changed = True
        if not changed:
            break
    comm = defaultdict(list)
    for v, l in labels.items():
        comm[l].append(v)
    out = []
    for idx, members in enumerate(sorted(comm.values(), key=lambda m: (-len(m), m[0])), start=1):
        out.append({'community_id': idx, 'size': len(members), 'members': sorted(members)})
    return out

def topk(mapping, k=5):
    return [
        {'id': i, 'score': float(f'{v:.6f}')}
        for i, v in sorted(mapping.items(), key=lambda kv: (-kv[1], kv[0]))[:k]
    ]

def analyze_graph(path):
    data = json.loads(path.read_text())
    nodes = data.get('nodes', [])
    edges = data.get('edges', [])
    ids, out_n, in_n, und = build_maps(nodes, edges)

    deg = degree_scores(ids, out_n, in_n)
    total_deg = {i: deg[i]['total'] for i in ids}
    close = closeness_scores(ids, und)
    btw = betweenness_scores(ids, und)
    eig = eigenvector_scores(ids, und)
    comm = label_propagation_communities(ids, und)

    return {
        'graph_file': path.name,
        'domain': data.get('domain', 'full'),
        'node_count': len(nodes),
        'edge_count': len(edges),
        'top_degree': topk(total_deg),
        'top_betweenness': topk(btw),
        'top_closeness': topk(close),
        'top_eigenvector': topk(eig),
        'communities': comm,
        'degree_detail': deg,
    }

if __name__ == '__main__':
    from datetime import datetime, timezone
    stamp = datetime.now(timezone.utc).strftime('%Y-%m-%d')

    results = [analyze_graph(p) for p in GRAPH_FILES if p.exists()]

    json_out = REPORTS_DIR / 'agent-relationship-centrality-report.json'
    json_out.write_text(json.dumps({'generated_at': stamp, 'reports': results}, indent=2))

    md_lines = ['# Agent Relationship Centrality Report', '', f'Generated: {stamp}', '']
    for r in results:
        md_lines.append(f"## {r['domain']} ({r['graph_file']})")
        md_lines.append('')
        md_lines.append(f"- Nodes: {r['node_count']}")
        md_lines.append(f"- Edges: {r['edge_count']}")
        md_lines.append(f"- Communities: {len(r['communities'])}")
        md_lines.append('- Top degree hubs:')
        for x in r['top_degree']:
            md_lines.append(f"  - {x['id']}: {x['score']}")
        md_lines.append('- Top betweenness hubs:')
        for x in r['top_betweenness']:
            md_lines.append(f"  - {x['id']}: {x['score']}")
        md_lines.append('')

    md_out = REPORTS_DIR / 'agent-relationship-centrality-report.md'
    md_out.write_text('\n'.join(md_lines) + '\n')
    print(f'wrote {json_out}')
    print(f'wrote {md_out}')
