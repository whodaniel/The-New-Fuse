import re
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..", "..")))
WORKSPACE_ROOT = os.path.abspath(os.getenv("TNF_WORKSPACE_DIR", os.path.join(PROJECT_ROOT, "..")))
KB_ROOT = os.path.abspath(os.getenv("TNF_KB_DIR", os.path.join(WORKSPACE_ROOT, "my-ai-knowledge-base")))
KB_PATH = os.path.join(KB_ROOT, "AI_Knowledge_Base.md")
BATCH_PATH = "batch_output.md"

def merge_and_sort():
    if not os.path.exists(KB_PATH):
        with open(KB_PATH, "w") as f: f.write("# TNF Knowledge Base\n\n")
    
    with open(KB_PATH, "r") as f:
        kb_content = f.read()
    
    indexed_entries = {}
    header = ""
    
    # Parse existing
    sections = kb_content.split("---")
    for sec in sections:
        match = re.search(r"## #(\d+):", sec)
        if match:
            idx = int(match.group(1))
            indexed_entries[idx] = sec.strip()
        else:
            if not indexed_entries and sec.strip():
                header += sec.strip() + "\n"

    # Parse new batch
    if os.path.exists(BATCH_PATH):
        with open(BATCH_PATH, "r") as f:
            batch_content = f.read()
        
        new_sections = batch_content.split("---")
        for sec in new_sections:
            match = re.search(r"## #(\d+):", sec)
            if match:
                idx = int(match.group(1))
                indexed_entries[idx] = sec.strip()

    # Rebuild
    sorted_indices = sorted(indexed_entries.keys())
    new_content = header.strip() + "\n\n"
    for idx in sorted_indices:
        new_content += "---\n\n" + indexed_entries[idx] + "\n\n\n"
    
    with open(KB_PATH, "w") as f:
        f.write(new_content)
    
    print(f"FORGE_MERGE: Successfully merged and sorted {len(indexed_entries)} entries.")
    return sorted_indices

if __name__ == "__main__":
    indices = merge_and_sort()
    if indices:
        print(f"NEW_START_INDEX: {indices[0]}")
        print(f"NEW_END_INDEX: {indices[-1]}")
