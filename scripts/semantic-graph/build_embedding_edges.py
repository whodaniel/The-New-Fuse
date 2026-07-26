#!/usr/bin/env python3
"""Build embedding_similar edges from live pgvector for the unified semantic graph.

Joins:
  KNOWLEDGE_TREE.json leaves (index → vector_id / legacy_vector_id)
    ↕ metadata.index / ID|VEC#:INTEL-{index}
  public.vector_embeddings (namespace=intelligence)

Outputs:
  concordance_results/embedding_edges.json
    { generated, namespace, k, min_sim, edges:[{s,t,type,w,sim,index_s,index_t}] }

Edges use kleaf:{vector_id} node ids so build_unified_graph can merge them.
"""
from __future__ import annotations

import json
import os
import time
from collections import defaultdict

import psycopg2

from common import OUT, ROOT, kb_vector_id

NAMESPACE = os.getenv("TNF_EMBED_NAMESPACE", "intelligence")
K = int(os.getenv("TNF_EMBED_K", "8"))
MIN_SIM = float(os.getenv("TNF_EMBED_MIN_SIM", "0.78"))
DATABASE_URL = os.getenv("DATABASE_URL", "")


def load_index_to_kleaf():
    """Map KB index → canonical kleaf node id (VEC#: preferred)."""
    kt_path = os.path.join(ROOT, "KNOWLEDGE_TREE.json")
    kt = json.load(open(kt_path, encoding="utf-8"))
    idx_map = {}
    for _lib, ld in (kt.get("libraries") or {}).items():
        for _cls, cd in (ld.get("classes") or {}).items():
            for leaf in cd.get("leaves") or []:
                if not isinstance(leaf, dict) or "index" not in leaf:
                    continue
                idx = int(leaf["index"])
                vid = leaf.get("vector_id") or kb_vector_id(idx)
                legacy = leaf.get("legacy_vector_id") or kb_vector_id(idx, legacy=True)
                idx_map[idx] = {
                    "kleaf": f"kleaf:{vid}",
                    "vector_id": vid,
                    "legacy_vector_id": legacy,
                }
    return idx_map


def parse_intel_index(row_id: str, metadata: dict | None) -> int | None:
    meta = metadata or {}
    if meta.get("index") is not None:
        try:
            return int(meta["index"])
        except (TypeError, ValueError):
            pass
    for prefix in ("VEC#:INTEL-", "ID#:INTEL-"):
        if row_id.startswith(prefix):
            try:
                return int(row_id[len(prefix) :])
            except ValueError:
                return None
    return None


def fetch_knn_edges(idx_map: dict) -> list[dict]:
    if not DATABASE_URL:
        raise SystemExit("DATABASE_URL is required for embedding edges")
    import numpy as np

    conn = psycopg2.connect(DATABASE_URL, connect_timeout=15)
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, metadata, embedding::text
        FROM vector_embeddings
        WHERE namespace = %s
        """,
        (NAMESPACE,),
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    indexes: list[int] = []
    vectors: list[list[float]] = []
    for rid, meta, emb_txt in rows:
        idx = parse_intel_index(rid, meta if isinstance(meta, dict) else {})
        if idx is None or idx not in idx_map:
            continue
        vectors.append([float(x) for x in emb_txt.strip("[]").split(",") if x])
        indexes.append(idx)

    print(f"  pgvector rows={len(rows)} joinable_by_index={len(indexes)} kt_indexes={len(idx_map)}")
    if not indexes:
        return []

    mat = np.asarray(vectors, dtype=np.float32)
    norms = np.linalg.norm(mat, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    mat = mat / norms
    sims = mat @ mat.T  # cosine similarity

    edges = []
    seen = set()
    n = len(indexes)
    # Exclude self by setting diagonal very low before top-K.
    np.fill_diagonal(sims, -1.0)
    for i in range(n):
        row = sims[i]
        # argpartition for top-K
        if K >= n - 1:
            top = np.argsort(row)[::-1][:K]
        else:
            part = np.argpartition(row, -K)[-K:]
            top = part[np.argsort(row[part])[::-1]]
        idx_i = indexes[i]
        for j in top:
            sim = float(row[j])
            if sim < MIN_SIM:
                break
            idx_j = indexes[int(j)]
            a = idx_map[idx_i]["kleaf"]
            b = idx_map[idx_j]["kleaf"]
            if a == b:
                continue
            key = tuple(sorted((a, b)))
            if key in seen:
                continue
            seen.add(key)
            edges.append(
                {
                    "s": a,
                    "t": b,
                    "type": "embedding_similar",
                    "w": round(sim, 4),
                    "sim": round(sim, 4),
                    "index_s": idx_i,
                    "index_t": idx_j,
                }
            )
    return edges


def main():
    os.makedirs(OUT, exist_ok=True)
    print("[embed] loading KNOWLEDGE_TREE index map...")
    idx_map = load_index_to_kleaf()
    print(f"[embed] querying pgvector knn k={K} min_sim={MIN_SIM}...")
    edges = fetch_knn_edges(idx_map)
    payload = {
        "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "namespace": NAMESPACE,
        "k": K,
        "min_sim": MIN_SIM,
        "edges": edges,
        "count": len(edges),
    }
    out_path = os.path.join(OUT, "embedding_edges.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f)
    print(f"[embed] wrote {len(edges)} edges -> {out_path}")


if __name__ == "__main__":
    main()
