import re
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..", "..")))
WORKSPACE_ROOT = os.path.abspath(os.getenv("TNF_WORKSPACE_DIR", os.path.join(PROJECT_ROOT, "..")))
KB_ROOT = os.path.abspath(os.getenv("TNF_KB_DIR", os.path.join(WORKSPACE_ROOT, "my-ai-knowledge-base")))
KB_PATH = os.path.join(KB_ROOT, "AI_Knowledge_Base.md")
BACKUP_PATH = KB_PATH + ".bak"

def sort_kb():
    if not os.path.exists(KB_PATH):
        return
    
    with open(KB_PATH, "r") as f:
        content = f.read()
    
    # Backup
    with open(BACKUP_PATH, "w") as f:
        f.write(content)
    
    # Split by separator
    entries = content.split("---")
    
    # Filter out empty or non-index entries (like headers)
    indexed_entries = []
    header = ""
    
    for entry in entries:
        match = re.search(r"## #(\d+):", entry)
        if match:
            idx = int(match.group(1))
            indexed_entries.append((idx, entry.strip()))
        else:
            if not indexed_entries:
                header += entry
    
    # Sort by index
    indexed_entries.sort(key=lambda x: x[0])
    
    # Rebuild
    new_content = header.strip() + "\n\n"
    for idx, entry in indexed_entries:
        new_content += "---\n\n" + entry + "\n\n\n"
    
    with open(KB_PATH, "w") as f:
        f.write(new_content)
    
    print(f"FORGE: Sorted {len(indexed_entries)} entries in Knowledge Base.")
    return set(x[0] for x in indexed_entries)

if __name__ == "__main__":
    existing_indices = sort_kb()
    print(f"EXISTING_INDICES: {sorted(list(existing_indices))[:10]} ... {sorted(list(existing_indices))[-10:]}")
