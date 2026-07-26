#!/usr/bin/env python3
"""Merge TNF semantic systems into a unified graph dataset.

Sources: compounding-memory wiki, doc concept KG, codebase map, agent graphs,
KNOWLEDGE_TREE.json, wordcount terms + concordance per-file index.
Outputs:
  concordance_results/unified_graph.json.gz          system origins only (distributable)
  concordance_results/user/unified_graph_full.json.gz  system + user origins (local only)
"""
import os, re, json, gzip, glob, time
from collections import Counter, defaultdict

from common import (ROOT, OUT, slugify, kb_vector_id, SYSTEM_ORIGINS, USER_ORIGINS,
                    PERSONAL_IDENTIFIERS, ensure_user_out, contains_personal_identifier,
                    redact_personal_identifiers, normalize_edge_type)

MAX_CONCEPTS = 25000
CONCEPT_MIN_FREQ = 5
MENTION_TOP_SOURCES = 4
TOP_TERMS = 500
TERM_MAX_FILES = 40

nodes = {}   # id -> dict
edges = []   # (src, tgt, type, weight)
stats = Counter()

def add_node(nid, label, ntype, origin, weight=1, meta=None):
    if nid not in nodes:
        nodes[nid] = {"id": nid, "label": label, "type": ntype, "origin": origin,
                      "weight": weight, "meta": meta or {}}
        stats[f"nodes.{origin}"] += 1
    else:
        n = nodes[nid]
        n["weight"] = max(n["weight"], weight)
        if origin not in n["meta"].get("also", []) and origin != n["origin"]:
            n["meta"].setdefault("also", []).append(origin)
            stats["nodes.cross_origin_merged"] += 1
    return nid

def add_edge(s, t, etype, w=1.0):
    edges.append((s, t, etype, round(float(w), 3)))
    stats[f"edges.{etype}"] += 1

def path_node(relpath):
    return add_node(f"path:{relpath}", relpath, "file", "filesystem")

# ---------------------------------------------------------------- 1. wiki
print("[1/8] wiki pages...")
wiki_dir = os.path.join(ROOT, "packages/compounding-memory/wiki")
wiki_stems = set()
wiki_links = []
for fp in glob.glob(os.path.join(wiki_dir, "*.md")):
    stem = os.path.splitext(os.path.basename(fp))[0]
    if stem == "INDEX":
        continue
    wiki_stems.add(stem)
    try:
        text = open(fp, encoding="utf-8", errors="ignore").read()
    except OSError:
        continue
    m = re.search(r"^#\s+(.+)$", text, re.M)
    title = m.group(1).strip() if m else stem
    cat = "wiki"
    mc = re.search(r"\*\*Category:?\*\*:?\s*(\w+)", text, re.I)
    if mc:
        cat = mc.group(1).lower()
    add_node(f"wiki:{stem}", title, "wiki", "wiki", meta={"category": cat})
    for link in re.findall(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]", text):
        wiki_links.append((stem, link.strip()))

for stem, link in wiki_links:
    tgt = link if link in wiki_stems else slugify(link) if slugify(link) in wiki_stems else None
    if tgt and tgt != stem:
        add_edge(f"wiki:{stem}", f"wiki:{tgt}", "backlink")

# map slug -> wiki id for doc-path linking (wiki stems look like doc-docs-guides-deployment-guide)
wiki_by_slug = {s: f"wiki:{s}" for s in wiki_stems}

# ------------------------------------------------- 2. memory-graph clusters
print("[2/8] memory-graph clusters...")
try:
    mg = json.load(open(os.path.join(ROOT, "data/memory-graph.json")))
    for cluster in mg:
        cid = add_node(f"cluster:{slugify(cluster['id'])[:80]}", cluster.get("label", cluster["id"]),
                       "cluster", "memory-graph")
        for item in cluster.get("items", []):
            iid = item.get("id", "")
            if iid in wiki_stems:
                add_edge(cid, f"wiki:{iid}", "cluster_member")
            else:
                w = add_node(f"wiki:{iid}", item.get("content", iid)[:120], "wiki", "memory-graph")
                add_edge(cid, w, "cluster_member")
except (OSError, json.JSONDecodeError, KeyError) as e:
    print("  memory-graph skipped:", e)

# ---------------------------------------------------------- 3. concept KG
print("[3/8] concept knowledge graph (43MB)...")
kg = json.load(open(os.path.join(ROOT, ".documentation-system/analysis/knowledge-graph.public.json")))
concepts = kg.get("concepts", {})
relationships = kg.get("relationships", [])

keep = set()
for r in relationships:
    keep.add(r["from"]); keep.add(r["to"])
ranked = sorted(((c, v.get("frequency", 0)) for c, v in concepts.items()
                 if c not in keep and v.get("frequency", 0) >= CONCEPT_MIN_FREQ),
                key=lambda x: -x[1])
for c, _ in ranked[:max(0, MAX_CONCEPTS - len(keep))]:
    keep.add(c)

def concept_id(name):
    return f"concept:{slugify(name)[:100]}"

for c in keep:
    v = concepts.get(c, {})
    freq = v.get("frequency", 1)
    add_node(concept_id(c), c, "concept", "concept-kg", weight=freq)
    for src in v.get("sources", [])[:MENTION_TOP_SOURCES]:
        add_edge(concept_id(c), path_node(src), "mentioned_in", min(freq, 50))

for r in relationships:
    add_edge(concept_id(r["from"]), concept_id(r["to"]),
             f"rel_{slugify(r.get('type','related'))}")

# --------------------------------------------------------- 4. codebase map
print("[4/8] codebase map...")
cm = json.load(open(os.path.join(ROOT, "apps/frontend/src/data/codebase_map.json")))
code_file_labels = {}
for n in cm.get("nodes", []):
    d = n.get("data", {})
    kind = d.get("kind", n.get("type", "code"))
    label = d.get("label", n["id"])
    label = re.sub(r"^(File|Class|Method):\s*", "", label)
    nid = add_node(f"code:{n['id']}", label, kind, "codebase-map",
                   weight=1 + d.get("childCount", 0))
    pid = d.get("parentId")
    if pid:
        add_edge(f"code:{pid}", nid, "contains")
    if kind == "file":
        code_file_labels.setdefault(label, []).append(nid)

# ---------------------------------------------------------- 5. agent graphs
print("[5/8] agent graphs...")
def agent_id(name):
    return f"agent:{slugify(re.sub(r'^agent:', '', str(name).lower()))[:80]}"

ag = json.load(open(os.path.join(ROOT,
    "apps/frontend/public/visualizations/graphs/agent-relationship-graph/agent-relationship-graph.json")))
for n in ag.get("nodes", []):
    add_node(agent_id(n["id"]), n["id"], "agent", "agent-graph",
             meta={"kind": n.get("kind"), "cluster": n.get("cluster")})
for e in ag.get("edges", ag.get("links", [])):
    add_edge(agent_id(e["source"]), agent_id(e["target"]),
             e.get("type", "related"), e.get("strength", 1))

fg = json.load(open(os.path.join(ROOT,
    "apps/frontend/public/visualizations/graphs/framework-master-graph/master-framework-graph.json")))
fg_nodes = fg.get("nodes", [])
fg_id_map = {}
for n in fg_nodes:
    raw = n["id"]
    kind = n.get("kind", "service")
    if kind == "agent" or str(raw).startswith("agent:"):
        nid = agent_id(raw)
        add_node(nid, n.get("label", raw), "agent", "framework-graph",
                 meta={"group": n.get("group")})
    else:
        nid = add_node(f"fw:{slugify(str(raw))[:80]}", n.get("label", raw), kind,
                       "framework-graph", meta={"group": n.get("group")})
    fg_id_map[raw] = nid
for e in fg.get("edges", fg.get("links", [])):
    s = fg_id_map.get(e["source"]); t = fg_id_map.get(e["target"])
    if s and t:
        add_edge(s, t, e.get("type", "related"), e.get("weight", 1))

# -------------------------------------------------------- 6. knowledge tree
print("[6/8] knowledge tree...")
kt = json.load(open(os.path.join(ROOT, "KNOWLEDGE_TREE.json")))
kt_root = add_node("ktree:root", "KNOWLEDGE_TREE", "library", "knowledge-tree",
                   meta={"merkle_root": kt.get("root", "")[:16]})
for lib, ldata in kt.get("libraries", {}).items():
    lid = add_node(f"ktree:{slugify(lib)}", lib, "library", "knowledge-tree")
    add_edge(kt_root, lid, "contains")
    for cls, cdata in ldata.get("classes", {}).items():
        cid = add_node(f"ktree:{slugify(lib)}/{slugify(cls)}", f"{lib} / {cls}",
                       "taxonomy-class", "knowledge-tree")
        add_edge(lid, cid, "contains")
        leaves = cdata.get("leaves", cdata if isinstance(cdata, list) else [])
        if isinstance(leaves, list):
            for leaf in leaves:
                if not isinstance(leaf, dict):
                    continue
                vid = leaf.get("vector_id")
                if not vid:
                    continue
                idx = leaf.get("index")
                meta = {"index": idx, "vector_id": vid}
                if leaf.get("legacy_vector_id"):
                    meta["legacy_vector_id"] = leaf["legacy_vector_id"]
                lf = add_node(f"kleaf:{vid}", vid, "kb-entry", "knowledge-tree", meta=meta)
                add_edge(cid, lf, "classified_as")
    for fname in ldata.get("files", {}):
        add_edge(lid, path_node(f"docs/protocols/{fname}" if "/" not in fname else fname),
                 "tracks_integrity")

# --------------------------------------------- 7. terms + per-file index
print("[7/8] terms + per-file index...")
STOP = {"the", "and", "for", "this", "that", "with", "from", "return", "const",
        "function", "var", "let", "null", "true", "false", "import", "export",
        "new", "not", "are", "was", "has", "have", "you", "all", "can", "will"}
top_terms = []
with gzip.open(os.path.join(OUT, "wordcount_full.tsv.gz"), "rt", encoding="utf-8") as f:
    next(f)
    for line in f:
        term, cnt = line.rstrip("\n").split("\t")
        if len(term) < 3 or term.lower() in STOP:
            continue
        top_terms.append((term, int(cnt)))
        if len(top_terms) >= TOP_TERMS:
            break
term_set = {t.lower(): (t, c) for t, c in top_terms}
for t, c in top_terms:
    add_node(f"term:{t.lower()}", t, "term", "wordcount", weight=c)

term_files = defaultdict(list)  # term_lower -> [(count, path)]
with gzip.open(os.path.join(OUT, "per_file_index.tsv.gz"), "rt", encoding="utf-8") as f:
    for line in f:
        try:
            fpath, rest = line.rstrip("\n").split("\t", 1)
        except ValueError:
            continue
        for entry in rest.split(";"):
            w, _, lines_ = entry.partition(":")
            wl = w.lower()
            if wl in term_set:
                cnt = lines_.count(",") + 1 + (int(lines_.split("+")[-1]) if ".." in lines_ else 0)
                term_files[wl].append((cnt, fpath))

for wl, lst in term_files.items():
    lst.sort(reverse=True)
    for cnt, fpath in lst[:TERM_MAX_FILES]:
        add_edge(f"term:{wl}", path_node(fpath), "occurs_in", cnt)

# ----------------------------------------- 8. KB sections + vector IDs
print("[8/12] AI knowledge base sections...")

kb_sections = {}
try:
    kb_text = open(os.path.join(ROOT, "data/AI_Knowledge_Base.md"), encoding="utf-8", errors="ignore").read()
    for sec in kb_text.split("---"):
        m = re.search(r"## #(\d+):\s*(.+)", sec)
        if not m:
            continue
        idx, title = int(m.group(1)), m.group(2).strip()
        url = (re.search(r"\*\*URL\*\*:\s*(\S+)", sec) or [None, None])[1]
        trp = (re.search(r"trp://wiki-inbox/([\w.-]+\.json)", sec) or [None, None])[1]
        kb_sections[idx] = (title, url, trp)
    for idx, (title, url, trp) in kb_sections.items():
        vid = kb_vector_id(idx)
        nid = f"kleaf:{vid}"
        if nid in nodes:
            nodes[nid]["label"] = f"#{idx}: {title[:70]}"
            nodes[nid]["meta"].update({"kb_index": idx, "url": url, "vector_id": vid})
        else:
            add_node(nid, f"#{idx}: {title[:70]}", "kb-entry", "knowledge-tree",
                     meta={"kb_index": idx, "url": url, "vector_id": vid})
        if trp:
            add_edge(nid, f"inbox:{os.path.splitext(trp)[0]}", "resource_pointer")
except OSError as e:
    print("  KB skipped:", e)

# ----------------------------------------- 8b. live pgvector embedding edges
print("[8b/12] embedding_similar edges (pgvector)...")
_embed_path = os.path.join(OUT, "embedding_edges.json")
_embed_count = 0
if os.path.isfile(_embed_path):
    try:
        _embed = json.load(open(_embed_path, encoding="utf-8"))
        for ee in _embed.get("edges") or []:
            s, t = ee.get("s"), ee.get("t")
            if not s or not t or s not in nodes or t not in nodes:
                continue
            add_edge(s, t, "embedding_similar", ee.get("w") or ee.get("sim") or 1)
            _embed_count += 1
        print(f"  loaded {_embed_count} embedding_similar edges from embedding_edges.json")
    except (OSError, json.JSONDecodeError) as e:
        print("  embedding edges skipped:", e)
else:
    print("  embedding_edges.json missing — run build_embedding_edges.py first")

# ------------------------------------------------- 9. wiki-inbox packets
print("[9/12] wiki-inbox packets...")
for fp in glob.glob(os.path.join(ROOT, "data/wiki-inbox/*.json")):
    try:
        pkt = json.load(open(fp, encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        continue
    pid = pkt.get("id", os.path.splitext(os.path.basename(fp))[0])
    add_node(f"inbox:{pid}", pkt.get("title", pid)[:90], "inbox-packet", "wiki-inbox",
             meta={"category": pkt.get("category")})
    for bl in pkt.get("backlinks", []) or []:
        tgt = bl if bl in wiki_stems else slugify(str(bl))
        if tgt in wiki_stems:
            add_edge(f"inbox:{pid}", f"wiki:{tgt}", "backlink")
        elif concept_id(str(bl)) in nodes:
            add_edge(f"inbox:{pid}", concept_id(str(bl)), "backlink")
        elif f"term:{str(bl).lower()}" in nodes:
            add_edge(f"inbox:{pid}", f"term:{str(bl).lower()}", "backlink")

# --------------------------------------------- 10. UTP handoff lineage
print("[10/12] UTP handoff session lineage (14k events)...")
sessions = {}   # context -> {actor, first_ts, last_ts, count}
utp_dir = os.path.join(ROOT, "data/utp_events")
if os.path.isdir(utp_dir):
    for fn in os.listdir(utp_dir):
        if not fn.endswith(".json"):
            continue
        try:
            ev = json.load(open(os.path.join(utp_dir, fn), encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        ctx = (ev.get("source") or {}).get("context") or "unknown"
        actor = ((ev.get("actor") or {}).get("handle")
                 or (ev.get("actor") or {}).get("id") or "unknown")
        ts = ev.get("timestamp", "")
        s = sessions.setdefault(ctx, {"actor": actor, "first": ts, "last": ts, "count": 0})
        s["count"] += 1
        if ts < s["first"]:
            s["first"] = ts
        if ts > s["last"]:
            s["last"] = ts

    MANY = len(sessions) > 4000
    by_actor = defaultdict(list)
    for ctx, s in sessions.items():
        key = f"{s['actor']}/{s['first'][:10]}" if MANY else ctx
        by_actor[(s["actor"], key)].append(s)

    actor_days = defaultdict(list)  # actor -> [(first_ts, node_id, count)]
    for (actor, key), lst in by_actor.items():
        cnt = sum(x["count"] for x in lst)
        first = min(x["first"] for x in lst)
        last = max(x["last"] for x in lst)
        label = key if not MANY else f"{actor} {key.split('/')[-1]}"
        nid = add_node(f"session:{slugify(key)[:90]}", label[:90], "session", "handoff",
                       weight=cnt, meta={"events": cnt, "first": first[:19], "last": last[:19],
                                          "sessions_merged": len(lst) if MANY else 1})
        aid = add_node(f"actor:{slugify(actor)}", actor, "actor", "handoff")
        add_edge(aid, nid, "ran_session", cnt)
        actor_days[aid].append((first, nid))
    for aid, lst in actor_days.items():
        lst.sort()
        for i in range(1, len(lst)):
            add_edge(lst[i - 1][1], lst[i][1], "handoff_chain")
    print(f"  {len(sessions)} sessions -> {sum(len(v) for v in actor_days.values())} nodes (aggregated={MANY})")

# repo handoff-current causal chain
try:
    hc = json.load(open(os.path.join(ROOT, ".agent/handoff-current.json")))
    hid = add_node(f"handoff:{slugify(hc.get('handoff_id','current'))[:80]}",
                   hc.get("handoff_id", "handoff-current"), "handoff-packet", "handoff",
                   meta={"created_at": hc.get("created_at"), "branch": hc.get("branch")})
except (OSError, json.JSONDecodeError):
    pass

# ------------------------------------------- 11. observatory agent index
print("[11/12] observatory agents...")
try:
    obs = json.load(open(os.path.join(ROOT, "apps/frontend/public/observatory/agents.index.json")))
    for a in obs.get("agents", []):
        aid = add_node(agent_id(a["id"]), a.get("name", a["id"]), "agent", "observatory",
                       meta={"description": (a.get("description") or "")[:160]})
        for tool in a.get("tools", []) or []:
            tid = add_node(f"tool:{slugify(str(tool))[:60]}", str(tool), "tool", "observatory")
            add_edge(aid, tid, "uses_tool")
        for rc in (a.get("semantic") or {}).get("relatedConcepts", [])[:10]:
            cname = rc.get("concept") if isinstance(rc, dict) else str(rc)
            score = rc.get("score", 1) if isinstance(rc, dict) else 1
            cid = concept_id(cname)
            if cid in nodes:
                add_edge(aid, cid, "semantically_related", score)
except (OSError, json.JSONDecodeError) as e:
    print("  observatory skipped:", e)

# ------------------------------------------------------ 12. cross-linking
print("[12/12] cross-links...")
# path <-> wiki page
# Stems are usually `doc-<slugify(path-without-ext)>` but many wiki pages keep
# a trailing `-md` / `-json` from the original extension. Try both.
def wiki_slugs_for_path(rel: str):
    stem, ext = os.path.splitext(rel)
    base = slugify(stem)
    out = {f"doc-{base}", base}
    if ext:
        out.add(f"doc-{slugify(stem + ext)}")  # e.g. doc-apps-frontend-readme-md
        out.add(f"doc-{base}-{ext.lstrip('.').lower()}")
    # basename-only fallback (README.md in many packages)
    bn = os.path.basename(stem)
    if bn and bn.lower() not in ("index", "readme"):
        out.add(f"doc-{slugify(bn)}")
    return out

wiki_docs = 0
for nid in [k for k in nodes if k.startswith("path:")]:
    rel = nid[5:]
    for slug in wiki_slugs_for_path(rel):
        if slug in wiki_by_slug:
            add_edge(wiki_by_slug[slug], nid, "documents")
            wiki_docs += 1
            break
# Reverse: wiki doc-* stems → reconstruct likely repo paths and link if present
for stem, wid in wiki_by_slug.items():
    if not stem.startswith("doc-"):
        continue
    body = stem[4:]
    # Prefer exact path node hits via reconstructed slashy forms
    candidates = [
        body.replace("-", "/"),
        re.sub(r"-md$", ".md", body).replace("-", "/"),
        re.sub(r"-json$", ".json", body).replace("-", "/"),
    ]
    # Also try keeping last segment extension: foo-bar-readme-md → foo/bar/readme.md
    m = re.match(r"^(.+)-([a-z0-9]+)$", body)
    if m:
        candidates.append(m.group(1).replace("-", "/") + "." + m.group(2))
    for cand in candidates:
        pid = f"path:{cand}"
        if pid in nodes:
            add_edge(wid, pid, "documents")
            wiki_docs += 1
            break

# path <-> codebase-map file node (unique basename match)
path_by_base = defaultdict(list)
for nid in [k for k in nodes if k.startswith("path:")]:
    path_by_base[os.path.basename(nid[5:])].append(nid)
for base, code_ids in code_file_labels.items():
    cands = path_by_base.get(base, [])
    if len(cands) == 1 and len(code_ids) == 1:
        add_edge(code_ids[0], cands[0], "same_file")

# term <-> concept lexical match (exact + hyphen/space normalized)
term_index = {t: f"term:{t}" for t in term_set}
for c in keep:
    cl = c.lower().strip()
    variants = {cl, cl.replace("_", " "), cl.replace("-", " "), slugify(cl).replace("-", " ")}
    for v in variants:
        key = v if v in term_index else slugify(v).replace("-", "")
        # try direct term key
        if v in term_set:
            add_edge(concept_id(c), f"term:{v}", "lexical_match")
            break
        # try slug-collapsed term keys
        collapsed = slugify(v)
        if collapsed in term_set:
            add_edge(concept_id(c), f"term:{collapsed}", "lexical_match")
            break

# agent <-> concept name match (exact slug, strip -agent suffix, label tokens)
agent_names = {nid.split(":", 1)[1]: nid for nid in nodes if nid.startswith("agent:")}
agent_aliases = dict(agent_names)
for slug, aid in list(agent_names.items()):
    if slug.endswith("-agent"):
        agent_aliases.setdefault(slug[: -len("-agent")], aid)
    if slug.startswith("agent-"):
        agent_aliases.setdefault(slug[len("agent-"):], aid)
named_as = 0
for c in keep:
    s = slugify(c)
    hit = agent_aliases.get(s)
    if not hit and s.endswith("-agent"):
        hit = agent_aliases.get(s[: -len("-agent")])
    if hit:
        add_edge(hit, concept_id(c), "named_as")
        named_as += 1

print(f"  wiki↔path documents≈{wiki_docs}, agent↔concept named_as≈{named_as}")

# ---------------------------------------------------------------- output
node_list = list(nodes.values())
# drop parallel duplicate edges
seen = set()
edge_list = []
for s, t, ty, w in edges:
    k = (s, t, ty)
    if k in seen or s == t or s not in nodes or t not in nodes:
        continue
    seen.add(k)
    edge_list.append({"s": s, "t": t, "type": ty, "w": w})


def scrub_node_for_system(n):
    """Return a privacy-safe copy of a node for the distributable graph, or None."""
    n2 = dict(n)
    n2["id"] = redact_personal_identifiers(n2["id"])
    n2["label"] = redact_personal_identifiers(n2["label"])
    meta = dict(n2.get("meta") or {})
    for k, v in list(meta.items()):
        if isinstance(v, str):
            meta[k] = redact_personal_identifiers(v)
    if "also" in meta:
        also = [o for o in meta["also"] if o not in USER_ORIGINS or o == "handoff"]
        # Keep handoff in also only after scrub; drop other user-only tags.
        also = [o for o in also if o not in (USER_ORIGINS - {"handoff"})]
        if also:
            meta["also"] = also
        else:
            meta.pop("also", None)
    if "kb_index" in meta:  # private AI_Knowledge_Base.md enrichment
        n2["label"] = meta.get("vector_id") or n2["id"].split(":", 1)[-1]
        meta.pop("kb_index", None)
        meta.pop("url", None)
    n2["meta"] = meta
    probe = f"{n2['id']} {n2['label']} {json.dumps(meta, sort_keys=True)}"
    if contains_personal_identifier(probe):
        return None
    return n2


def system_view(all_nodes, all_edges):
    """Build the distributable artifact.

    - Keep SYSTEM_ORIGINS nodes (incl. wiki-inbox).
    - Promote USER handoff nodes only after PERSONAL_IDENTIFIERS redaction.
    - Drop private KB enrichment and residual personal probes.
    """
    id_map = {}  # original id -> scrubbed id (may be identical)
    out_nodes = []
    for n in all_nodes:
        origin = n["origin"]
        if origin in USER_ORIGINS:
            scrubbed = scrub_node_for_system(n)
            if scrubbed is None:
                continue
            id_map[n["id"]] = scrubbed["id"]
            existing = next((x for x in out_nodes if x["id"] == scrubbed["id"]), None)
            if existing:
                existing["weight"] = max(existing.get("weight", 1), scrubbed.get("weight", 1))
            else:
                out_nodes.append(scrubbed)
            continue
        if contains_personal_identifier(n["id"] + " " + n["label"]):
            scrubbed = scrub_node_for_system(n)
            if scrubbed is None:
                continue
            id_map[n["id"]] = scrubbed["id"]
            out_nodes.append(scrubbed)
            continue
        n2 = scrub_node_for_system(n)
        if n2 is None:
            continue
        id_map[n["id"]] = n2["id"]
        out_nodes.append(n2)

    kept = {n["id"] for n in out_nodes}
    out_edges = []
    seen_e = set()
    for e in all_edges:
        s = id_map.get(e["s"], e["s"])
        t = id_map.get(e["t"], e["t"])
        if s not in kept or t not in kept or s == t:
            continue
        ty = normalize_edge_type(e["type"])
        key = (s, t, ty)
        if key in seen_e:
            continue
        seen_e.add(key)
        out_edges.append({"s": s, "t": t, "type": ty, "w": e["w"]})
    return out_nodes, out_edges


def prune_graph(nodes_, edges_):
    """Drop degree-0 orphans and collapse residual edge aliases."""
    deg = Counter()
    norm_edges = []
    seen = set()
    for e in edges_:
        ty = normalize_edge_type(e["type"])
        key = (e["s"], e["t"], ty)
        if key in seen or e["s"] == e["t"]:
            continue
        seen.add(key)
        norm_edges.append({"s": e["s"], "t": e["t"], "type": ty, "w": e["w"]})
        deg[e["s"]] += 1
        deg[e["t"]] += 1
    # Keep weight>1 orphans (rare hubs pending edges) but drop weight≤1 isolates.
    kept_nodes = [
        n for n in nodes_
        if deg[n["id"]] > 0 or (n.get("weight") or 0) > 1
    ]
    kept_ids = {n["id"] for n in kept_nodes}
    kept_edges = [e for e in norm_edges if e["s"] in kept_ids and e["t"] in kept_ids]
    return kept_nodes, kept_edges


def emit(nodes_, edges_, gz_path, stats_path, sources, data_class):
    nodes_, edges_ = prune_graph(nodes_, edges_)
    meta = {
        "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "root": os.path.basename(ROOT),
        "data_class": data_class,
        "nodes": len(nodes_),
        "edges": len(edges_),
        "sources": sources,
    }
    with gzip.open(gz_path, "wt", encoding="utf-8") as f:
        json.dump({"meta": meta, "nodes": nodes_, "edges": edges_}, f, ensure_ascii=False)
    edge_type_counts = Counter(e["type"] for e in edges_)
    stats_out = {
        "meta": meta,
        "nodes_by_origin": dict(Counter(n["origin"] for n in nodes_)),
        "nodes_by_type": dict(Counter(n["type"] for n in nodes_).most_common()),
        "edges_by_type": dict(edge_type_counts.most_common()),
        "cross_links": {
            "wiki_documents_path": edge_type_counts.get("documents", 0),
            "code_same_file_path": edge_type_counts.get("same_file", 0),
            "concept_term_lexical": edge_type_counts.get("lexical_match", 0),
            "agent_concept_named": edge_type_counts.get("named_as", 0),
            "concept_mentioned_in": edge_type_counts.get("mentioned_in", 0),
            "term_occurs_in": edge_type_counts.get("occurs_in", 0),
            "wiki_inbox_backlink": edge_type_counts.get("backlink", 0),
            "handoff_lineage": edge_type_counts.get("handoff", 0),
            "embedding_similar": edge_type_counts.get("embedding_similar", 0),
        },
    }
    with open(stats_path, "w") as f:
        json.dump(stats_out, f, indent=2)
    print(f"  {data_class}: {len(nodes_):,} nodes / {len(edges_):,} edges -> {os.path.basename(gz_path)}")
    return stats_out


SYS_SOURCES = sorted(SYSTEM_ORIGINS - {"filesystem"}) + ["filesystem"]
# System sources list also advertises scrubbed handoff projection when present.
ALL_SOURCES = sorted(set(SYS_SOURCES) | USER_ORIGINS | {"handoff"})

sys_nodes, sys_edges = system_view(node_list, edge_list)
if any(n["origin"] == "handoff" for n in sys_nodes):
    SYS_SOURCES = sorted(set(SYS_SOURCES) | {"handoff"})
sys_stats = emit(sys_nodes, sys_edges,
                 os.path.join(OUT, "unified_graph.json.gz"),
                 os.path.join(OUT, "unified_graph_stats.json"),
                 SYS_SOURCES, "system")

user_out = ensure_user_out()
emit(node_list, edge_list,
     os.path.join(user_out, "unified_graph_full.json.gz"),
     os.path.join(user_out, "unified_graph_full_stats.json"),
     ALL_SOURCES, "user-full")

print(json.dumps(sys_stats, indent=2)[:3000])
