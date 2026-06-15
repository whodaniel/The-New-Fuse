import hashlib
import json
import os
import re
import base58

# -----------------------------------------------------------------------------
# Phase 9 FOLLOWUP-1 (audit 2026-06-14): prefix collision policy.
#
# The `ID#:` prefix is currently shared between:
#   - Federated reputation IDs (`idNumber`, sequential int -> Base58, see
#     packages/a2a-core/src/federated-identity.service.ts).
#   - Intelligence vector IDs (`vector_id`, hash bytes -> Base58, see below).
# Operators reading logs must distinguish these. We DO NOT rename the wire
# format at this time because:
#   (a) KNOWLEDGE_TREE.json contains 645 existing vector_ids with the
#       `ID#:` prefix; a rename requires a tree rebuild + downstream
#       synchronization (wiki-inbox/*.json, vector_id consumers).
#   (b) ai-assets search backends and existing consumers key off the prefix
#       in locate/join style.
#
# The reconciliation path, on the next knowledge-tree rebuild, is to switch
# the vector_id prefix to `VEC#:` while keeping `ID#:` for federated IDs.
# Future-prefix variable below documents the convention.
# Tracked as a deliberate decision; see
# docs/protocols/reports/FEDERATED_ID_ENCODING_AUDIT_2026-06-14.md (FOLLOWUP-1).
# -----------------------------------------------------------------------------
VECTOR_ID_LEGACY_PREFIX = 'ID#:'  # current wire format (kept for backward compat)
FEDERATED_ID_PREFIX = 'ID#:'       # canonical FederatedIdentityService output
VECTOR_ID_TARGET_PREFIX = 'VEC#:'  # planned migration target on tree rebuild

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..", "..")))
WORKSPACE_ROOT = os.path.abspath(os.getenv("TNF_WORKSPACE_DIR", os.path.join(PROJECT_ROOT, "..")))
KB_ROOT = os.path.abspath(os.getenv("TNF_KB_DIR", os.path.join(WORKSPACE_ROOT, "my-ai-knowledge-base")))

KB_PATH = os.path.join(KB_ROOT, "AI_Knowledge_Base.md")
PROTOCOL_DIR = os.path.join(PROJECT_ROOT, "docs", "protocols")
OUTPUT_JSON = os.path.join(PROJECT_ROOT, "KNOWLEDGE_TREE.json")

def get_hash(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def generate_id(index):
    # Protocol: ID#:<Base58 encoded sequence>
    # We'll hash the index with a project salt for uniqueness.
    # Prefix follows VECTOR_ID_LEGACY_PREFIX (Phase 9 FOLLOWUP-1).
    salt = "tnf-intelligence-salt-2026"
    raw_hash = hashlib.sha256(f"{salt}-{index}".encode()).digest()
    encoded = base58.b58encode(raw_hash[:8]).decode()
    return f"{VECTOR_ID_LEGACY_PREFIX}{encoded}"

def build_intelligence_branch():
    if not os.path.exists(KB_PATH):
        return {"hash": "0", "classes": {}}
    
    with open(KB_PATH, "r") as f:
        content = f.read()
    
    sections = content.split("---")
    classes = {"Strategic": [], "Procedural": [], "Governance": [], "Purged": [], "Duplicate": []}
    
    for sec in sections:
        match = re.search(r"## #(\d+):", sec)
        if not match: continue
        idx = int(match.group(1))
        
        cl = "Strategic"
        if "- **Procedural:**" in sec: cl = "Procedural"
        if "- **Governance:**" in sec: cl = "Governance"
        if "[STATUS:PURGE]" in sec: cl = "Purged"
        if "[STATUS:DUPLICATE]" in sec: cl = "Duplicate"
        
        h = get_hash(sec.strip())
        vector_id = generate_id(idx)
        
        classes[cl].append({
            "index": idx,
            "hash": h,
            "vector_id": vector_id
        })

    # Sort and Hash classes
    class_nodes = {}
    for cl_name, artifacts in classes.items():
        # Sort artifacts by index for deterministic hashing
        artifacts.sort(key=lambda x: x["index"])
        cl_hash = get_hash("".join([a["hash"] for a in artifacts]))
        class_nodes[cl_name] = {
            "hash": cl_hash,
            "count": len(artifacts),
            "leaves": artifacts
        }
    
    branch_hash = get_hash("".join([c["hash"] for c in class_nodes.values()]))
    return {"hash": branch_hash, "classes": class_nodes}

def build_protocol_branch():
    files = [f for f in os.listdir(PROTOCOL_DIR) if f.endswith(".md")]
    files.sort() # Deterministic
    protocol_nodes = {}
    
    for f_name in files:
        with open(os.path.join(PROTOCOL_DIR, f_name), "r") as f:
            h = get_hash(f.read())
            protocol_nodes[f_name] = {"hash": h}
            
    branch_hash = get_hash("".join([p["hash"] for p in protocol_nodes.values()]))
    return {"hash": branch_hash, "files": protocol_nodes}

def main():
    intel = build_intelligence_branch()
    protocols = build_protocol_branch()
    
    root_hash = get_hash(intel["hash"] + protocols["hash"])
    
    tree = {
        "root": root_hash,
        "libraries": {
            "Library:Intelligence": intel,
            "Library:Protocols": protocols
        },
        "metadata": {
            "timestamp": "2026-04-30T01:30Z",
            "status": "[STATUS:SYNCHRONIZED]"
        }
    }
    
    with open(OUTPUT_JSON, "w") as f:
        json.dump(tree, f, indent=2)
    
    print(f"FORGE: Merkle Knowledge Tree (with ID#) generated at {OUTPUT_JSON}")
    print(f"ROOT_HASH: {root_hash}")

if __name__ == "__main__":
    main()
